'use client';

import React, { useState } from 'react';
import { Lead } from '@/lib/api';
import { X, Share2, Copy, Check, MessageSquare, ExternalLink, Send, Sparkles } from 'lucide-react';

interface ShareLeadModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export function formatLeadForSharing(lead: Lead): string {
  const lines: string[] = [];

  lines.push('🌟 *GOLDEN BLOOM — LEAD DETAILS* 🌟');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (lead.name) {
    lines.push(`👤 *Client Name:* ${lead.name}`);
  }

  if (lead.phone) {
    lines.push(`📞 *Phone:* ${lead.phone}`);
  }

  if (lead.email) {
    lines.push(`✉️ *Email:* ${lead.email}`);
  }

  const service = lead.service_requested || (lead.submissions && lead.submissions[0]?.service);
  if (service) {
    lines.push(`🌿 *Service Required:* ${service}`);
  }

  const custom = lead.custom_fields || {};

  // Common customer fields
  const property = custom.property_type || custom['Property Type'] || custom['property'];
  if (property) {
    lines.push(`🏡 *Property Type:* ${String(property).replace(/_/g, ' ')}`);
  }

  const location = custom.villa_location || custom['Villa Location'] || custom.location || custom['Location'] || custom['villa'];
  if (location) {
    lines.push(`📍 *Location:* ${location}`);
  }

  const timeline = custom.project_timeline || custom['Project Timeline'] || custom.timeline || custom['Timeline'];
  if (timeline) {
    lines.push(`⏱️ *Project Timeline:* ${String(timeline).replace(/_/g, ' ')}`);
  }

  // Any other relevant customer custom fields
  const skipList = new Set([
    'submissions', 'submissions_count',
    'property_type', 'Property Type', 'property',
    'villa_location', 'Villa Location', 'location', 'Location', 'villa',
    'project_timeline', 'Project Timeline', 'timeline', 'Timeline',
    'source', 'Source', 'platform', 'Platform',
    'form_name', 'Form Name', 'form_id', 'Form ID',
    'campaign', 'Campaign', 'campaign_name', 'Campaign Name',
    'ad_name', 'ad_set', 'adset_name', 'ad_id', 'fb_lead_id', 'lead_id', 'page_id', 'page_name'
  ]);

  Object.entries(custom).forEach(([key, val]) => {
    if (!skipList.has(key) && val !== null && val !== undefined && String(val).trim() !== '') {
      const formattedKey = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`▫️ *${formattedKey}:* ${String(val)}`);
    }
  });

  // Client Notes / Requirement Summary
  const cleanNotes = (lead.lead_notes || '')
    .replace(/\s*via\s+[a-zA-Z0-9_\-]+/gi, '')
    .replace(/\s*\|\s*Platform:\s*[^\|]+/gi, '')
    .replace(/\s*\|\s*Form:\s*[^\|]+/gi, '')
    .trim();

  if (cleanNotes) {
    lines.push('');
    lines.push('📝 *Client Notes / Requirements:*');
    lines.push(`"${cleanNotes}"`);
  }

  // Inbound date
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (lead.submissions_count && lead.submissions_count > 1) {
    lines.push(`🔄 *Repeat Inquiries:* ${lead.submissions_count} submissions received`);
  }
  if (lead.created_at) {
    const d = new Date(lead.created_at);
    lines.push(`📅 *Inquiry Received:* ${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }
  lines.push('🏢 *Golden Bloom CRM*');

  return lines.join('\n');
}

export default function ShareLeadModal({ lead, onClose }: ShareLeadModalProps) {
  if (!lead) return null;

  const defaultMessage = formatLeadForSharing(lead);
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Could not copy to clipboard. Please copy manually from the box.');
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Golden Bloom Lead: ${lead.name}`,
          text: message,
        });
      } catch (err) {
        // User cancelled share or failed, ignore
      }
    } else {
      handleWhatsAppShare();
    }
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-linear-to-r from-emerald-50 via-slate-50 to-amber-50/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>Share Lead Details</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  #{lead.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[260px] sm:max-w-xs">
                {lead.name} &bull; {lead.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
          
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer text-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`py-2.5 px-3 font-bold rounded-xl border shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer text-xs ${
                copied
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copy Message Text</span>
                </>
              )}
            </button>
          </div>

          {supportsNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>More Share Options (Device Share Sheet)</span>
            </button>
          )}

          {/* Formatted Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Formatted Message Preview</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? '✅ Copied' : '📋 Quick Copy'}
              </button>
            </div>

            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={11}
                className="w-full p-3 font-mono text-[11px] leading-relaxed bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none shadow-inner select-all"
                placeholder="Lead message..."
              />
            </div>
            <p className="text-[10px] text-slate-400">
              💡 You can optionally edit the message above before copying or sharing.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Client details cleaned &amp; formatted
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Now</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
