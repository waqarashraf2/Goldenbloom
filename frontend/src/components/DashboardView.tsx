'use client';

import React, { useState } from 'react';
import { DashboardStats, User, CallLog } from '@/lib/api';
import { 
  Users, PhoneCall, CheckCircle2, Clock, Globe, FileSpreadsheet, 
  Award, ArrowUpRight, Flame, MessageSquare, Calendar, ChevronRight
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  currentUser: User | null;
  onNavigateToLeads: (filter?: { source?: string; today_followups?: boolean }) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({ stats, currentUser, onNavigateToLeads, onNavigateToTab }: DashboardViewProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  if (!stats) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse text-xs">
        Loading Golden Bloom CRM Metrics...
      </div>
    );
  }

  const isTelecaller = currentUser?.role === 'telecaller';
  const data = stats.stats;

  const inspectedAgent = stats.telecaller_performance?.find(a => a.id === selectedAgentId) 
    || stats.telecaller_performance?.[0] || null;

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      
      {/* Sleek Compact Welcome Header */}
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold text-xs">
            {currentUser?.name?.charAt(0) || 'G'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Welcome, {currentUser?.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                {isTelecaller ? 'Telecaller' : 'Executive Overview'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1">
              {isTelecaller
                ? 'Track your assigned leads, today\'s follow-up queue, and connection ratios.'
                : 'Real-time overview of website inquiries, Meta Ads, and sales team activities.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigateToLeads({ today_followups: true })}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today's Follow-ups ({data.today_followups})</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards (Compact High-Density) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        
        {/* Card 1: Leads Count */}
        <div 
          onClick={() => onNavigateToLeads()} 
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isTelecaller ? 'My Leads' : 'Total Leads'}
            </span>
            <span className="p-1 rounded-md bg-amber-50 text-amber-800">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {isTelecaller ? data.total_assigned : data.total_leads}
            </span>
            {!isTelecaller && data.unassigned_leads && data.unassigned_leads > 0 ? (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
                {data.unassigned_leads} unassigned
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-0.5 font-medium">
            View leads <ArrowUpRight className="w-3 h-3" />
          </p>
        </div>

        {/* Card 2: Today's Follow-ups */}
        <div 
          onClick={() => onNavigateToLeads({ today_followups: true })}
          className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs hover:border-amber-400 transition cursor-pointer group bg-gradient-to-br from-white to-amber-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Follow-ups Today
            </span>
            <span className="p-1 rounded-md bg-amber-100 text-amber-800">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-900 tracking-tight">
              {data.today_followups}
            </span>
            <span className="text-[10px] font-semibold text-amber-700">scheduled</span>
          </div>
          <p className="text-[11px] text-amber-800/80 mt-1 flex items-center gap-0.5 font-semibold">
            Open queue <ArrowUpRight className="w-3 h-3" />
          </p>
        </div>

        {/* Card 3: Calls Connection Rate */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Connection Rate
            </span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
              <PhoneCall className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {data.connection_rate}%
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
              {data.connected_calls}/{data.total_calls} calls
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Calls today: <strong className="text-slate-700">{data.calls_today}</strong>
          </p>
        </div>

        {/* Card 4: Deals Won */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Deals Won
            </span>
            <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
              <Award className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-700 tracking-tight">
              {data.deals_won}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">closed orders</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Active conversions
          </p>
        </div>

      </div>

      {/* Inbound Channels Breakdown (Compact Sleek Micro-Cards) */}
      {!isTelecaller && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
          <div 
            onClick={() => onNavigateToLeads({ source: 'website' })}
            className="p-2.5 px-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition cursor-pointer shadow-2xs flex items-center justify-between group"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Globe className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="truncate">Website Form</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">goldenbloom.ae</span>
            </div>
            <span className="text-base font-black text-slate-900 group-hover:text-amber-800 transition bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {data.website_leads || 0}
            </span>
          </div>

          <div 
            onClick={() => onNavigateToLeads({ source: 'facebook_ads' })}
            className="p-2.5 px-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition cursor-pointer shadow-2xs flex items-center justify-between group"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black flex-shrink-0">f</span>
                <span className="truncate">Meta Ads</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">FB &amp; Instagram</span>
            </div>
            <span className="text-base font-black text-slate-900 group-hover:text-amber-800 transition bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {data.facebook_leads || 0}
            </span>
          </div>

          <div 
            onClick={() => onNavigateToLeads({ source: 'google_sheet' })}
            className="p-2.5 px-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition cursor-pointer shadow-2xs flex items-center justify-between group"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">Google Sheets</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Apps Script Sync</span>
            </div>
            <span className="text-base font-black text-slate-900 group-hover:text-amber-800 transition bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {data.google_sheet_leads || 0}
            </span>
          </div>

          <div 
            onClick={() => onNavigateToLeads({ source: 'csv_import' })}
            className="p-2.5 px-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition cursor-pointer shadow-2xs flex items-center justify-between group"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="truncate">CSV Imports</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Uploaded Batches</span>
            </div>
            <span className="text-base font-black text-slate-900 group-hover:text-amber-800 transition bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {data.csv_leads || 0}
            </span>
          </div>
        </div>
      )}

      {/* TELECALLER PERFORMANCE & DEEP DIVE INSPECTOR */}
      {!isTelecaller && stats.telecaller_performance && (
        <div className="space-y-2.5 pt-1">
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-700" />
                Telecaller Performance &amp; Activity Inspector
              </h2>
              <p className="text-[11px] text-slate-500">
                Click any agent to inspect their connection rates, busy calls, and detailed client discussion notes.
              </p>
            </div>
          </div>

          {/* Telecallers Selectable Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            {stats.telecaller_performance.map((agent) => {
              const isSelected = selectedAgentId === agent.id || (!selectedAgentId && stats.telecaller_performance?.[0]?.id === agent.id);

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                    isSelected 
                      ? 'bg-amber-50/60 border-amber-600 ring-2 ring-amber-600/50 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-800 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {agent.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-xs truncate">{agent.name}</h3>
                        <p className="text-[10px] text-slate-400 truncate">{agent.email}</p>
                      </div>
                    </div>

                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      agent.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs mt-2">
                    <div className="p-1 bg-white rounded-md border border-slate-200">
                      <span className="text-[9px] text-slate-400 block font-semibold">Leads</span>
                      <span className="font-bold text-slate-900 text-xs">{agent.assigned_leads}</span>
                    </div>
                    <div className="p-1 bg-white rounded-md border border-slate-200">
                      <span className="text-[9px] text-slate-400 block font-semibold">Calls</span>
                      <span className="font-bold text-slate-900 text-xs">{agent.total_calls}</span>
                    </div>
                    <div className="p-1 bg-emerald-50 rounded-md border border-emerald-200">
                      <span className="text-[9px] text-emerald-700 block font-semibold">Connect %</span>
                      <span className="font-bold text-emerald-800 text-xs">{agent.connection_rate}%</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-amber-800 font-semibold flex items-center gap-1">
                      {isSelected ? 'Viewing Logs & Feedback' : 'Click to Inspect Agent'}
                    </span>
                    <ChevronRight className="w-3 h-3 text-amber-700" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* DEEP-DIVE INSPECTION PANEL FOR SELECTED AGENT */}
          {inspectedAgent && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-4 space-y-3 animate-in fade-in duration-150">
              
              {/* Agent Inspection Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-700 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {inspectedAgent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {inspectedAgent.name}'s Activity &amp; Conversation Log
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Phone: <span className="font-semibold text-slate-700">{inspectedAgent.phone || 'N/A'}</span> &bull; Email: <span className="font-semibold text-slate-700">{inspectedAgent.email}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 block">Deals Won</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700">{inspectedAgent.deals_won} Confirmed</span>
                </div>
              </div>

              {/* Status Breakdown Grid (Connected, Busy, No Answer, etc.) */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Call Connection &amp; Status Breakdown:
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-800 font-semibold block">Connected</span>
                    <span className="text-base font-extrabold text-emerald-950 mt-0.5 block">
                      {inspectedAgent.connected_calls}
                    </span>
                  </div>

                  <div className="p-2 bg-rose-50 rounded-lg border border-rose-200 text-center">
                    <span className="text-[10px] text-rose-800 font-semibold block">Line Busy</span>
                    <span className="text-base font-extrabold text-rose-950 mt-0.5 block">
                      {inspectedAgent.busy_calls || 0}
                    </span>
                  </div>

                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-center">
                    <span className="text-[10px] text-amber-800 font-semibold block">No Answer</span>
                    <span className="text-base font-extrabold text-amber-950 mt-0.5 block">
                      {inspectedAgent.no_answer_calls || 0}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-700 font-semibold block">Switched Off</span>
                    <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                      {inspectedAgent.switched_off_calls || 0}
                    </span>
                  </div>

                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <span className="text-[10px] text-blue-800 font-semibold block">Callback Requested</span>
                    <span className="text-base font-extrabold text-blue-950 mt-0.5 block">
                      {inspectedAgent.callback_calls || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exact Call Comments & Interaction Feed */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                    <span>Telecaller Comments &amp; Discussion Log ({inspectedAgent.recent_calls?.length || 0}):</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Latest calls logged by {inspectedAgent.name}
                  </span>
                </div>

                {!inspectedAgent.recent_calls || inspectedAgent.recent_calls.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    No calls logged yet by this telecaller.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {inspectedAgent.recent_calls.map((log) => (
                      <div 
                        key={log.id} 
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {log.lead?.name || 'Inbound Lead'}
                            </span>
                            <span className="text-amber-800 font-semibold text-[11px]">{log.lead?.phone}</span>
                            {log.lead?.source && (
                              <span className="px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[9px] font-medium text-slate-600 uppercase">
                                {log.lead.source}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Status Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold capitalize ${
                            log.call_status === 'connected' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : log.call_status === 'busy' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            Status: {log.call_status.replace('_', ' ')}
                          </span>

                          {log.outcome && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-900 capitalize">
                              Outcome: {log.outcome.replace('_', ' ')}
                            </span>
                          )}

                          {log.follow_up_date && (
                            <span className="px-1.5 py-0.2 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-medium flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-amber-600" />
                              Next Follow-up: {new Date(log.follow_up_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {/* Exact Discussion Notes */}
                        <div className="p-1.5 bg-white rounded border border-slate-200 text-slate-800 italic text-[11px] leading-relaxed">
                          "{log.notes}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
