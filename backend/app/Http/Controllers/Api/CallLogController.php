<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CallLog;
use App\Models\Lead;
use Illuminate\Http\Request;

class CallLogController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = CallLog::with(['lead', 'user'])->latest();

        if ($user->role === 'telecaller') {
            $query->where('user_id', $user->id);
        } else {
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->user_id);
            }
        }

        if ($request->filled('lead_id')) {
            $query->where('lead_id', $request->lead_id);
        }

        if ($request->filled('call_status')) {
            $query->where('call_status', $request->call_status);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'lead_id' => 'required|exists:leads,id',
            'call_status' => 'required|string|in:connected,no_answer,busy,switched_off,callback_requested',
            'outcome' => 'nullable|string|in:interested,not_interested,follow_up,quote_sent,meeting_scheduled,closed_won,closed_lost',
            'notes' => 'required|string',
            'follow_up_date' => 'nullable|date',
            'duration_seconds' => 'nullable|integer',
        ]);

        $lead = Lead::findOrFail($validated['lead_id']);

        // Check permission if telecaller
        if ($user->role === 'telecaller' && $lead->assigned_to !== $user->id) {
            return response()->json(['message' => 'You can only log calls for leads assigned to you.'], 403);
        }

        // 1. Create Call Log
        $callLog = CallLog::create([
            'lead_id' => $lead->id,
            'user_id' => $user->id,
            'call_status' => $validated['call_status'],
            'outcome' => $validated['outcome'] ?? null,
            'notes' => $validated['notes'],
            'follow_up_date' => $validated['follow_up_date'] ?? null,
            'duration_seconds' => $validated['duration_seconds'] ?? null,
        ]);

        // 2. Update Lead status and metadata
        $newStatus = $lead->status;
        if (!empty($validated['outcome'])) {
            $newStatus = $validated['outcome'];
        } elseif ($validated['call_status'] === 'connected') {
            $newStatus = 'connected';
        } else {
            $newStatus = 'not_connected';
        }

        $lead->update([
            'status' => $newStatus,
            'last_call_status' => $validated['call_status'],
            'call_attempts' => $lead->call_attempts + 1,
            'last_contacted_at' => now(),
            'next_follow_up_date' => $validated['follow_up_date'] ?? null,
        ]);

        $freshLead = $lead->fresh(['assignedUser', 'callLogs.user']);
        if ($user->role === 'telecaller') {
            $freshLead->sanitizeForTelecaller();
        }

        return response()->json([
            'message' => 'Call logged successfully.',
            'call_log' => $callLog->load('user'),
            'lead' => $freshLead,
        ], 201);
    }
}
