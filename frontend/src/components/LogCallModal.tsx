'use client';

import React, { useState } from 'react';
import { Lead, apiRequest } from '@/lib/api';
import { X, Phone, PhoneCall, Calendar, Clock, CheckCircle2, AlertCircle, MessageSquare, User, History } from 'lucide-react';

interface LogCallModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void;
}

export default function LogCallModal({ lead, onClose, onSuccess }: LogCallModalProps) {
  const [callStatus, setCallStatus] = useState<'connected' | 'no_answer' | 'busy' | 'switched_off' | 'callback_requested'>('connected');
  const [outcome, setOutcome] = useState<string>('interested');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [duration, setDuration] = useState('120');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please enter call notes or remarks.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ message: string; lead: Lead }>('/call-logs', {
        method: 'POST',
        body: JSON.stringify({
          lead_id: lead.id,
          call_status: callStatus,
          outcome: callStatus === 'connected' ? outcome : null,
          notes: notes.trim(),
          follow_up_date: followUpDate || null,
          duration_seconds: duration ? parseInt(duration) : null,
        }),
      });

      onSuccess(response.lead);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save call log');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFollowup = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(14, 0, 0, 0); // Default to 2:00 PM
    const isoString = d.toISOString().slice(0, 16);
    setFollowUpDate(isoString);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 text-slate-900 p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-800 rounded-lg">
                <PhoneCall className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Log Call &amp; Follow-up</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lead: <strong className="text-slate-800">{lead.name}</strong> ({lead.phone})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          {/* Quick Lead Info Bar (Fixed: No overlapping with min-w-0 and flex-wrap) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone</span>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <a href={`tel:${lead.phone}`} className="font-bold text-amber-900 hover:underline text-xs truncate">
                  {lead.phone}
                </a>
                <a 
                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-1.5 py-0.2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold inline-flex items-center gap-0.5 transition"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lead Source</span>
              <span className="font-bold text-slate-800 uppercase mt-0.5 block truncate text-xs">
                {lead.source?.replace('_', ' ')}
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Status</span>
              <span className="font-bold text-slate-800 capitalize mt-0.5 block truncate text-xs">
                {lead.status.replace('_', ' ')}
              </span>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Requested</span>
              <span className="font-bold text-slate-800 truncate mt-0.5 block text-xs" title={lead.service_requested || 'General Floral'}>
                {lead.service_requested || 'General Floral'}
              </span>
            </div>
          </div>

          {/* Campaign Custom Fields (Sheet columns like City, Budget, Instagram, etc.) */}
          {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
            <div className="bg-purple-50/80 p-2.5 rounded-xl border border-purple-200/80 text-xs space-y-1.5">
              <span className="font-bold text-purple-900 block text-[10px] flex items-center gap-1 uppercase tracking-wider">
                <span>✨ Campaign Sheet Custom Fields:</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(lead.custom_fields).map(([k, v]) => (
                  <div key={k} className="bg-white p-1.5 px-2 rounded-lg border border-purple-100 shadow-2xs min-w-0">
                    <span className="text-[9px] text-slate-400 block font-medium truncate">{k}</span>
                    <span className="font-bold text-purple-950 truncate block mt-0.5 text-xs" title={String(v)}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Call Status Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                1. Call Connection Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'connected', label: 'Connected', icon: '🟢', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                  { id: 'no_answer', label: 'Ringing / No Answer', icon: '🟡', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                  { id: 'busy', label: 'Line Busy', icon: '🔴', color: 'border-rose-400 bg-rose-50 text-rose-800' },
                  { id: 'switched_off', label: 'Switched Off', icon: '⚪', color: 'border-slate-400 bg-slate-50 text-slate-800' },
                  { id: 'callback_requested', label: 'Asked to Call Back', icon: '📞', color: 'border-blue-500 bg-blue-50 text-blue-800' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCallStatus(item.id as any)}
                    className={`p-2 px-2.5 text-left border rounded-lg font-medium text-xs flex items-center gap-2 transition ${
                      callStatus === item.id 
                        ? `${item.color} ring-2 ring-amber-500 font-bold shadow-2xs` 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Outcome (If Connected) */}
            {callStatus === 'connected' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  2. Call Outcome &amp; Client Interest
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'interested', label: 'Interested / Send Quote' },
                    { id: 'follow_up', label: 'Follow-up Scheduled' },
                    { id: 'meeting_scheduled', label: 'Meeting / Consultation' },
                    { id: 'closed_won', label: 'Deal Closed (Won)' },
                    { id: 'not_interested', label: 'Not Interested' },
                    { id: 'closed_lost', label: 'Lost / Budget Issue' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOutcome(item.id)}
                      className={`p-2 text-center border rounded-lg text-xs font-medium transition ${
                        outcome === item.id 
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Call Notes / Discussion Summary */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                <span>3. Call Notes / Remarks (Discussion Details) *</span>
                <span className="text-[10px] text-slate-400 font-normal">What did the client say?</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                required
                placeholder="e.g. Client interested in floral decor for wedding on Nov 15. Requested quotation for 10 centerpieces and bridal bouquet via WhatsApp..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder-slate-400"
              />
            </div>

            {/* Next Follow-up Date & Time */}
            <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                4. Next Follow-Up Date & Time
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickFollowup(1)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg hover:border-amber-500 hover:text-amber-700 font-medium transition"
                >
                  Tomorrow (2 PM)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFollowup(2)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg hover:border-amber-500 hover:text-amber-700 font-medium transition"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFollowup(7)}
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg hover:border-amber-500 hover:text-amber-700 font-medium transition"
                >
                  Next Week
                </button>
                {followUpDate && (
                  <button
                    type="button"
                    onClick={() => setFollowUpDate('')}
                    className="text-xs text-rose-600 hover:underline ml-auto"
                  >
                    Clear Date
                  </button>
                )}
              </div>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-sm p-2.5 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Past Call History for this lead */}
            {lead.call_logs && lead.call_logs.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Past Interaction History ({lead.call_logs.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {lead.call_logs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {log.user ? log.user.name : 'Telecaller'}
                        </span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                          {log.call_status.replace('_', ' ')}
                        </span>
                        {log.outcome && (
                          <span className="capitalize text-slate-600 text-[11px]">
                            Outcome: {log.outcome.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 text-xs italic bg-slate-50 p-1.5 rounded mt-1">
                        "{log.notes}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Saving Call...' : 'Save & Update Lead'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
