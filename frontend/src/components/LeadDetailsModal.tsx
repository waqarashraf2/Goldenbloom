'use client';

import React from 'react';
import { Lead, User } from '@/lib/api';
import { 
  X, Phone, MessageSquare, Calendar, Clock, Globe, Shield, 
  MapPin, Home, Layers, CheckCircle2, AlertCircle, PhoneCall,
  User as UserIcon, Tag, Sparkles, ExternalLink, History, FileText, Trash2
} from 'lucide-react';

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
  onOpenLogCall: (lead: Lead) => void;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  telecallers?: User[];
  onAssignLead?: (leadId: number, userId: string) => void;
  onDeleteLead?: (leadId: number) => void;
}

export default function LeadDetailsModal({
  lead,
  onClose,
  onOpenLogCall,
  isAdmin,
  isSuperAdmin,
  telecallers = [],
  onAssignLead,
  onDeleteLead,
}: LeadDetailsModalProps) {
  const submissions = lead.submissions || [];
  const submissionsCount = lead.submissions_count || submissions.length || 1;

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'website':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Website (goldenbloom.ae)</span>;
      case 'facebook_ads':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Facebook Ads</span>;
      case 'instagram_ads':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800">Instagram Ads</span>;
      case 'google_sheet':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Google Sheet</span>;
      case 'csv_import':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">CSV Bulk Import</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">{source}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">New Lead</span>;
      case 'connected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Connected</span>;
      case 'not_connected':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Not Answered</span>;
      case 'follow_up':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">Follow-up Due</span>;
      case 'interested':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Interested</span>;
      case 'closed_won':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">Deal Closed (Won)</span>;
      case 'closed_lost':
      case 'not_interested':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Lost / Not Interested</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const cleanPhone = lead.phone.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                Lead #{lead.id}
              </span>

              {submissionsCount > 1 ? (
                <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <span>🔥 {submissionsCount}x Submissions Received</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full">
                  1 Submission
                </span>
              )}

              {lead.assigned_to ? (
                <span className="text-[10px] font-medium bg-white/10 px-2 py-0.5 rounded-full">
                  Agent: {lead.assigned_user?.name || `User #${lead.assigned_to}`}
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                  ⚠️ Unassigned
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold truncate">
              {lead.name}
            </h3>
            
            <p className="text-xs text-amber-200/80 flex items-center gap-2 mt-0.5">
              <span>First Received: {new Date(lead.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Quick Contact & Action Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <a
                href={`tel:${lead.phone}`}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {lead.phone}</span>
              </a>

              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {lead.email && (
                <span className="text-slate-600 font-medium px-2 py-1 bg-white border border-slate-200 rounded-lg">
                  ✉️ {lead.email}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenLogCall(lead);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition ml-auto"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Log Call Remarks</span>
            </button>
          </div>

          {/* Lead Status & Assignment Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200 text-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Current Pipeline Status
              </span>
              <div className="flex items-center gap-2">
                {getStatusBadge(lead.status)}
                {lead.call_attempts > 0 && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Attempted: {lead.call_attempts} times)
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Telecaller
              </span>
              {isAdmin && onAssignLead ? (
                <select
                  value={lead.assigned_to || ''}
                  onChange={(e) => onAssignLead(lead.id, e.target.value)}
                  className={`w-full p-1.5 rounded-lg text-xs font-semibold border ${
                    lead.assigned_to 
                      ? 'bg-slate-50 border-slate-200 text-slate-800' 
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <option value="">⚠️ Unassigned (Keep in Pool)</option>
                  {telecallers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              ) : (
                <div className="font-semibold text-slate-800">
                  {lead.assigned_user?.name || (
                    <span className="text-rose-700 font-bold">⚠️ Unassigned Lead</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ALL SUBMISSIONS HISTORY (Crucial requirement for repeat inquiries!) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-700" />
                <span>Inbound Submissions & Received Date History ({submissions.length || 1})</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                Sorted chronologically by inquiry date
              </span>
            </div>

            <div className="space-y-2.5">
              {submissions.map((sub, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border transition ${
                    idx === submissions.length - 1 
                      ? 'bg-amber-50/40 border-amber-300 shadow-2xs' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === submissions.length - 1 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        #{sub.inquiry_number || idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {idx === submissions.length - 1 ? 'Latest Inquiry' : `Inquiry #${sub.inquiry_number || idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && sub.source && getSourceBadge(sub.source)}
                      <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Clock className="w-3 h-3 text-amber-700" />
                        {sub.received_at}
                      </span>
                    </div>
                  </div>

                  {/* Submission Specific Content */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-medium">Service Requested:</span>
                      <span className="font-bold text-slate-800">
                        {sub.service || lead.service_requested || 'General Inquiry'}
                      </span>
                    </div>

                    {sub.campaign && (
                      <div>
                        <span className="text-slate-400 block font-medium">Campaign:</span>
                        <span className="text-slate-700 truncate block">
                          {sub.campaign}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Message */}
                  {sub.notes && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700 italic">
                      "{sub.notes}"
                    </div>
                  )}

                  {/* Dynamic Custom Fields in this inquiry */}
                  {sub.custom_fields && Object.keys(sub.custom_fields).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {Object.entries(sub.custom_fields).map(([k, v]) => {
                        if (k === 'submissions' || k === 'submissions_count') return null;
                        return (
                          <span 
                            key={k} 
                            className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-medium"
                          >
                            <strong className="capitalize">{k.replace(/_/g, ' ')}:</strong> {String(v)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Call Logs & Interactions Timeline */}
          {lead.call_logs && lead.call_logs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                <span>Telecaller Logged Interaction History ({lead.call_logs.length})</span>
              </h4>

              <div className="space-y-2">
                {lead.call_logs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">
                        {log.user?.name || 'Telecaller'}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 capitalize">
                        {log.call_status.replace(/_/g, ' ')}
                      </span>
                      {log.outcome && (
                        <span className="text-[10px] text-slate-600 font-semibold">
                          Outcome: {log.outcome}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-700 italic text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                      "{log.notes}"
                    </p>

                    {log.follow_up_date && (
                      <div className="text-[10px] text-amber-800 font-bold flex items-center gap-1 pt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Scheduled Follow-up: {new Date(log.follow_up_date).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Lead ID #{lead.id} {isAdmin && lead.source ? <>&bull; Received via {lead.source}</> : null}
            </span>

            {isSuperAdmin && onDeleteLead && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to permanently delete lead "${lead.name}"? This action cannot be undone.`)) {
                    onDeleteLead(lead.id);
                  }
                }}
                className="px-2.5 py-1 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Lead</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogCall(lead);
              }}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Call</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
