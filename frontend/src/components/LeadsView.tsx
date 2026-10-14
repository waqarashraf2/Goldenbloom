'use client';

import React, { useState, useEffect } from 'react';
import { Lead, User, apiRequest, API_BASE_URL } from '@/lib/api';
import { 
  Search, Filter, Plus, PhoneCall, Phone, MessageSquare, Download, 
  RotateCcw, CheckCircle2, Clock, Calendar, AlertCircle, ArrowUpDown, 
  UserCheck, Send, Sparkles, ExternalLink
} from 'lucide-react';

interface LeadsViewProps {
  currentUser: User | null;
  telecallers: User[];
  onOpenLogCall: (lead: Lead) => void;
  initialFilter?: { source?: string; today_followups?: boolean };
}

export default function LeadsView({ currentUser, telecallers, onOpenLogCall, initialFilter }: LeadsViewProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState(initialFilter?.source || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [todayFollowups, setTodayFollowups] = useState(Boolean(initialFilter?.today_followups));
  const [datePreset, setDatePreset] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [followupPreset, setFollowupPreset] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

  // Add Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addSource, setAddSource] = useState('website');
  const [addService, setAddService] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addAssignedTo, setAddAssignedTo] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Selected Leads for bulk assignment
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [bulkAssignTo, setBulkAssignTo] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchLeads();
  }, [search, sourceFilter, statusFilter, assignedFilter, todayFollowups, datePreset, fromDate, toDate, followupPreset, page]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sourceFilter) params.append('source', sourceFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (assignedFilter) params.append('assigned_to', assignedFilter);
      if (todayFollowups) params.append('today_followups', '1');
      if (datePreset) params.append('date_preset', datePreset);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (followupPreset) params.append('followup_preset', followupPreset);
      params.append('page', String(page));

      const res = await apiRequest(`/leads?${params.toString()}`);
      setLeads(res.data || []);
      setTotalPages(res.last_page || 1);
      setTotalLeadsCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load leads', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSourceFilter('');
    setStatusFilter('');
    setAssignedFilter('');
    setTodayFollowups(false);
    setDatePreset('');
    setFromDate('');
    setToDate('');
    setFollowupPreset('');
    setPage(1);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addPhone.trim()) {
      alert('Name and Phone number are required.');
      return;
    }

    setAddLoading(true);
    try {
      await apiRequest('/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: addName.trim(),
          phone: addPhone.trim(),
          email: addEmail.trim() || null,
          source: addSource,
          service_requested: addService.trim() || null,
          lead_notes: addNotes.trim() || null,
          assigned_to: addAssignedTo ? parseInt(addAssignedTo) : null,
        }),
      });

      setShowAddModal(false);
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      setAddService('');
      setAddNotes('');
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    } finally {
      setAddLoading(false);
    }
  };

  const handleInlineAssign = async (leadId: number, userId: string) => {
    try {
      await apiRequest('/leads/assign', {
        method: 'POST',
        body: JSON.stringify({
          lead_ids: [leadId],
          user_id: userId ? parseInt(userId) : null,
        }),
      });
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to assign lead');
    }
  };

  const handleAutoDistribute = async () => {
    if (!confirm('Are you sure you want to evenly distribute all unassigned leads among active telecallers?')) return;
    try {
      const res = await apiRequest('/leads/auto-distribute', { method: 'POST' });
      alert(res.message);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Auto distribute failed');
    }
  };

  const handleBulkAssign = async () => {
    if (selectedLeadIds.length === 0) return;
    try {
      await apiRequest('/leads/assign', {
        method: 'POST',
        body: JSON.stringify({
          lead_ids: selectedLeadIds,
          user_id: bulkAssignTo ? parseInt(bulkAssignTo) : null,
        }),
      });
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Bulk assign failed');
    }
  };

  const handleExportCsv = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sourceFilter) params.append('source', sourceFilter);
    if (statusFilter) params.append('status', statusFilter);
    if (assignedFilter) params.append('assigned_to', assignedFilter);
    if (datePreset) params.append('date_preset', datePreset);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    if (followupPreset) params.append('followup_preset', followupPreset);
    window.open(`${API_BASE_URL}/leads-export?api_token=${token}&${params.toString()}`, '_blank');
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'website':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Website</span>;
      case 'facebook_ads':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">FB Ads</span>;
      case 'google_sheet':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Google Sheet</span>;
      case 'csv_import':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">CSV File</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Manual</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">New Lead</span>;
      case 'connected':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Connected</span>;
      case 'not_connected':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">Not Answered</span>;
      case 'follow_up':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">Follow-up Due</span>;
      case 'interested':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">Interested</span>;
      case 'closed_won':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white">Deal Closed (Won)</span>;
      case 'closed_lost':
      case 'not_interested':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Lost / Not Interested</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {todayFollowups ? "Today's Follow-up Leads" : isAdmin ? "All Inbound Leads" : "My Assigned Leads"}
          </h2>
          <p className="text-[11px] text-slate-500">
            Total {totalLeadsCount} leads found in this view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleAutoDistribute}
                title="Distribute unassigned leads evenly among active telecallers"
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Distribute (Round Robin)</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search name, phone (+971...), email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filter: Source */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Sources</option>
              <option value="website">Website (goldenbloom.ae)</option>
              <option value="facebook_ads">Facebook Ads</option>
              <option value="google_sheet">Google Sheet Sync</option>
              <option value="csv_import">CSV File Import</option>
            </select>
          </div>

          {/* Filter: Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="connected">Connected</option>
              <option value="not_connected">Not Answered</option>
              <option value="follow_up">Follow-up Due</option>
              <option value="interested">Interested</option>
              <option value="closed_won">Closed (Won)</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>

          {/* Filter: Telecaller (Admin Only) */}
          {isAdmin ? (
            <div>
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Telecallers</option>
                <option value="unassigned">⚠️ Unassigned Leads</option>
                {telecallers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setTodayFollowups(!todayFollowups)}
                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition ${
                  todayFollowups 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {todayFollowups ? "Showing Today's Follow-ups" : "Filter: Today's Follow-ups"}
              </button>
            </div>
          )}

        </div>

        {/* Row 2: Date Filters & Follow-up Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-100 items-center">
          
          {/* Created Date Preset */}
          <div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  if (e.target.value !== 'custom') {
                    setFromDate('');
                    setToDate('');
                  }
                }}
                className="w-full bg-transparent border-0 text-xs text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Created: All Time</option>
                <option value="today">Created: Today</option>
                <option value="yesterday">Created: Yesterday</option>
                <option value="this_week">Created: This Week</option>
                <option value="this_month">Created: This Month</option>
                <option value="custom">📅 Custom Date Range...</option>
              </select>
            </div>
          </div>

          {/* Follow-up Preset Filter */}
          <div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <Clock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <select
                value={followupPreset}
                onChange={(e) => setFollowupPreset(e.target.value)}
                className="w-full bg-transparent border-0 text-xs text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Follow-up: Any</option>
                <option value="today">Follow-up: Today</option>
                <option value="overdue">⚠️ Overdue Follow-ups</option>
                <option value="upcoming">Upcoming Follow-ups</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range (If Selected) */}
          {datePreset === 'custom' ? (
            <div className="lg:col-span-2 flex items-center gap-1.5">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-slate-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          ) : (
            <div className="lg:col-span-2 text-[11px] text-slate-400 hidden lg:flex items-center gap-2">
              <span>Filter leads by date added, follow-up schedule, source, or keywords.</span>
            </div>
          )}

          {/* Reset / Refresh Filters Button */}
          <div className="flex justify-end">
            {(search || sourceFilter || statusFilter || assignedFilter || todayFollowups || datePreset || fromDate || toDate || followupPreset) ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full sm:w-auto px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={fetchLeads}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Refresh</span>
              </button>
            )}
          </div>

        </div>

        {/* Bulk Action Bar (When Leads selected by Admin) */}
        {isAdmin && selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-2.5 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs">
            <span className="font-bold text-amber-900 text-[11px]">{selectedLeadIds.length} leads selected:</span>
            <select
              value={bulkAssignTo}
              onChange={(e) => setBulkAssignTo(e.target.value)}
              className="p-1 bg-white border border-slate-300 rounded text-xs"
            >
              <option value="">Assign to Telecaller...</option>
              {telecallers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              className="px-2.5 py-1 bg-amber-800 text-white rounded font-bold text-xs hover:bg-amber-900"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-xs">
            Loading Leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-1.5">
            <AlertCircle className="w-6 h-6 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No leads match your current filter.</p>
            <p className="text-[11px] text-slate-400">Try changing the search keywords or filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[10px]">
                <tr>
                  {isAdmin && (
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.length === leads.length && leads.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLeadIds(leads.map(l => l.id));
                          else setSelectedLeadIds([]);
                        }}
                      />
                    </th>
                  )}
                  <th className="py-2.5 px-3">Contact / Client</th>
                  <th className="py-2.5 px-3">Service Required</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Status</th>
                  {isAdmin && <th className="py-2.5 px-3">Assigned Agent</th>}
                  <th className="py-2.5 px-3">Next Follow-up</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const isOverdue = lead.next_follow_up_date && new Date(lead.next_follow_up_date) < new Date();
                  const isToday = lead.next_follow_up_date && new Date(lead.next_follow_up_date).toDateString() === new Date().toDateString();

                  return (
                    <tr key={lead.id} className="hover:bg-amber-50/30 transition">
                      
                      {/* Checkbox for Admin bulk actions */}
                      {isAdmin && (
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedLeadIds([...selectedLeadIds, lead.id]);
                              else setSelectedLeadIds(selectedLeadIds.filter(id => id !== lead.id));
                            }}
                          />
                        </td>
                      )}

                      {/* Lead Contact Info */}
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {lead.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a 
                            href={`tel:${lead.phone}`} 
                            className="text-amber-800 font-medium hover:underline flex items-center gap-1 text-xs"
                          >
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            {lead.phone}
                          </a>
                          <a 
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold hover:bg-emerald-600 hover:text-white transition"
                          >
                            WhatsApp
                          </a>
                        </div>
                        {lead.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {lead.email}
                          </div>
                        )}
                      </td>

                      {/* Service / Details */}
                      <td className="py-2 px-3">
                        <div className="font-medium text-slate-800 max-w-[200px] truncate text-xs" title={lead.service_requested || 'General'}>
                          {lead.service_requested || 'General Floral'}
                        </div>
                        {lead.campaign_name && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            Campaign: {lead.campaign_name}
                          </div>
                        )}
                        {lead.lead_notes && (
                          <div className="text-[10px] text-slate-500 italic truncate max-w-[200px]">
                            "{lead.lead_notes}"
                          </div>
                        )}
                        {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 max-w-[220px]">
                            {Object.entries(lead.custom_fields).slice(0, 2).map(([k, v]) => (
                              <span 
                                key={k} 
                                className="px-1 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[9px] font-medium truncate max-w-[140px]"
                                title={`${k}: ${String(v)}`}
                              >
                                <strong>{k}:</strong> {String(v)}
                              </span>
                            ))}
                            {Object.keys(lead.custom_fields).length > 2 && (
                              <span className="text-[9px] text-purple-700 font-bold bg-purple-50 px-1 rounded">
                                +{Object.keys(lead.custom_fields).length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-2 px-3">
                        {getSourceBadge(lead.source)}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        {getStatusBadge(lead.status)}
                        {lead.call_attempts > 0 && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            Attempts: <span className="font-semibold text-slate-600">{lead.call_attempts}</span>
                          </div>
                        )}
                      </td>

                      {/* Assigned Agent (Admin Only) */}
                      {isAdmin && (
                        <td className="py-2 px-3">
                          <select
                            value={lead.assigned_to || ''}
                            onChange={(e) => handleInlineAssign(lead.id, e.target.value)}
                            className={`p-1 rounded-md text-[11px] font-semibold border ${
                              lead.assigned_to 
                                ? 'bg-slate-50 border-slate-200 text-slate-800' 
                                : 'bg-rose-50 border-rose-300 text-rose-800'
                            }`}
                          >
                            <option value="">⚠️ Unassigned</option>
                            {telecallers.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* Follow-up Date */}
                      <td className="py-2 px-3">
                        {lead.next_follow_up_date ? (
                          <div className={`p-1 rounded-md inline-block text-[10px] font-semibold ${
                            isOverdue 
                              ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                              : isToday 
                              ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                              : 'bg-slate-50 text-slate-600'
                          }`}>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{new Date(lead.next_follow_up_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {new Date(lead.next_follow_up_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">None set</span>
                        )}
                      </td>

                      {/* Log Call Action */}
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onOpenLogCall(lead)}
                          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold text-xs shadow-2xs transition flex items-center gap-1 ml-auto"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Log Call</span>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Lead Manually</h3>
            
            <form onSubmit={handleAddLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima Al Mansoori"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+971501234567"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="client@domain.ae"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={addSource}
                    onChange={(e) => setAddSource(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="website">Website Direct</option>
                    <option value="facebook_ads">Facebook Ads</option>
                    <option value="google_sheet">Google Sheet</option>
                    <option value="manual">Walk-in / Direct Call</option>
                  </select>
                </div>
                {isAdmin && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assign To</label>
                    <select
                      value={addAssignedTo}
                      onChange={(e) => setAddAssignedTo(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="">Leave Unassigned</option>
                      {telecallers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service / Requirement</label>
                <input
                  type="text"
                  placeholder="e.g. Luxury Wedding Arch, Corporate Flowers"
                  value={addService}
                  onChange={(e) => setAddService(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Client preferences, budget or notes..."
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 font-bold bg-amber-800 text-white rounded-xl hover:bg-amber-900"
                >
                  {addLoading ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
