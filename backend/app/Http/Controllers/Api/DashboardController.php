<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CallLog;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();
        $endOfToday = Carbon::today()->endOfDay();

        if ($user->role === 'telecaller') {
            // Telecaller specific stats
            $myLeadsQuery = Lead::where('assigned_to', $user->id);
            $totalAssigned = (clone $myLeadsQuery)->count();
            $newLeads = (clone $myLeadsQuery)->where('status', 'new')->count();
            
            $todayFollowups = (clone $myLeadsQuery)
                ->whereNotNull('next_follow_up_date')
                ->where('next_follow_up_date', '<=', $endOfToday)
                ->whereNotIn('status', ['closed_won', 'closed_lost', 'not_interested'])
                ->count();

            $callsToday = CallLog::where('user_id', $user->id)
                ->whereDate('created_at', $today)
                ->count();

            $connectedCalls = CallLog::where('user_id', $user->id)
                ->where('call_status', 'connected')
                ->count();

            $totalCalls = CallLog::where('user_id', $user->id)->count();

            $dealsWon = (clone $myLeadsQuery)->where('status', 'closed_won')->count();

            return response()->json([
                'role' => 'telecaller',
                'stats' => [
                    'total_assigned' => $totalAssigned,
                    'new_leads' => $newLeads,
                    'today_followups' => $todayFollowups,
                    'calls_today' => $callsToday,
                    'total_calls' => $totalCalls,
                    'connected_calls' => $connectedCalls,
                    'connection_rate' => $totalCalls > 0 ? round(($connectedCalls / $totalCalls) * 100, 1) : 0,
                    'deals_won' => $dealsWon,
                ],
            ]);
        }

        // Admin stats
        $totalLeads = Lead::count();
        $websiteLeads = Lead::where('source', 'website')->count();
        $facebookLeads = Lead::where('source', 'facebook_ads')->count();
        $googleSheetLeads = Lead::where('source', 'google_sheet')->count();
        $csvLeads = Lead::where('source', 'csv_import')->count();
        $unassignedLeads = Lead::whereNull('assigned_to')->count();

        $todayFollowups = Lead::whereNotNull('next_follow_up_date')
            ->where('next_follow_up_date', '<=', $endOfToday)
            ->whereNotIn('status', ['closed_won', 'closed_lost', 'not_interested'])
            ->count();

        $totalCalls = CallLog::count();
        $callsToday = CallLog::whereDate('created_at', $today)->count();
        $connectedCalls = CallLog::where('call_status', 'connected')->count();
        $dealsWon = Lead::where('status', 'closed_won')->count();

        // Telecaller Performance Table with Deep Dive Stats
        $telecallers = User::where('role', 'telecaller')->get()->map(function ($agent) {
            $assigned = Lead::where('assigned_to', $agent->id)->count();
            $agentCallsQuery = CallLog::where('user_id', $agent->id);
            $totalCalls = (clone $agentCallsQuery)->count();
            $connected = (clone $agentCallsQuery)->where('call_status', 'connected')->count();
            $busy = (clone $agentCallsQuery)->where('call_status', 'busy')->count();
            $noAnswer = (clone $agentCallsQuery)->where('call_status', 'no_answer')->count();
            $switchedOff = (clone $agentCallsQuery)->where('call_status', 'switched_off')->count();
            $callback = (clone $agentCallsQuery)->where('call_status', 'callback_requested')->count();
            $dealsWon = Lead::where('assigned_to', $agent->id)->where('status', 'closed_won')->count();
            $pendingFollowups = Lead::where('assigned_to', $agent->id)
                ->whereNotNull('next_follow_up_date')
                ->whereNotIn('status', ['closed_won', 'closed_lost', 'not_interested'])
                ->count();

            // Recent 15 call logs of this telecaller with comments
            $recentAgentCalls = (clone $agentCallsQuery)
                ->with(['lead:id,name,phone,source,status'])
                ->latest()
                ->take(15)
                ->get();

            return [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'phone' => $agent->phone,
                'is_active' => $agent->is_active,
                'assigned_leads' => $assigned,
                'total_calls' => $totalCalls,
                'connected_calls' => $connected,
                'busy_calls' => $busy,
                'no_answer_calls' => $noAnswer,
                'switched_off_calls' => $switchedOff,
                'callback_calls' => $callback,
                'connection_rate' => $totalCalls > 0 ? round(($connected / $totalCalls) * 100, 1) : 0,
                'pending_followups' => $pendingFollowups,
                'deals_won' => $dealsWon,
                'recent_calls' => $recentAgentCalls,
            ];
        });

        // Recent 10 Call Activities
        $recentActivities = CallLog::with(['user', 'lead'])->latest()->take(10)->get();

        return response()->json([
            'role' => 'admin',
            'stats' => [
                'total_leads' => $totalLeads,
                'website_leads' => $websiteLeads,
                'facebook_leads' => $facebookLeads,
                'google_sheet_leads' => $googleSheetLeads,
                'csv_leads' => $csvLeads,
                'unassigned_leads' => $unassignedLeads,
                'today_followups' => $todayFollowups,
                'calls_today' => $callsToday,
                'total_calls' => $totalCalls,
                'connected_calls' => $connectedCalls,
                'connection_rate' => $totalCalls > 0 ? round(($connectedCalls / $totalCalls) * 100, 1) : 0,
                'deals_won' => $dealsWon,
            ],
            'telecaller_performance' => $telecallers,
            'recent_activities' => $recentActivities,
        ]);
    }
}
