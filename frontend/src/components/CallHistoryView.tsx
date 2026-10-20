'use client';

import React, { useState, useEffect } from 'react';
import { CallLog, User, apiRequest } from '@/lib/api';
import { PhoneCall, Calendar, Clock, Search, Filter, User as UserIcon, MessageSquare } from 'lucide-react';

export default function CallHistoryView({ currentUser, refreshTrigger }: { currentUser: User | null; refreshTrigger?: number }) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  useEffect(() => {
    fetchLogs(false);
  }, [statusFilter]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchLogs(true);
    }
  }, [refreshTrigger]);

  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('call_status', statusFilter);
      const res = await apiRequest(`/call-logs?${params.toString()}`);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load call logs', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-amber-800" />
            {isAdmin ? 'Company Call Activities & Telecaller Audit' : 'My Call History Logs'}
          </h2>
          <p className="text-[11px] text-slate-500">
            Complete timeline of client phone calls, conversation feedback, and follow-up schedules.
          </p>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <option value="">All Call Statuses</option>
            <option value="connected">Connected Calls</option>
            <option value="no_answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="switched_off">Switched Off</option>
            <option value="callback_requested">Callback Requested</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-xs">
            Loading call logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No call records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  {isAdmin && <th className="py-2.5 px-3">Telecaller</th>}
                  <th className="py-2.5 px-3">Client / Lead</th>
                  <th className="py-2.5 px-3">Call Status</th>
                  <th className="py-2.5 px-3">Client Feedback / Notes</th>
                  <th className="py-2.5 px-3">Next Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2 px-3 whitespace-nowrap text-slate-500">
                      <div className="font-semibold text-slate-800 text-xs">
                        {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                          {log.user?.name || 'Agent'}
                        </span>
                      </td>
                    )}

                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 text-xs">{log.lead?.name || 'Unknown Lead'}</div>
                      <div className="text-[10px] text-amber-800 font-medium">{log.lead?.phone}</div>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold capitalize ${
                        log.call_status === 'connected' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        {log.call_status.replace('_', ' ')}
                      </span>
                      {log.outcome && (
                        <div className="text-[9px] text-slate-500 capitalize mt-0.5">
                          Outcome: <strong>{log.outcome.replace('_', ' ')}</strong>
                        </div>
                      )}
                    </td>

                    <td className="py-2 px-3">
                      <p className="text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100 text-xs italic max-w-md">
                        "{log.notes}"
                      </p>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      {log.follow_up_date ? (
                        <div className="text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold text-[10px] inline-flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{new Date(log.follow_up_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
