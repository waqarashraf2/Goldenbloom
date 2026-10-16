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
    private function applyLeadFilters($query, Request $request, $user)
    {
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

        // Search by keyword (name, phone, email, service, campaign, notes)
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('service_requested', 'like', "%{$search}%")
                  ->orWhere('campaign_name', 'like', "%{$search}%")
                  ->orWhere('lead_notes', 'like', "%{$search}%");
            });
        }

        // Date Presets (Created Date)
        if ($request->filled('date_preset')) {
            switch ($request->date_preset) {
                case 'today':
                    $query->whereDate('created_at', Carbon::today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', Carbon::yesterday());
                    break;
                case 'this_week':
                    $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()]);
                    break;
            }
        }

        // Custom Date Range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Follow-up Preset / Filter
        if ($request->filled('followup_preset')) {
            switch ($request->followup_preset) {
                case 'today':
                    $query->whereDate('next_follow_up_date', Carbon::today())
                          ->whereNotIn('status', ['closed_won', 'closed_lost', 'not_interested']);
                    break;
                case 'overdue':
                    $query->whereNotNull('next_follow_up_date')
                          ->where('next_follow_up_date', '<', Carbon::now())
                          ->whereNotIn('status', ['closed_won', 'closed_lost', 'not_interested']);
                    break;
                case 'upcoming':
                    $query->whereNotNull('next_follow_up_date')
                          ->where('next_follow_up_date', '>', Carbon::today()->endOfDay())
                          ->whereNotIn('status', ['closed_won', 'closed_lost', 'not_interested']);
                    break;
            }
        }

        // Legacy boolean for today follow-ups
        if ($request->boolean('today_followups')) {
            $endOfDay = Carbon::today()->endOfDay();
            $query->whereNotNull('next_follow_up_date')
                  ->where('next_follow_up_date', '<=', $endOfDay)
                  ->whereNotIn('status', ['closed_won', 'closed_lost', 'not_interested']);
        }

        return $query;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Lead::with(['assignedUser', 'callLogs' => function ($q) {
            $q->with('user')->latest();
        }])->latest('updated_at');

        $this->applyLeadFilters($query, $request, $user);

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

        $cleanPhone = preg_replace('/[^\+0-9]/', '', $validated['phone']);
        $existing = Lead::where('phone', $cleanPhone)->first();
        $timestamp = date('d M Y, h:i A');

        if ($existing) {
            $existingCustom = $existing->custom_fields ?? [];
            $existingSubmissions = !empty($existingCustom['submissions']) && is_array($existingCustom['submissions'])
                ? $existingCustom['submissions']
                : [
                    [
                        'inquiry_number' => 1,
                        'received_at' => $existing->created_at ? $existing->created_at->format('d M Y, h:i A') : $timestamp,
                        'service' => $existing->service_requested,
                        'campaign' => $existing->campaign_name,
                        'source' => $existing->source,
                        'notes' => $existing->lead_notes,
                        'custom_fields' => array_diff_key($existingCustom, ['submissions' => true, 'submissions_count' => true]),
                    ]
                ];

            $newSubmissionNumber = count($existingSubmissions) + 1;
            $newSubmission = [
                'inquiry_number' => $newSubmissionNumber,
                'received_at' => $timestamp,
                'service' => $validated['service_requested'] ?? $existing->service_requested,
                'campaign' => $validated['campaign_name'] ?? $existing->campaign_name,
                'source' => $validated['source'] ?? 'manual',
                'notes' => $validated['lead_notes'] ?? 'Manual lead re-entry',
                'custom_fields' => [],
            ];
            $existingSubmissions[] = $newSubmission;
            $existingCustom['submissions'] = $existingSubmissions;
            $existingCustom['submissions_count'] = count($existingSubmissions);

            $existing->update([
                'lead_notes' => ($existing->lead_notes ? $existing->lead_notes . "\n\n" : "") . "[Inquiry #{$newSubmissionNumber} on {$timestamp} via manual]: " . ($validated['lead_notes'] ?? 'Lead resubmitted.'),
                'service_requested' => $validated['service_requested'] ?? $existing->service_requested,
                'custom_fields' => $existingCustom,
            ]);

            return response()->json([
                'message' => "Lead already exists with this phone number. Inquiry #{$newSubmissionNumber} added to history.",
                'lead' => $existing->load('assignedUser'),
                'is_duplicate' => true,
            ], 200);
        }

        $assignedTo = null;
        if ($user->role === 'telecaller') {
            $assignedTo = $user->id; // Telecaller adding lead manually assigns to self
        } elseif ($user->role === 'admin' && !empty($validated['assigned_to'])) {
            $assignedTo = $validated['assigned_to'];
        }

        $initialCustom = [
            'submissions' => [
                [
                    'inquiry_number' => 1,
                    'received_at' => $timestamp,
                    'service' => $validated['service_requested'] ?? null,
                    'campaign' => $validated['campaign_name'] ?? null,
                    'source' => $validated['source'] ?? 'manual',
                    'notes' => $validated['lead_notes'] ?? null,
                    'custom_fields' => [],
                ]
            ],
            'submissions_count' => 1,
        ];

        $lead = Lead::create([
            'name' => $validated['name'],
            'phone' => $cleanPhone ?: $validated['phone'],
            'email' => $validated['email'] ?? null,
            'source' => $validated['source'] ?? 'manual',
            'status' => 'new',
            'service_requested' => $validated['service_requested'] ?? null,
            'campaign_name' => $validated['campaign_name'] ?? null,
            'ad_name' => $validated['ad_name'] ?? null,
            'lead_notes' => $validated['lead_notes'] ?? null,
            'assigned_to' => $assignedTo,
            'assigned_at' => $assignedTo ? now() : null,
            'custom_fields' => $initialCustom,
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
        $campaignIdx = -1;
        $platformIdx = -1;
        $locationIdx = -1;
        $propertyIdx = -1;
        $timelineIdx = -1;

        foreach ($normalizedHeader as $idx => $col) {
            if ($nameIdx === -1 && (str_contains($col, 'name') || str_contains($col, 'full_name') || str_contains($col, 'client'))) $nameIdx = $idx;
            if ($phoneIdx === -1 && (str_contains($col, 'phone') || str_contains($col, 'mobile') || str_contains($col, 'contact') || str_contains($col, 'number') || str_contains($col, 'tel'))) $phoneIdx = $idx;
            if ($emailIdx === -1 && (str_contains($col, 'email') || str_contains($col, 'mail'))) $emailIdx = $idx;
            if ($serviceIdx === -1 && (str_contains($col, 'service') || str_contains($col, 'product') || str_contains($col, 'requirement') || str_contains($col, 'flower') || str_contains($col, 'item'))) $serviceIdx = $idx;
            if ($notesIdx === -1 && (str_contains($col, 'note') || str_contains($col, 'message') || str_contains($col, 'comment') || str_contains($col, 'detail'))) $notesIdx = $idx;
            if ($campaignIdx === -1 && str_contains($col, 'campaign')) $campaignIdx = $idx;
            if ($platformIdx === -1 && str_contains($col, 'platform')) $platformIdx = $idx;
            if ($locationIdx === -1 && (str_contains($col, 'location') || str_contains($col, 'villa') || str_contains($col, 'city') || str_contains($col, 'area'))) $locationIdx = $idx;
            if ($propertyIdx === -1 && str_contains($col, 'property')) $propertyIdx = $idx;
            if ($timelineIdx === -1 && str_contains($col, 'timeline')) $timelineIdx = $idx;
        }

        if ($phoneIdx === -1 && $nameIdx === -1) {
            fclose($handle);
            return response()->json(['message' => 'CSV must contain at least a "Name" or "Phone" column.'], 422);
        }

        $imported = 0;
        $duplicatesSkipped = 0;
        $defaultSource = $request->input('source', 'csv_import');
        $defaultCampaign = $request->input('campaign_name', 'CSV Batch ' . date('Y-m-d'));

        while (($row = fgetcsv($handle, 2000, ',')) !== false) {
            if (empty(array_filter($row))) continue;

            $name = $nameIdx !== -1 && isset($row[$nameIdx]) ? trim($row[$nameIdx]) : '';
            $phone = $phoneIdx !== -1 && isset($row[$phoneIdx]) ? preg_replace('/[^\+0-9]/', '', trim($row[$phoneIdx])) : '';
            $email = $emailIdx !== -1 && isset($row[$emailIdx]) ? trim($row[$emailIdx]) : null;
            $service = $serviceIdx !== -1 && isset($row[$serviceIdx]) ? trim($row[$serviceIdx]) : null;
            $notes = $notesIdx !== -1 && isset($row[$notesIdx]) ? trim($row[$notesIdx]) : null;

            if (empty($phone) && empty($email)) {
                continue;
            }

            if (empty($name)) {
                $name = $phone ? ('Lead ' . $phone) : 'Inbound Lead';
            }

            // Gather all custom / extra columns
            $customFields = [];
            foreach ($normalizedHeader as $idx => $colKey) {
                if ($idx !== $nameIdx && $idx !== $phoneIdx && $idx !== $emailIdx && $idx !== $serviceIdx && $idx !== $notesIdx) {
                    if (isset($row[$idx]) && trim($row[$idx]) !== '') {
                        $customFields[$colKey] = trim($row[$idx]);
                    }
                }
            }

            // Auto-generate rich note if note is blank
            if (empty($notes)) {
                $summaryParts = [];
                if ($locationIdx !== -1 && !empty($row[$locationIdx])) $summaryParts[] = "Location: " . trim($row[$locationIdx]);
                if ($propertyIdx !== -1 && !empty($row[$propertyIdx])) $summaryParts[] = "Property: " . ucfirst(str_replace('_', ' ', trim($row[$propertyIdx])));
                if ($timelineIdx !== -1 && !empty($row[$timelineIdx])) $summaryParts[] = "Timeline: " . ucfirst(str_replace('_', ' ', trim($row[$timelineIdx])));
                if ($platformIdx !== -1 && !empty($row[$platformIdx])) $summaryParts[] = "Platform: " . strtoupper(trim($row[$platformIdx]));
                if (!empty($summaryParts)) {
                    $notes = implode(" | ", $summaryParts);
                }
            }

            // Auto-detect source from platform column
            $leadSource = $defaultSource;
            if ($platformIdx !== -1 && !empty($row[$platformIdx])) {
                $plat = strtolower(trim($row[$platformIdx]));
                if ($plat === 'ig' || $plat === 'instagram') $leadSource = 'instagram_ads';
                elseif ($plat === 'fb' || $plat === 'facebook') $leadSource = 'facebook_ads';
            }

            $leadCampaign = ($campaignIdx !== -1 && !empty($row[$campaignIdx])) ? trim($row[$campaignIdx]) : $defaultCampaign;

            $timestamp = date('d M Y, h:i A');

            // Check duplicate by phone
            $existing = Lead::where('phone', $phone)->first();
            if ($existing) {
                $existingCustom = $existing->custom_fields ?? [];
                $existingSubmissions = !empty($existingCustom['submissions']) && is_array($existingCustom['submissions'])
                    ? $existingCustom['submissions']
                    : [
                        [
                            'inquiry_number' => 1,
                            'received_at' => $existing->created_at ? $existing->created_at->format('d M Y, h:i A') : $timestamp,
                            'service' => $existing->service_requested,
                            'campaign' => $existing->campaign_name,
                            'source' => $existing->source,
                            'notes' => $existing->lead_notes,
                            'custom_fields' => array_diff_key($existingCustom, ['submissions' => true, 'submissions_count' => true]),
                        ]
                    ];

                $newSubmissionNumber = count($existingSubmissions) + 1;
                $newSubmission = [
                    'inquiry_number' => $newSubmissionNumber,
                    'received_at' => $timestamp,
                    'service' => $service ?: $existing->service_requested,
                    'campaign' => $leadCampaign ?: $existing->campaign_name,
                    'source' => $leadSource,
                    'notes' => $notes ?: 'Imported repeat CSV inquiry',
                    'custom_fields' => $customFields,
                ];

                $existingSubmissions[] = $newSubmission;
                $mergedCustom = array_merge($existingCustom, $customFields);
                $mergedCustom['submissions'] = $existingSubmissions;
                $mergedCustom['submissions_count'] = count($existingSubmissions);

                $existing->update([
                    'lead_notes' => ($existing->lead_notes ? $existing->lead_notes . "\n\n" : "") . "[Inquiry #{$newSubmissionNumber} on {$timestamp} via {$leadSource}]: " . ($notes ?: ($service ? "Service: {$service}" : "CSV repeat submission.")),
                    'service_requested' => $service ?: $existing->service_requested,
                    'custom_fields' => $mergedCustom,
                ]);

                $duplicatesSkipped++;
                continue;
            }

            $initialSubmissions = [
                [
                    'inquiry_number' => 1,
                    'received_at' => $timestamp,
                    'service' => $service,
                    'campaign' => $leadCampaign,
                    'source' => $leadSource,
                    'notes' => $notes,
                    'custom_fields' => $customFields,
                ]
            ];
            $customFields['submissions'] = $initialSubmissions;
            $customFields['submissions_count'] = 1;

            Lead::create([
                'name' => $name,
                'phone' => $phone,
                'email' => $email,
                'source' => $leadSource,
                'status' => 'new',
                'service_requested' => $service,
                'campaign_name' => $leadCampaign,
                'lead_notes' => $notes,
                'custom_fields' => $customFields,
                'assigned_to' => null,
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

        $query = Lead::with('assignedUser')->latest();
        $this->applyLeadFilters($query, $request, $request->user());
        $leads = $query->get();

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
