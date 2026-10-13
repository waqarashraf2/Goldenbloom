<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Lead::with('assignedUser')->latest('updated_at');

        // RBAC: Telecallers ONLY see leads assigned to them
        if ($user->role === 'telecaller') {
            $query->where('assigned_to', $user->id);
        } else {
            // Admin filter by assigned agent
            if ($request->filled('assigned_to')) {
                if ($request->assigned_to === 'unassigned') {
                    $query->whereNull('assigned_to');
                } else {
                    $query->where('assigned_to', $request->assigned_to);
                }
            }
        }

        // Filter by source
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by last call status
        if ($request->filled('last_call_status')) {
            $query->where('last_call_status', $request->last_call_status);
        }

        // Search by keyword (name, phone, email, service)
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('service_requested', 'like', "%{$search}%")
                  ->orWhere('campaign_name', 'like', "%{$search}%");
            });
        }

        // Filter: Today's / Overdue Follow-ups
        if ($request->boolean('today_followups')) {
            $endOfDay = Carbon::today()->endOfDay();
            $query->whereNotNull('next_follow_up_date')
                  ->where('next_follow_up_date', '<=', $endOfDay)
                  ->whereNotIn('status', ['closed_won', 'closed_lost', 'not_interested']);
        }

        $perPage = (int) $request->get('per_page', 15);
        $leads = $query->paginate($perPage);

        return response()->json($leads);
    }

    public function show(Request $request, Lead $lead)
    {
        $user = $request->user();

        // Security check for telecaller
        if ($user->role === 'telecaller' && $lead->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized access to this lead.'], 403);
        }

        $lead->load(['assignedUser', 'callLogs.user']);

        return response()->json($lead);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'source' => 'nullable|string|max:50',
            'service_requested' => 'nullable|string|max:255',
            'campaign_name' => 'nullable|string|max:255',
            'ad_name' => 'nullable|string|max:255',
            'lead_notes' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $assignedTo = null;
        if ($user->role === 'telecaller') {
            $assignedTo = $user->id; // Telecaller adding lead automatically assigns to self
        } elseif ($user->role === 'admin' && !empty($validated['assigned_to'])) {
            $assignedTo = $validated['assigned_to'];
        }

        $lead = Lead::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'source' => $validated['source'] ?? 'manual',
            'status' => 'new',
            'service_requested' => $validated['service_requested'] ?? null,
            'campaign_name' => $validated['campaign_name'] ?? null,
            'ad_name' => $validated['ad_name'] ?? null,
            'lead_notes' => $validated['lead_notes'] ?? null,
            'assigned_to' => $assignedTo,
            'assigned_at' => $assignedTo ? now() : null,
        ]);

        return response()->json([
            'message' => 'Lead created successfully.',
            'lead' => $lead->load('assignedUser'),
        ], 201);
    }

    public function update(Request $request, Lead $lead)
    {
        $user = $request->user();

        if ($user->role === 'telecaller' && $lead->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:50',
            'email' => 'nullable|email|max:255',
            'service_requested' => 'nullable|string|max:255',
            'lead_notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $lead->update($validated);

        return response()->json([
            'message' => 'Lead updated successfully.',
            'lead' => $lead->load('assignedUser'),
        ]);
    }

    // Assign single or multiple leads (Admin Only)
    public function assign(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Only admins can assign leads.'], 403);
        }

        $validated = $request->validate([
            'lead_ids' => 'required|array',
            'lead_ids.*' => 'exists:leads,id',
            'user_id' => 'nullable|exists:users,id', // null means unassign
        ]);

        $userId = $validated['user_id'];
        $assignedAt = $userId ? now() : null;

        Lead::whereIn('id', $validated['lead_ids'])->update([
            'assigned_to' => $userId,
            'assigned_at' => $assignedAt,
        ]);

        return response()->json([
            'message' => count($validated['lead_ids']) . ' lead(s) successfully assigned.',
        ]);
    }

    // Auto round-robin distribute unassigned leads (Admin Only)
    public function autoDistribute(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $telecallers = User::where('role', 'telecaller')->where('is_active', true)->get();

        if ($telecallers->isEmpty()) {
            return response()->json(['message' => 'No active telecallers found to distribute leads.'], 422);
        }

        $unassignedLeads = Lead::whereNull('assigned_to')->orderBy('id', 'asc')->get();

        if ($unassignedLeads->isEmpty()) {
            return response()->json(['message' => 'No unassigned leads found.'], 200);
        }

        $count = $telecallers->count();
        $index = 0;
        $distributedCount = 0;

        foreach ($unassignedLeads as $lead) {
            $agent = $telecallers[$index % $count];
            $lead->update([
                'assigned_to' => $agent->id,
                'assigned_at' => now(),
            ]);
            $index++;
            $distributedCount++;
        }

        return response()->json([
            'message' => "Successfully distributed {$distributedCount} leads among {$count} telecallers evenly.",
            'distributed_count' => $distributedCount,
        ]);
    }

    // Import CSV (Drag & Drop, duplicate check)
    public function importCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
            'source' => 'nullable|string',
            'campaign_name' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');

        if (!$handle) {
            return response()->json(['message' => 'Could not read CSV file.'], 422);
        }

        $header = fgetcsv($handle, 2000, ',');
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'CSV file is empty.'], 422);
        }

        // Normalize header keys
        $normalizedHeader = array_map(function ($col) {
            return strtolower(trim(preg_replace('/[^A-Za-z0-9_]/', '_', $col)));
        }, $header);

        // Find index of crucial fields
        $nameIdx = -1;
        $phoneIdx = -1;
        $emailIdx = -1;
        $serviceIdx = -1;
        $notesIdx = -1;

        foreach ($normalizedHeader as $idx => $col) {
            if ($nameIdx === -1 && (str_contains($col, 'name') || str_contains($col, 'full_name') || str_contains($col, 'client'))) $nameIdx = $idx;
            if ($phoneIdx === -1 && (str_contains($col, 'phone') || str_contains($col, 'mobile') || str_contains($col, 'contact') || str_contains($col, 'number') || str_contains($col, 'tel'))) $phoneIdx = $idx;
            if ($emailIdx === -1 && (str_contains($col, 'email') || str_contains($col, 'mail'))) $emailIdx = $idx;
            if ($serviceIdx === -1 && (str_contains($col, 'service') || str_contains($col, 'product') || str_contains($col, 'requirement') || str_contains($col, 'flower') || str_contains($col, 'item'))) $serviceIdx = $idx;
            if ($notesIdx === -1 && (str_contains($col, 'note') || str_contains($col, 'message') || str_contains($col, 'comment') || str_contains($col, 'detail'))) $notesIdx = $idx;
        }

        if ($phoneIdx === -1 && $nameIdx === -1) {
            fclose($handle);
            return response()->json(['message' => 'CSV must contain at least a "Name" or "Phone" column.'], 422);
        }

        $imported = 0;
        $duplicatesSkipped = 0;
        $defaultSource = $request->input('source', 'csv_import');
        $campaign = $request->input('campaign_name', 'CSV Batch ' . date('Y-m-d'));

        while (($row = fgetcsv($handle, 2000, ',')) !== false) {
            if (empty(array_filter($row))) continue;

            $name = $nameIdx !== -1 && isset($row[$nameIdx]) ? trim($row[$nameIdx]) : 'Unknown Lead';
            $phone = $phoneIdx !== -1 && isset($row[$phoneIdx]) ? preg_replace('/[^\+0-9]/', '', trim($row[$phoneIdx])) : '';
            $email = $emailIdx !== -1 && isset($row[$emailIdx]) ? trim($row[$emailIdx]) : null;
            $service = $serviceIdx !== -1 && isset($row[$serviceIdx]) ? trim($row[$serviceIdx]) : null;
            $notes = $notesIdx !== -1 && isset($row[$notesIdx]) ? trim($row[$notesIdx]) : null;

            if (empty($phone) && empty($email)) {
                continue;
            }

            // Check duplicate by phone
            $existing = Lead::where('phone', $phone)->first();
            if ($existing) {
                $duplicatesSkipped++;
                continue;
            }

            Lead::create([
                'name' => $name ?: 'Lead ' . $phone,
                'phone' => $phone,
                'email' => $email,
                'source' => $defaultSource,
                'status' => 'new',
                'service_requested' => $service,
                'campaign_name' => $campaign,
                'lead_notes' => $notes,
            ]);

            $imported++;
        }

        fclose($handle);

        return response()->json([
            'message' => "Import complete: {$imported} leads imported, {$duplicatesSkipped} duplicates skipped.",
            'imported' => $imported,
            'duplicates_skipped' => $duplicatesSkipped,
        ]);
    }

    // Export CSV (Admin Only)
    public function exportCsv(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $leads = Lead::with('assignedUser')->latest()->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="goldenbloom_leads_' . date('Y-m-d_His') . '.csv"',
        ];

        $callback = function () use ($leads) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Name', 'Phone', 'Email', 'Source', 'Status', 'Assigned To', 'Service Requested', 'Campaign', 'Last Call Status', 'Call Attempts', 'Next Followup Date', 'Created At']);

            foreach ($leads as $l) {
                fputcsv($handle, [
                    $l->id,
                    $l->name,
                    $l->phone,
                    $l->email,
                    $l->source,
                    $l->status,
                    $l->assignedUser ? $l->assignedUser->name : 'Unassigned',
                    $l->service_requested,
                    $l->campaign_name,
                    $l->last_call_status,
                    $l->call_attempts,
                    $l->next_follow_up_date ? $l->next_follow_up_date->format('Y-m-d H:i') : '',
                    $l->created_at->format('Y-m-d H:i'),
                ]);
            }
            fclose($handle);
        };

        return new StreamedResponse($callback, 200, $headers);
    }

    public function destroy(Request $request, Lead $lead)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Only admins can delete leads.'], 403);
        }

        $lead->delete();

        return response()->json(['message' => 'Lead deleted successfully.']);
    }
}
