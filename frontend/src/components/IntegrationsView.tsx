'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest, API_BASE_URL } from '@/lib/api';
import { 
  FileSpreadsheet, Globe, Copy, Check, Key, RefreshCw, Send, CheckCircle2, 
  AlertCircle, Sparkles, ExternalLink, ShieldCheck, Plus, Trash2, 
  ArrowRight, Database, SlidersHorizontal, TableProperties, HelpCircle
} from 'lucide-react';

interface FieldMapping {
  id: string;
  dbField: string;
  dbLabel: string;
  isCustom: boolean;
  sheetColumn: string;
}

export default function IntegrationsView() {
  const [settings, setSettings] = useState<{
    webhook_secret_key: string;
    webhook_url: string;
    auto_assign_enabled: boolean;
  } | null>(null);

  // Campaign Info
  const [campaignName, setCampaignName] = useState('Meta & Instagram Leads (Golden Bloom)');
  const [sourceTag, setSourceTag] = useState('meta_ads');

  // 2-COLUMN MAPPING STUDIO (Pre-configured for Meta Leads GB)
  const [mappings, setMappings] = useState<FieldMapping[]>([
    { id: '1', dbField: 'name', dbLabel: 'Client Full Name (DB: name)', isCustom: false, sheetColumn: 'full_name' },
    { id: '2', dbField: 'phone', dbLabel: 'Phone Number (DB: phone)', isCustom: false, sheetColumn: 'phone_number' },
    { id: '3', dbField: 'email', dbLabel: 'Email Address (DB: email)', isCustom: false, sheetColumn: 'email' },
    { id: '4', dbField: 'service_requested', dbLabel: 'Service Required (DB: service_requested)', isCustom: false, sheetColumn: 'service_required' },
    { id: '5', dbField: 'villa_location', dbLabel: 'Villa / Location (DB: custom_fields.villa_location)', isCustom: true, sheetColumn: 'villa_location' },
    { id: '6', dbField: 'property_type', dbLabel: 'Property Type (DB: custom_fields.property_type)', isCustom: true, sheetColumn: 'property_type' },
    { id: '7', dbField: 'project_timeline', dbLabel: 'Timeline (DB: custom_fields.project_timeline)', isCustom: true, sheetColumn: 'project_timeline' },
    { id: '8', dbField: 'platform', dbLabel: 'Platform (fb/ig) (DB: custom_fields.platform)', isCustom: true, sheetColumn: 'platform' },
    { id: '9', dbField: 'campaign_name', dbLabel: 'Campaign (DB: campaign_name)', isCustom: false, sheetColumn: 'campaign_name' },
    { id: '10', dbField: 'form_name', dbLabel: 'Form Name (DB: custom_fields.form_name)', isCustom: true, sheetColumn: 'form_name' },
    { id: '11', dbField: 'inbox_url', dbLabel: 'Meta Inbox URL (DB: custom_fields.inbox_url)', isCustom: true, sheetColumn: 'inbox_url' },
  ]);

  const [newDbKey, setNewDbKey] = useState('');
  const [newSheetCol, setNewSheetCol] = useState('');

  // Generated Script Output
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Test Simulator State
  const [simValues, setSimValues] = useState<Record<string, string>>({
    'full_name': 'Yaqoob Alasmawi',
    'phone_number': 'p:+971506857741',
    'email': 'yoob@msn.com',
    'service_required': 'swimming_pool',
    'villa_location': 'Dubai Alquoz 2',
    'property_type': 'villa',
    'project_timeline': 'within_1_3_mon',
    'platform': 'ig',
    'campaign_name': 'GENERAL_CAMPAIGN_GB',
  });
  const [simLoading, setSimLoading] = useState(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiRequest('/settings');
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const handleToggleAutoAssign = async () => {
    if (!settings) return;
    try {
      const updated = await apiRequest('/settings', {
        method: 'POST',
        body: JSON.stringify({ auto_assign_enabled: !settings.auto_assign_enabled }),
      });
      setSettings(updated.settings);
    } catch (err: any) {
      alert(err.message || 'Failed to update auto assign');
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure you want to regenerate your Secret Key? You will need to update your Google Sheet scripts.')) return;
    try {
      const res = await apiRequest('/settings', {
        method: 'POST',
        body: JSON.stringify({ regenerate_key: true }),
      });
      setSettings(res.settings);
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate key');
    }
  };

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const handleSheetColumnChange = (id: string, value: string) => {
    setMappings(mappings.map(m => m.id === id ? { ...m, sheetColumn: value } : m));
  };

  const handleAddMappingRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbKey.trim() || !newSheetCol.trim()) {
      alert('Please enter both CRM DB field and Sheet column name.');
      return;
    }

    const cleanDbField = newDbKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newRow: FieldMapping = {
      id: String(Date.now()),
      dbField: cleanDbField,
      dbLabel: `${newDbKey.trim()} (DB: custom_fields.${cleanDbField})`,
      isCustom: true,
      sheetColumn: newSheetCol.trim(),
    };

    setMappings([...mappings, newRow]);
    setNewDbKey('');
    setNewSheetCol('');
  };

  const handleRemoveMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  const applyPreset = (preset: 'meta_gb' | 'meta' | 'instagram' | 'wedding') => {
    if (preset === 'meta_gb') {
      setCampaignName('Meta & Instagram Leads (Golden Bloom)');
      setSourceTag('meta_ads');
      setMappings([
        { id: '1', dbField: 'name', dbLabel: 'Client Full Name (DB: name)', isCustom: false, sheetColumn: 'full_name' },
        { id: '2', dbField: 'phone', dbLabel: 'Phone Number (DB: phone)', isCustom: false, sheetColumn: 'phone_number' },
        { id: '3', dbField: 'email', dbLabel: 'Email Address (DB: email)', isCustom: false, sheetColumn: 'email' },
        { id: '4', dbField: 'service_requested', dbLabel: 'Service Required (DB: service_requested)', isCustom: false, sheetColumn: 'service_required' },
        { id: '5', dbField: 'villa_location', dbLabel: 'Villa / Location (DB: custom_fields.villa_location)', isCustom: true, sheetColumn: 'villa_location' },
        { id: '6', dbField: 'property_type', dbLabel: 'Property Type (DB: custom_fields.property_type)', isCustom: true, sheetColumn: 'property_type' },
        { id: '7', dbField: 'project_timeline', dbLabel: 'Timeline (DB: custom_fields.project_timeline)', isCustom: true, sheetColumn: 'project_timeline' },
        { id: '8', dbField: 'platform', dbLabel: 'Platform (fb/ig) (DB: custom_fields.platform)', isCustom: true, sheetColumn: 'platform' },
        { id: '9', dbField: 'campaign_name', dbLabel: 'Campaign (DB: campaign_name)', isCustom: false, sheetColumn: 'campaign_name' },
        { id: '10', dbField: 'form_name', dbLabel: 'Form Name (DB: custom_fields.form_name)', isCustom: true, sheetColumn: 'form_name' },
        { id: '11', dbField: 'inbox_url', dbLabel: 'Meta Inbox URL (DB: custom_fields.inbox_url)', isCustom: true, sheetColumn: 'inbox_url' },
      ]);
    } else if (preset === 'meta') {
      setCampaignName('Meta Instant Form - Downtown Dubai');
      setSourceTag('facebook_ads');
      setMappings([
        { id: '1', dbField: 'name', dbLabel: 'Client Full Name (DB: name)', isCustom: false, sheetColumn: 'Full Name' },
        { id: '2', dbField: 'phone', dbLabel: 'Phone / Mobile (DB: phone)', isCustom: false, sheetColumn: 'Phone Number' },
        { id: '3', dbField: 'email', dbLabel: 'Email Address (DB: email)', isCustom: false, sheetColumn: 'Email' },
        { id: '4', dbField: 'service_requested', dbLabel: 'Service (DB: service_requested)', isCustom: false, sheetColumn: 'Inquiry Subject' },
        { id: '5', dbField: 'lead_notes', dbLabel: 'Notes (DB: lead_notes)', isCustom: false, sheetColumn: 'Client Message' },
        { id: '6', dbField: 'area', dbLabel: 'Delivery Area (DB: custom_fields.area)', isCustom: true, sheetColumn: 'Delivery Area / Community' },
        { id: '7', dbField: 'ad_name', dbLabel: 'Ad Name (DB: custom_fields.ad_name)', isCustom: true, sheetColumn: 'Campaign Ad Name' },
      ]);
    } else if (preset === 'instagram') {
      setCampaignName('Instagram Reels Luxury Bouquet Offer');
      setSourceTag('instagram_ads');
      setMappings([
        { id: '1', dbField: 'name', dbLabel: 'Client Full Name (DB: name)', isCustom: false, sheetColumn: 'User Name' },
        { id: '2', dbField: 'phone', dbLabel: 'Phone / Mobile (DB: phone)', isCustom: false, sheetColumn: 'WhatsApp Number' },
        { id: '3', dbField: 'email', dbLabel: 'Email Address (DB: email)', isCustom: false, sheetColumn: 'Email' },
        { id: '4', dbField: 'service_requested', dbLabel: 'Service (DB: service_requested)', isCustom: false, sheetColumn: 'Flower Preference' },
        { id: '5', dbField: 'lead_notes', dbLabel: 'Notes (DB: lead_notes)', isCustom: false, sheetColumn: 'Special Request' },
        { id: '6', dbField: 'city', dbLabel: 'City (DB: custom_fields.city)', isCustom: true, sheetColumn: 'City' },
        { id: '7', dbField: 'budget', dbLabel: 'Budget (DB: custom_fields.budget)', isCustom: true, sheetColumn: 'Budget (AED)' },
        { id: '8', dbField: 'instagram_handle', dbLabel: 'Instagram ID (DB: custom_fields.instagram_handle)', isCustom: true, sheetColumn: 'Instagram Handle' },
      ]);
    } else {
      setCampaignName('Corporate & Villa Renovation Events');
      setSourceTag('corporate_events');
      setMappings([
        { id: '1', dbField: 'name', dbLabel: 'Contact Person (DB: name)', isCustom: false, sheetColumn: 'Contact Name' },
        { id: '2', dbField: 'phone', dbLabel: 'Mobile Number (DB: phone)', isCustom: false, sheetColumn: 'Mobile No' },
        { id: '3', dbField: 'email', dbLabel: 'Corporate Email (DB: email)', isCustom: false, sheetColumn: 'Company Email' },
        { id: '4', dbField: 'service_requested', dbLabel: 'Project Required (DB: service_requested)', isCustom: false, sheetColumn: 'Project Type' },
        { id: '5', dbField: 'lead_notes', dbLabel: 'Notes (DB: lead_notes)', isCustom: false, sheetColumn: 'Project Details' },
        { id: '6', dbField: 'company_name', dbLabel: 'Company (DB: custom_fields.company_name)', isCustom: true, sheetColumn: 'Company / Villa Name' },
        { id: '7', dbField: 'event_date', dbLabel: 'Target Date (DB: custom_fields.event_date)', isCustom: true, sheetColumn: 'Completion Target Date' },
      ]);
    }
  };

  const secretKey = settings?.webhook_secret_key || 'gb_sec_goldenbloom_998124';
  const webhookUrl = settings?.webhook_url || `${API_BASE_URL}/webhooks/lead`;

  const generateScriptFromMappings = () => {
    const mappingStatements = mappings.map(m => {
      const colClean = m.sheetColumn.trim();
      if (!colClean) return '';

      if (m.isCustom) {
        return `        if (colLower === "${colClean.toLowerCase()}") {
          payload.custom_fields["${m.dbField}"] = String(val).trim();
        }`;
      } else {
        return `        if (colLower === "${colClean.toLowerCase()}") {
          payload.${m.dbField} = String(val).trim();
        }`;
      }
    }).filter(Boolean).join('\n');

    return `/**
 * =========================================================================
 * GOLDEN BLOOM CRM - PROFESSIONAL GOOGLE SHEETS LIVE SYNC
 * Campaign: ${campaignName}
 * Source Tag: ${sourceTag}
 * Webhook URL: ${webhookUrl}
 * =========================================================================
 */

const CRM_WEBHOOK_URL = "${webhookUrl}";
const CRM_SECRET_KEY  = "${secretKey}";
const CAMPAIGN_NAME   = "${campaignName}";
const SOURCE_TAG      = "${sourceTag}";

/**
 * Adds "🌸 Golden Bloom CRM" menu to the top Google Sheets menu bar on open.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🌸 Golden Bloom CRM")
    .addItem("🚀 Sync All Leads Now", "syncAllLeadsToCRM")
    .addItem("⚡ Enable 5-Min Auto-Sync", "setupAutoSyncTrigger")
    .addSeparator()
    .addItem("🧪 Test Connection", "testConnection")
    .addToUi();
}

/**
 * Loops through ALL rows, checks sync status, and sends unsynced leads to CRM.
 */
function syncAllLeadsToCRM() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 2) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Sheet has no lead data.", "Golden Bloom CRM");
    return;
  }

  // Find or create 'CRM Sync Status' column
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let statusColIdx = -1;
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).toLowerCase().includes("crm status") || String(headers[i]).toLowerCase().includes("sync status")) {
      statusColIdx = i + 1;
      break;
    }
  }

  if (statusColIdx === -1) {
    statusColIdx = lastCol + 1;
    sheet.getRange(1, statusColIdx).setValue("CRM Sync Status").setFontWeight("bold").setBackground("#fef3c7");
  }

  const allData = sheet.getRange(2, 1, lastRow - 1, Math.max(lastCol, statusColIdx)).getValues();
  let syncedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let r = 0; r < allData.length; r++) {
    const rowNum = r + 2;
    const rowValues = allData[r];
    const currentStatus = String(rowValues[statusColIdx - 1] || "");

    // Skip already synced leads
    if (currentStatus.startsWith("✅ Synced")) {
      skippedCount++;
      continue;
    }

    let payload = {
      api_key: CRM_SECRET_KEY,
      source: SOURCE_TAG,
      campaign_name: CAMPAIGN_NAME,
      name: "",
      phone: "",
      email: "",
      service_requested: "",
      lead_notes: "",
      custom_fields: {}
    };

    for (let c = 0; c < headers.length; c++) {
      const headerTitle = String(headers[c]).trim();
      const colLower = headerTitle.toLowerCase();
      const val = rowValues[c];

      if (val === null || val === undefined || String(val).trim() === "") continue;

${mappingStatements}
    }

    // Auto-clean phone (strip 'p:', spaces, special chars)
    if (payload.phone) {
      payload.phone = String(payload.phone).replace(/[^\\+0-9]/g, "");
    }

    if (!payload.name) {
      payload.name = payload.phone ? ("Lead " + payload.phone) : "Inbound Lead";
    }

    if (!payload.phone && !payload.email) {
      sheet.getRange(rowNum, statusColIdx).setValue("⚠️ Missing Phone & Email").setFontColor("#b45309");
      skippedCount++;
      continue;
    }

    try {
      const options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
      const resCode = response.getResponseCode();
      const resText = response.getContentText();

      if (resCode >= 200 && resCode < 300) {
        let jsonRes = {};
        try { jsonRes = JSON.parse(resText); } catch(e) {}
        const leadId = jsonRes.lead_id ? (" #" + jsonRes.lead_id) : "";
        sheet.getRange(rowNum, statusColIdx).setValue("✅ Synced" + leadId).setFontColor("#047857");
        syncedCount++;
      } else {
        sheet.getRange(rowNum, statusColIdx).setValue("❌ Error " + resCode).setFontColor("#b91c1c");
        errorCount++;
      }
    } catch (err) {
      sheet.getRange(rowNum, statusColIdx).setValue("❌ Network Error").setFontColor("#b91c1c");
      errorCount++;
    }
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Sync Finished: " + syncedCount + " Synced, " + skippedCount + " Skipped, " + errorCount + " Errors.",
    "Golden Bloom CRM"
  );
}

/**
 * Automatically triggers whenever a new row is added (Meta Ads, Zapier, Form or Paste).
 */
function onFormSubmitOrEdit(e) {
  syncAllLeadsToCRM();
}

/**
 * Installs both Time-Driven (Every 5 mins) and Change triggers for 100% background automation.
 */
function setupAutoSyncTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // 1. Trigger every 5 minutes in background
  ScriptApp.newTrigger("syncAllLeadsToCRM")
    .timeBased()
    .everyMinutes(5)
    .create();

  // 2. Trigger on sheet edit / change
  ScriptApp.newTrigger("syncAllLeadsToCRM")
    .forSpreadsheet(ss)
    .onChange()
    .create();

  SpreadsheetApp.getUi().alert(
    "✅ Auto-Sync Activated!\\n\\nNew leads will now sync automatically every 5 minutes and on any new submission."
  );
}

/**
 * 1-Click Connection Test
 */
function testConnection() {
  const ui = SpreadsheetApp.getUi();
  try {
    const payload = {
      api_key: CRM_SECRET_KEY,
      name: "Connection Test",
      phone: "+971500000000",
      email: "test@goldenbloom.ae",
      lead_notes: "Ping test from Google Sheets",
      source: "google_sheet_test"
    };

    const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      ui.alert("✅ Connection Successful!\\n\\nGolden Bloom CRM API responded with 200 OK.");
    } else {
      ui.alert("⚠️ Connection Failed (HTTP " + response.getResponseCode() + ")\\n\\nResponse: " + response.getContentText());
    }
  } catch (err) {
    ui.alert("❌ Error Connecting:\\n\\n" + err.toString());
  }
}
`;
  };

  const generatedScript = generateScriptFromMappings();

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimSuccess(null);
    setSimError(null);

    let payloadName = '';
    let payloadPhone = '';
    let payloadEmail = '';
    let payloadService = '';
    let payloadNotes = '';
    let customPayload: Record<string, any> = {};

    mappings.forEach(m => {
      const val = simValues[m.sheetColumn] || '';
      if (!val) return;

      if (m.dbField === 'name') payloadName = val;
      else if (m.dbField === 'phone') payloadPhone = val;
      else if (m.dbField === 'email') payloadEmail = val;
      else if (m.dbField === 'service_requested') payloadService = val;
      else if (m.dbField === 'lead_notes') payloadNotes = val;
      else customPayload[m.dbField] = val;
    });

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: secretKey,
          name: payloadName || 'Test Lead',
          phone: payloadPhone || '+971501122334',
          email: payloadEmail,
          source: sourceTag,
          campaign_name: campaignName,
          service_requested: payloadService,
          lead_notes: payloadNotes,
          custom_fields: customPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Webhook failed');

      setSimSuccess(
        `Lead received (ID #${data.lead_id}) with all mapped columns saved in MySQL! Assigned to agent ID: ${data.assigned_to || 'None'}. Check Leads tab.`
      );
    } catch (err: any) {
      setSimError(err.message || 'Error executing webhook simulation');
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      
      {/* Light Theme Header Card */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-800 rounded-lg">
              <TableProperties className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Google Sheets 2-Column Field Mapper</h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Map any Google Sheet column directly to its matching CRM database field to generate a plug-and-play auto-sync script.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-600 font-medium text-[11px]">Auto Round-Robin:</span>
            <button
              onClick={handleToggleAutoAssign}
              className={`px-1.5 py-0.2 rounded font-bold text-[10px] transition ${
                settings?.auto_assign_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {settings?.auto_assign_enabled ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Secret Key & Webhook Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>CRM Secret API Key</span>
            <button
              onClick={handleRegenerateKey}
              className="text-amber-700 hover:text-amber-800 text-[10px] flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Regenerate
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <Key className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <code className="text-xs font-mono text-slate-800 flex-1 truncate">{secretKey}</code>
            <button
              onClick={() => copyToClipboard(secretKey, setCopiedKey)}
              className="px-2 py-0.5 text-xs bg-white border border-slate-200 rounded hover:border-amber-500 text-slate-700 flex items-center gap-1 font-medium transition"
            >
              {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copiedKey ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
          <span className="text-xs font-bold text-slate-600 block">
            CRM Ingestion Webhook Endpoint
          </span>
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <code className="text-xs font-mono text-slate-800 flex-1 truncate">{webhookUrl}</code>
            <button
              onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
              className="px-2 py-0.5 text-xs bg-white border border-slate-200 rounded hover:border-amber-500 text-slate-700 flex items-center gap-1 font-medium transition"
            >
              {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copiedUrl ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* 2-COLUMN FIELD MAPPING STUDIO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Studio Header */}
        <div className="p-3 sm:p-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Visual Column Matching Studio
            </h3>
            <p className="text-[11px] text-slate-500">
              Specify your Google Sheet column headers to map them directly to database target fields.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('meta_gb')}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 transition shadow-2xs"
            >
              🌸 Meta Leads (Test Leads GB)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('meta')}
              className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
            >
              Meta Ads
            </button>
            <button
              type="button"
              onClick={() => applyPreset('instagram')}
              className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100 transition"
            >
              Instagram Reels
            </button>
            <button
              type="button"
              onClick={() => applyPreset('wedding')}
              className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition"
            >
              Corporate & Villa
            </button>
          </div>
        </div>

        {/* Campaign Info Inputs */}
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Campaign / Sheet Identifier
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Instagram Reels Oct Offer"
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Source Tag
            </label>
            <select
              value={sourceTag}
              onChange={(e) => setSourceTag(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="instagram_ads">Instagram Ads</option>
              <option value="facebook_ads">Facebook Ads (Meta)</option>
              <option value="tiktok_ads">TikTok Ads</option>
              <option value="google_sheet">Google Sheet Sync</option>
              <option value="corporate_events">Corporate & Villa Renovation</option>
              <option value="website">Website Contact Form</option>
            </select>
          </div>
        </div>

        {/* 2-Column Table */}
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-12 gap-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            <div className="col-span-5 flex items-center gap-1.5 text-slate-700">
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>CRM Database Target Field</span>
            </div>
            <div className="col-span-1 text-center text-slate-300">&rarr;</div>
            <div className="col-span-5 flex items-center gap-1.5 text-slate-700">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Your Google Sheet Column Header</span>
            </div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="space-y-2">
            {mappings.map((m) => (
              <div 
                key={m.id} 
                className="grid grid-cols-12 gap-3 items-center bg-slate-50/70 p-2 rounded-xl border border-slate-200 transition"
              >
                {/* Left: DB Field Badge */}
                <div className="col-span-5">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    m.isCustom 
                      ? 'bg-purple-50 text-purple-800 border border-purple-200' 
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}>
                    {m.dbLabel}
                  </span>
                </div>

                {/* Arrow */}
                <div className="col-span-1 text-center text-slate-400 font-bold">
                  <ArrowRight className="w-3.5 h-3.5 mx-auto text-amber-600" />
                </div>

                {/* Right: Google Sheet Column Name Input */}
                <div className="col-span-5">
                  <input
                    type="text"
                    value={m.sheetColumn}
                    onChange={(e) => handleSheetColumnChange(m.id, e.target.value)}
                    placeholder="Sheet Column Title..."
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Remove Row Button */}
                <div className="col-span-1 text-right">
                  {m.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMapping(m.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-white"
                      title="Remove Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Field Mapping Form */}
          <form onSubmit={handleAddMappingRow} className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700 whitespace-nowrap">+ Add Custom Mapping:</span>
            
            <input
              type="text"
              value={newDbKey}
              onChange={(e) => setNewDbKey(e.target.value)}
              placeholder="DB Field (e.g. villa_number)..."
              className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            />

            <span className="text-slate-400 font-bold">&rarr;</span>

            <input
              type="text"
              value={newSheetCol}
              onChange={(e) => setNewSheetCol(e.target.value)}
              placeholder="Sheet Column (e.g. Villa #)..."
              className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
            />

            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </form>

        </div>

        {/* Generate Script Action Bar */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Apps Script Ready For Sheet Auto-Sync</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              This script reads the exact Google Sheet columns you mapped above and posts them to your CRM.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(generatedScript, setCopiedScript)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedScript ? 'Copied to Clipboard!' : 'Copy Tailored Google Script'}
          </button>
        </div>

        {/* Code Snippet Box */}
        <div className="p-4 bg-slate-900">
          <pre className="text-emerald-300 text-xs font-mono overflow-x-auto max-h-56 scrollbar-thin">
            {generatedScript}
          </pre>
        </div>

      </div>

      {/* LIVE TEST SIMULATOR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-amber-50 text-amber-800 rounded-xl">
            <Send className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Webhook Test Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Send a test lead using your mapped column structure to verify database storage.
            </p>
          </div>
        </div>

        {simSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{simSuccess}</span>
          </div>
        )}

        {simError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{simError}</span>
          </div>
        )}

        <form onSubmit={handleTestSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {mappings.map((m) => (
              <div key={m.id}>
                <label className="block font-semibold text-slate-700 mb-1 truncate" title={m.sheetColumn}>
                  {m.sheetColumn} <span className="text-[10px] text-slate-400 font-normal">({m.dbField})</span>
                </label>
                <input
                  type="text"
                  value={simValues[m.sheetColumn] || ''}
                  onChange={(e) => setSimValues({ ...simValues, [m.sheetColumn]: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={simLoading}
              className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {simLoading ? 'Sending...' : 'Send Live Mapped Test Lead'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
