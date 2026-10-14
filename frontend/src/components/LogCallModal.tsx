'use client';

import React, { useState, useEffect } from 'react';
import { Lead, apiRequest } from '@/lib/api';
import { 
  X, Phone, PhoneCall, Calendar, Clock, CheckCircle2, AlertCircle, 
  MessageSquare, User, History, Copy, ChevronDown, ChevronUp, Sparkles, Check
} from 'lucide-react';

interface LogCallModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void;
}

const toLocalDatetime = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

export default function LogCallModal({ lead, onClose, onSuccess }: LogCallModalProps) {
  const [callStatus, setCallStatus] = useState<'connected' | 'no_answer' | 'busy' | 'switched_off' | 'callback_requested'>('connected');
  const [outcome, setOutcome] = useState<string>('interested');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [duration, setDuration] = useState('120');
  const [showHistory, setShowHistory] = useState(true);
  const [copiedNote, setCopiedNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate fields automatically when lead opens or reopens on subsequent days
  useEffect(() => {
    if (lead) {
      // 1. Pre-select previous call connection status
      const validCallStatuses = ['connected', 'no_answer', 'busy', 'switched_off', 'callback_requested'];
      if (lead.last_call_status && validCallStatuses.includes(lead.last_call_status)) {
        setCallStatus(lead.last_call_status as any);
      } else {
        setCallStatus('connected');
      }

      // 2. Pre-select previous outcome or map lead status
      const validOutcomes = ['interested', 'follow_up', 'meeting_scheduled', 'closed_won', 'not_interested', 'closed_lost'];
      if (lead.call_logs && lead.call_logs.length > 0 && lead.call_logs[0].outcome) {
        setOutcome(lead.call_logs[0].outcome);
      } else if (validOutcomes.includes(lead.status)) {
        setOutcome(lead.status);
      } else {
        setOutcome('interested');
      }

      // 3. Pre-fill next scheduled follow-up date (if exists) so it is retained & editable
      if (lead.next_follow_up_date) {
        setFollowUpDate(toLocalDatetime(lead.next_follow_up_date));
      } else {
        setFollowUpDate('');
      }

      // 4. Default duration
      setDuration('120');
      setNotes('');
      setError(null);
      setCopiedNote(false);
    }
  }, [lead]);

  if (!lead) return null;

  const lastCallLog = lead.call_logs && lead.call_logs.length > 0 ? lead.call_logs[0] : null;

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

  const handleQuickFollowup = (days: number, hour: number = 14, minute: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    setFollowUpDate(toLocalDatetime(d.toISOString()));
  };

  const handleCopyPreviousNote = () => {
    const textToCopy = lastCallLog?.notes || lead.lead_notes || '';
    if (textToCopy) {
      setNotes(textToCopy);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-800 rounded-lg">
                <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                Log Call &amp; Follow-up
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong className="text-slate-800 font-semibold">{lead.name}</strong> ({lead.phone})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          {/* Quick Lead Info Bar */}
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
                  className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold inline-flex items-center gap-0.5 transition"
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service</span>
              <span className="font-bold text-slate-800 truncate mt-0.5 block text-xs" title={lead.service_requested || 'General Inquiry'}>
                {lead.service_requested || 'General Inquiry'}
              </span>
            </div>
          </div>

          {/* Past Call History Accordion (Prominent & Pre-populated) */}
          {lead.call_logs && lead.call_logs.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full p-2.5 px-3 flex items-center justify-between text-left font-bold text-amber-950 hover:bg-amber-100/50 transition"
              >
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-700" />
                  <span>Previous Interaction History ({lead.call_logs.length} calls logged)</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-normal text-amber-800">
                    Last: {lead.call_logs[0].call_status.replace('_', ' ')}
                  </span>
                  {showHistory ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-amber-700" />}
                </div>
              </button>

              {showHistory && (
                <div className="p-3 pt-1 space-y-2 max-h-44 overflow-y-auto border-t border-amber-200/60">
                  {lead.call_logs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-white rounded-lg border border-amber-200/70 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {log.user?.name || 'Telecaller'}
                        </span>
                        <span>
                          {new Date(log.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-700 capitalize">
                          {log.call_status.replace('_', ' ')}
                        </span>
                        {log.outcome && (
                          <span className="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-900 capitalize">
                            Outcome: {log.outcome.replace('_', ' ')}
                          </span>
                        )}
                        {log.follow_up_date && (
                          <span className="text-slate-500 flex items-center gap-1 ml-auto">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Next: {new Date(log.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 text-xs bg-slate-50/80 p-2 rounded border border-slate-100 mt-1 whitespace-pre-wrap">
                        {log.notes}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Campaign Custom Fields (e.g. Community, Budget) */}
          {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
            <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200/70 text-xs space-y-1.5">
              <span className="font-bold text-purple-900 block text-[10px] flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>Custom Ingestion Fields:</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(lead.custom_fields).map(([k, v]) => (
                  <div key={k} className="bg-white p-1.5 px-2 rounded-lg border border-purple-100 shadow-2xs min-w-0">
                    <span className="text-[9px] text-slate-400 block font-medium truncate uppercase">{k}</span>
                    <span className="font-bold text-purple-950 truncate block mt-0.5 text-xs" title={String(v)}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Call Connection Status (Pre-selected & Editable) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>1. Call Connection Status</span>
                <span className="text-[10px] text-slate-400 font-normal">Pre-selected from last status</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'connected', label: 'Connected', icon: '🟢', color: 'border-emerald-500 bg-emerald-50/80 text-emerald-900' },
                  { id: 'no_answer', label: 'Ringing / No Answer', icon: '🟡', color: 'border-amber-500 bg-amber-50/80 text-amber-900' },
                  { id: 'busy', label: 'Line Busy', icon: '🔴', color: 'border-rose-400 bg-rose-50/80 text-rose-900' },
                  { id: 'switched_off', label: 'Switched Off', icon: '⚪', color: 'border-slate-400 bg-slate-50 text-slate-800' },
                  { id: 'callback_requested', label: 'Asked to Call Back', icon: '📞', color: 'border-blue-500 bg-blue-50/80 text-blue-900' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCallStatus(item.id as any)}
                    className={`p-2 px-2.5 text-left border rounded-lg font-medium text-xs flex items-center gap-2 transition cursor-pointer ${
                      callStatus === item.id 
                        ? `${item.color} ring-2 ring-amber-500 font-bold shadow-2xs` 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Call Outcome & Interest (If Connected) */}
            {callStatus === 'connected' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>2. Call Outcome &amp; Client Interest</span>
                  <span className="text-[10px] text-slate-400 font-normal">Pre-selected from lead interest</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'interested', label: 'Interested / Send Quote' },
                    { id: 'follow_up', label: 'Follow up Scheduled' },
                    { id: 'meeting_scheduled', label: 'Meeting / Consultation' },
                    { id: 'closed_won', label: 'Deal Closed (Won)' },
                    { id: 'not_interested', label: 'Not Interested' },
                    { id: 'closed_lost', label: 'Lost / Budget Issue' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOutcome(item.id)}
                      className={`p-2 text-center border rounded-lg text-xs font-medium transition cursor-pointer ${
                        outcome === item.id 
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500 shadow-2xs' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Call Notes & Remarks (With 1-click Copy Last Notes) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Call Notes / Remarks (Discussion Details) *
                </label>
                {(lastCallLog?.notes || lead.lead_notes) && (
                  <button
                    type="button"
                    onClick={handleCopyPreviousNote}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition cursor-pointer"
                    title="Copy last remarks into note field"
                  >
                    {copiedNote ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-700" />
                        <span>Copy Previous Remarks</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                required
                placeholder={
                  lastCallLog?.notes 
                    ? `Previous note: "${lastCallLog.notes}" — Enter today's discussion summary...`
                    : lead.lead_notes 
                    ? `Inquiry note: "${lead.lead_notes}" — Enter call remarks...`
                    : "e.g. Client requested customized quote for swimming pool and pergola. Follow up tomorrow at 2 PM with brochure on WhatsApp..."
                }
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder-slate-400"
              />
            </div>

            {/* 4. Next Follow-up Date & Time (Pre-filled & Fully Editable) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  4. Next Follow-Up Date &amp; Time
                </label>
                {followUpDate && (
                  <button
                    type="button"
                    onClick={() => setFollowUpDate('')}
                    className="text-[11px] text-rose-600 hover:underline font-semibold"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFollowup(0, 17, 0)}
                  className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-amber-500 hover:text-amber-800 rounded-md font-medium transition cursor-pointer"
                >
                  Today (5 PM)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFollowup(1, 11, 0)}
                  className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-amber-500 hover:text-amber-800 rounded-md font-medium transition cursor-pointer"
                >
                  Tomorrow (11 AM)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFollowup(1, 14, 0)}
                  className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-amber-500 hover:text-amber-800 rounded-md font-medium transition cursor-pointer"
                >
                  Tomorrow (2 PM)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFollowup(2, 11, 30)}
                  className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-amber-500 hover:text-amber-800 rounded-md font-medium transition cursor-pointer"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFollowup(7, 10, 0)}
                  className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:border-amber-500 hover:text-amber-800 rounded-md font-medium transition cursor-pointer"
                >
                  Next Week
                </button>
              </div>

              {/* Standard Fillable DateTime Picker */}
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs hover:shadow transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving Call...' : 'Save & Update Lead'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
