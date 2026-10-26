'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Bell, Smartphone, MessageSquare, Send, CheckCircle2, 
  AlertCircle, ShieldCheck, Sparkles, Sliders, ExternalLink, RefreshCw, Check
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { 
  requestNotificationPermission, 
  triggerTestLockScreenNotification,
  isScreenAlertsActive 
} from '@/lib/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLead?: (leadId: number) => void;
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
  onOpenLead,
}: NotificationSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'push' | 'whatsapp'>('push');

  // Push notification state
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [testingPush, setTestingPush] = useState(false);
  const [pushTestSuccess, setPushTestSuccess] = useState(false);

  // WhatsApp settings state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappNumbers, setWhatsappNumbers] = useState('');
  const [notifyTelecaller, setNotifyTelecaller] = useState(true);
  const [provider, setProvider] = useState('webhook');
  const [apiUrl, setApiUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // WhatsApp test state
  const [testPhone, setTestPhone] = useState('');
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testWhatsAppResult, setTestWhatsAppResult] = useState<{
    success: boolean;
    message?: string;
    click_url?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isScreenAlertsActive()) {
        setPermissionStatus('granted');
      } else if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    }
    if (isOpen) {
      loadWhatsAppSettings();
    }
  }, [isOpen]);

  const loadWhatsAppSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await apiRequest<{
        whatsapp_enabled: boolean;
        whatsapp_notify_numbers: string;
        whatsapp_notify_telecaller_on_assign: boolean;
        whatsapp_provider: string;
        whatsapp_api_url: string;
        whatsapp_api_token: string;
        whatsapp_instance_id: string;
      }>('/whatsapp/settings');

      setWhatsappEnabled(data.whatsapp_enabled ?? true);
      setWhatsappNumbers(data.whatsapp_notify_numbers || '');
      setNotifyTelecaller(data.whatsapp_notify_telecaller_on_assign ?? true);
      setProvider(data.whatsapp_provider || 'webhook');
      setApiUrl(data.whatsapp_api_url || '');
      setApiToken(data.whatsapp_api_token || '');
      setInstanceId(data.whatsapp_instance_id || '');

      // Set default test phone to the first admin number
      if (data.whatsapp_notify_numbers) {
        const first = data.whatsapp_notify_numbers.split(',')[0].trim();
        setTestPhone(first);
      }
    } catch (err: any) {
      console.error('Failed to load WhatsApp settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSaveSuccess(false);

      await apiRequest('/whatsapp/settings', {
        method: 'POST',
        body: JSON.stringify({
          whatsapp_enabled: whatsappEnabled,
          whatsapp_notify_numbers: whatsappNumbers,
          whatsapp_notify_telecaller_on_assign: notifyTelecaller,
          whatsapp_provider: provider,
          whatsapp_api_url: apiUrl,
          whatsapp_api_token: apiToken,
          whatsapp_instance_id: instanceId,
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestLockScreen = async () => {
    setTestingPush(true);
    setPushTestSuccess(false);
    try {
      const ok = await triggerTestLockScreenNotification(onOpenLead);
      if (ok) {
        setPermissionStatus('granted');
        setPushTestSuccess(true);
        setTimeout(() => setPushTestSuccess(false), 4000);
      } else {
        setPermissionStatus(Notification.permission);
      }
    } finally {
      setTestingPush(false);
    }
  };

  const handleSendTestWhatsApp = async () => {
    if (!testPhone.trim()) {
      alert('Please enter a phone number with country code (e.g. +971501234567)');
      return;
    }

    setTestingWhatsApp(true);
    setTestWhatsAppResult(null);
    try {
      const res = await apiRequest<{
        success: boolean;
        message?: string;
        click_url?: string;
      }>('/whatsapp/test', {
        method: 'POST',
        body: JSON.stringify({ phone: testPhone.trim() }),
      });

      setTestWhatsAppResult(res);
    } catch (err: any) {
      setTestWhatsAppResult({
        success: false,
        message: err.message || 'Test failed to send',
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Bell className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Push & WhatsApp Alerts Setup</h2>
              <p className="text-xs text-emerald-200/90">
                Lock screen, slide bar, and direct WhatsApp notifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 sm:px-6 pt-3 gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('push')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 ${
              activeTab === 'push'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Screen Alerts</span>
            <span className="hidden sm:inline">📱 Lock Screen &amp; Slide Bar</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 ${
              activeTab === 'whatsapp'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="sm:hidden">WhatsApp</span>
            <span className="hidden sm:inline">💬 WhatsApp Alerts</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">

          {/* TAB 1: LOCK SCREEN & SLIDE BAR PUSH NOTIFICATIONS */}
          {activeTab === 'push' && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-150">
              {/* Permission & Test Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${permissionStatus === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                        {permissionStatus === 'granted' 
                          ? 'Lock Screen Alerts: ACTIVATED ✅' 
                          : 'Lock Screen Permission Needed'}
                      </h3>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
                      Whenever new leads arrive from Meta Ads or Website, an instant chime sound and a notification banner will appear right on your phone&apos;s slide bar and lock screen.
                    </p>
                  </div>

                  <button
                    onClick={handleTestLockScreen}
                    disabled={testingPush}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
                  >
                    <Bell className="w-4 h-4" />
                    <span>{testingPush ? 'Testing...' : 'Test On My Screen'}</span>
                  </button>
                </div>

                {pushTestSuccess && (
                  <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-300 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Test notification sent! Look at your top slide bar or lock screen.</span>
                  </div>
                )}
              </div>

              {/* Step-by-Step Device Setup Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Android Setup */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-800">
                    <span className="text-lg">🤖</span>
                    <span>Android (Samsung, Xiaomi, etc.)</span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Chrome</strong> on your phone.</li>
                    <li>Tap the <strong>3 dots (⋮)</strong> at top-right.</li>
                    <li>Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> (or <strong>&ldquo;Install App&rdquo;</strong>).</li>
                    <li>Open the CRM from your home screen and tap <strong>Allow Notifications</strong>.</li>
                  </ol>
                  <p className="text-[11px] text-emerald-700 font-medium mt-3 bg-emerald-50 p-2 rounded-lg">
                    ✨ Alerts will pop up in your top slide bar & lock screen even when app is closed!
                  </p>
                </div>

                {/* iPhone Setup */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-800">
                    <span className="text-lg">🍏</span>
                    <span>Apple iPhone (iOS)</span>
                  </div>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Safari</strong> on your iPhone: <br/><code className="text-emerald-700 bg-emerald-50 px-1 rounded">crm.goldenbloom.ae</code></li>
                    <li>Tap the <strong>Share button</strong> at bottom (square with arrow 📤).</li>
                    <li>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</li>
                    <li>Open the Golden Bloom app icon from your home screen and tap <strong>Allow Notifications</strong>.</li>
                  </ol>
                  <p className="text-[11px] text-emerald-700 font-medium mt-3 bg-emerald-50 p-2 rounded-lg">
                    ✨ Native iOS banners will ring and vibrate on your iPhone lock screen!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP INSTANT NOTIFICATIONS */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* WhatsApp Enable & Target Numbers */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Enable WhatsApp Notifications</h3>
                    <p className="text-xs text-slate-500">Automatically deliver formatted lead alerts via WhatsApp</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={whatsappEnabled} 
                      onChange={(e) => setWhatsappEnabled(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Recipient Phone Numbers Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Admin WhatsApp Number(s) for All New Leads:
                  </label>
                  <input
                    type="text"
                    value={whatsappNumbers}
                    onChange={(e) => setWhatsappNumbers(e.target.value)}
                    placeholder="+971501234567, +971559876543"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Enter the WhatsApp phone number(s) to receive alerts when ANY new lead arrives. Separate multiple numbers with a comma. Always include country code (e.g. <code>+971</code> for UAE).
                  </p>
                </div>

                {/* Telecaller Assignment Alert Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-700">Alert Assigned Telecaller:</span>
                    <p className="text-[11px] text-slate-500">Send WhatsApp message to the assigned telecaller&apos;s personal phone</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifyTelecaller} 
                      onChange={(e) => setNotifyTelecaller(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Test Alert Sender Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Send Test WhatsApp Alert Now</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+971501234567"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSendTestWhatsApp}
                    disabled={testingWhatsApp}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {testingWhatsApp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Test</span>
                  </button>
                </div>

                {testWhatsAppResult && (
                  <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                    testWhatsAppResult.success ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-300' : 'bg-amber-100/70 text-amber-900 border border-amber-300'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">{testWhatsAppResult.message || 'Test message dispatched!'}</p>
                      {testWhatsAppResult.click_url && (
                        <a 
                          href={testWhatsAppResult.click_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 underline font-bold mt-1 text-[11px]"
                        >
                          <span>👉 Open in WhatsApp Now to View</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced WhatsApp API / Webhook Settings (Collapsible) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Advanced WhatsApp Gateway (UltraMsg / Wasapi / Webhook)</span>
                  </div>
                  <span className="text-slate-400 font-normal">{showAdvanced ? '▲ Hide' : '▼ Configure'}</span>
                </button>

                {showAdvanced && (
                  <div className="p-4 space-y-3 bg-white border-t border-slate-200 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Provider Type:</label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="webhook">Generic Webhook (Make.com, Zapier, n8n, Evolution API)</option>
                        <option value="ultramsg">UltraMsg (Instance ID + Token)</option>
                        <option value="wasapi">Wasapi (UAE / MENA WhatsApp Gateway)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">API URL / Webhook Endpoint:</label>
                      <input
                        type="text"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        placeholder="https://api.ultramsg.com or https://hook.eu1.make.com/..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">API Token / Secret:</label>
                        <input
                          type="password"
                          value={apiToken}
                          onChange={(e) => setApiToken(e.target.value)}
                          placeholder="Token / Secret"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                        />
                      </div>
                      {provider === 'ultramsg' && (
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Instance ID:</label>
                          <input
                            type="text"
                            value={instanceId}
                            onChange={(e) => setInstanceId(e.target.value)}
                            placeholder="instance12345"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Feedback & Button */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>WhatsApp settings saved successfully!</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save WhatsApp Configuration'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Golden Bloom Notification Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
