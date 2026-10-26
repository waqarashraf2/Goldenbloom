'use client';

import React, { useState, useEffect } from 'react';
import { User, Lead, DashboardStats, apiRequest } from '@/lib/api';
import DashboardView from '@/components/DashboardView';
import LeadsView from '@/components/LeadsView';
import IntegrationsView from '@/components/IntegrationsView';
import CsvImportView from '@/components/CsvImportView';
import TelecallersView from '@/components/TelecallersView';
import CallHistoryView from '@/components/CallHistoryView';
import LogCallModal from '@/components/LogCallModal';
import LeadDetailsModal from '@/components/LeadDetailsModal';
import NotificationBell from '@/components/NotificationBell';
import DownloadApkModal from '@/components/DownloadApkModal';
import IosInstallBanner from '@/components/IosInstallBanner';
import NotificationSettingsModal from '@/components/NotificationSettingsModal';
import { isInsideNativeApp } from '@/lib/notifications';
import { 
  LayoutDashboard, Users, Clock, PhoneCall, FileSpreadsheet, 
  LogOut, Shield, Menu, X, Key, TableProperties, Database,
  PanelLeftClose, PanelLeftOpen, RotateCw, Smartphone, Download, MessageSquare
} from 'lucide-react';

const VALID_TABS = ['dashboard', 'leads', 'followups', 'activities', 'telecallers', 'import', 'integrations'];

export default function CrmApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [telecallers, setTelecallers] = useState<User[]>([]);
  const [activeCallModalLead, setActiveCallModalLead] = useState<Lead | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDownloadApkModal, setShowDownloadApkModal] = useState(false);
  const [installModalTab, setInstallModalTab] = useState<'android' | 'iphone'>('android');
  const [clientDevice, setClientDevice] = useState<'iphone' | 'android' | 'desktop'>('desktop');
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);

  // Detect client device & native app status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsNativeApp(isInsideNativeApp());

      const handleNativeReady = () => setIsNativeApp(true);
      window.addEventListener('gb_native_app_ready', handleNativeReady);

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isIOS) {
        setClientDevice('iphone');
        setInstallModalTab('iphone');
      } else if (isAndroid) {
        setClientDevice('android');
        setInstallModalTab('android');
      }

      return () => {
        window.removeEventListener('gb_native_app_ready', handleNativeReady);
      };
    }
  }, []);

  const handleOpenInstallModal = (tab?: 'iphone' | 'android') => {
    if (tab) {
      setInstallModalTab(tab);
    } else {
      setInstallModalTab(clientDevice === 'iphone' ? 'iphone' : 'android');
    }
    setShowDownloadApkModal(true);
  };

  // Auto-refresh and manual refresh state
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Leads filter state triggered by dashboard cards
  const [leadsFilter, setLeadsFilter] = useState<{ source?: string; today_followups?: boolean } | undefined>(undefined);

  // Lead Details Modal triggered from Notification click or URL ?lead_id=
  const [targetNotificationLead, setTargetNotificationLead] = useState<Lead | null>(null);

  const handleOpenLeadById = async (leadId: number) => {
    try {
      const lead = await apiRequest<Lead>(`/leads/${leadId}`);
      if (lead) {
        setTargetNotificationLead(lead);
      }
    } catch (err) {
      console.error('Failed to open lead from notification', err);
      setActiveTab('leads');
    }
  };

  // Initial load: parse local auth & URL ?tab= parameter
  useEffect(() => {
    const savedToken = localStorage.getItem('crm_token');
    const savedUser = localStorage.getItem('crm_user');
    let user: User | null = null;
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (e) {
        localStorage.clear();
      }
    }

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTab = searchParams.get('tab');
      const urlLeadId = searchParams.get('lead_id');

      if (urlTab && VALID_TABS.includes(urlTab)) {
        setActiveTab(urlTab);
        if (urlTab === 'followups') {
          setLeadsFilter({ today_followups: true });
        }
      } else if (user && user.role === 'telecaller') {
        setActiveTab('leads');
      }

      if (urlLeadId && savedToken) {
        handleOpenLeadById(parseInt(urlLeadId));
      }
    }

    // Support browser Back/Forward buttons
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const searchParams = new URLSearchParams(window.location.search);
      const urlTab = searchParams.get('tab');
      if (urlTab && VALID_TABS.includes(urlTab)) {
        setActiveTab(urlTab);
        if (urlTab === 'followups') {
          setLeadsFilter({ today_followups: true });
        } else if (urlTab === 'leads') {
          setLeadsFilter(undefined);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentUser && token) {
      loadStats();
      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        loadTelecallers();
      }
    }
  }, [currentUser, token]);

  // 60-Second Background Polling from MySQL DB
  useEffect(() => {
    if (!currentUser || !token) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        triggerRefresh(false);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [currentUser, token]);

  const loadStats = async () => {
    try {
      const data = await apiRequest<DashboardStats>('/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    }
  };

  const loadTelecallers = async () => {
    try {
      const data = await apiRequest<User[]>('/users');
      setTelecallers(data.filter(u => u.role === 'telecaller' && u.is_active));
    } catch (err) {
      console.error('Failed to load telecallers list', err);
    }
  };

  // Centralized Tab Switcher with browser URL sync
  const switchTab = (tabId: string, filter?: { source?: string; today_followups?: boolean }) => {
    setActiveTab(tabId);
    if (tabId === 'followups') {
      setLeadsFilter({ today_followups: true });
    } else if (tabId === 'leads') {
      setLeadsFilter(filter || undefined);
    }

    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('tab', tabId);
      window.history.pushState({ tab: tabId }, '', currentUrl.toString());
    }
  };

  // Trigger manual or automatic refresh of all views
  const triggerRefresh = async (isManual = true) => {
    if (isManual) {
      if (isRefreshing) return;
      setIsRefreshing(true);
    }
    try {
      await Promise.all([
        loadStats(),
        (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') ? loadTelecallers() : Promise.resolve(),
      ]);
      setRefreshTrigger(prev => prev + 1);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Refresh error', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);

      // Check if URL has a tab specified, else default to role home
      const searchParams = new URLSearchParams(window.location.search);
      const urlTab = searchParams.get('tab');
      const targetTab = (urlTab && VALID_TABS.includes(urlTab)) 
        ? urlTab 
        : ((data.user.role === 'admin' || data.user.role === 'super_admin') ? 'dashboard' : 'leads');
      switchTab(targetTab);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken(null);
    setCurrentUser(null);
    setStats(null);
  };

  const handleCallLogged = (updatedLead: Lead) => {
    triggerRefresh(false);
  };

  const handleNavigateToLeads = (filter?: { source?: string; today_followups?: boolean }) => {
    switchTab(filter?.today_followups ? 'followups' : 'leads', filter);
  };

  // Compact Single-Line Navigation Items in 100% English
  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      adminOnly: false 
    },
    { 
      id: 'leads', 
      label: (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') ? 'All Leads' : 'My Leads', 
      icon: Users, 
      adminOnly: false 
    },
    { 
      id: 'followups', 
      label: "Today's Follow-ups", 
      icon: Clock, 
      adminOnly: false,
      badge: stats?.stats?.today_followups ? String(stats.stats.today_followups) : undefined 
    },
    { 
      id: 'activities', 
      label: 'Call Activities', 
      icon: PhoneCall, 
      adminOnly: false 
    },
    { 
      id: 'telecallers', 
      label: 'Team & Permissions', 
      icon: Shield, 
      adminOnly: true 
    },
    { 
      id: 'import', 
      label: 'CSV Bulk Import', 
      icon: FileSpreadsheet, 
      adminOnly: true 
    },
    { 
      id: 'integrations', 
      label: 'Google Sheet Studio', 
      icon: TableProperties, 
      adminOnly: true 
    },
  ];

  const visibleNavItems = navigationItems.filter(item => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') return true;
    if (item.adminOnly) return false;
    if (currentUser.allowed_tabs && currentUser.allowed_tabs.length > 0) {
      if (item.id === 'followups' && !currentUser.allowed_tabs.includes('followups')) return false;
      if (item.id === 'activities' && !currentUser.allowed_tabs.includes('call_history')) return false;
      if (item.id === 'leads' && !currentUser.allowed_tabs.includes('leads')) return false;
      if (item.id === 'dashboard' && !currentUser.allowed_tabs.includes('dashboard')) return false;
    }
    return true;
  });

  // =========================================================================
  // LIGHT THEME LOGIN SCREEN
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200 text-slate-800 space-y-6">
          
          {/* Logo & Brand Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <img
                src="/goldenbloom-logo.png"
                alt="Golden Bloom"
                className="h-16 w-auto object-contain mx-auto"
                style={{ maxHeight: '64px', width: 'auto' }}
              />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Golden Bloom CRM</h1>
            <p className="text-xs text-slate-500">
              Lead Management System &bull; <a href="https://goldenbloom.ae" target="_blank" className="text-amber-700 hover:underline">goldenbloom.ae</a>
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(loginEmail, loginPassword); }} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="superadmin@goldenbloom.ae"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // =========================================================================
  // LIGHT THEME MAIN LAYOUT WITH COMPACT SINGLE-LINE LEFT SIDEBAR
  // =========================================================================
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-2xs"
        />
      )}

      {/* ============================================================== */}
      {/* CLEAN LIGHT LEFT SIDEBAR */}
      {/* ============================================================== */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-60 bg-white text-slate-700 border-r border-slate-200 flex flex-col transition-all duration-200 ease-in-out shadow-xs
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}
      `}>
        
        {/* Brand Header with Clean Logo & Close/Collapse Button */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/goldenbloom-logo.png"
              alt="Golden Bloom"
              className="h-8 w-auto object-contain"
              style={{ maxHeight: '32px', width: 'auto' }}
            />
            <div>
              <span className="font-extrabold text-slate-900 text-xs tracking-tight block">
                Golden Bloom
              </span>
              <span className="text-[10px] text-amber-700 font-semibold block">
                CRM Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse / Full-Screen Button */}
            <button
              onClick={() => setSidebarCollapsed(true)}
              title="Close sidebar tabs (Full-Screen View)"
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>

            {/* Mobile Close Drawer Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Single-Line Navigation Tabs */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  switchTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive 
                    ? 'bg-amber-700 text-white shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: User Card */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/50">
          
          {/* Download / Install Mobile App Card (Hidden inside application) */}
          {!isNativeApp && (
            <button
              type="button"
              onClick={() => handleOpenInstallModal()}
              className="w-full mb-2 p-2 rounded-xl bg-linear-to-r from-amber-50 to-amber-100/80 hover:from-amber-100 hover:to-amber-200/80 border border-amber-300 text-amber-950 flex items-center justify-between text-xs font-bold transition shadow-2xs cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold leading-tight">
                    {clientDevice === 'iphone' ? '🍏 iPhone App' : clientDevice === 'android' ? '🤖 Android App (.APK)' : '📱 Mobile App'}
                  </div>
                  <div className="text-[9px] text-amber-700 font-medium">
                    {clientDevice === 'iphone' ? 'Add to Home Screen' : 'Screen Alerts Ready'}
                  </div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-amber-700 group-hover:translate-y-0.5 transition" />
            </button>
          )}

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                currentUser.role === 'super_admin'
                  ? 'bg-rose-100 text-rose-800'
                  : currentUser.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 text-xs truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                    currentUser.role === 'super_admin'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : currentUser.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN VIEWPORT (RIGHT SIDE) */}
      {/* ============================================================== */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
        sidebarCollapsed ? 'lg:pl-0' : 'lg:pl-60'
      }`}>
        
        {/* Top Navbar */}
        <header className="h-12 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-2.5">
            {/* Sidebar toggle button (Mobile & Desktop Full-Screen Toggle) */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              title={sidebarCollapsed ? "Open sidebar tabs" : "Close sidebar tabs (Full Screen)"}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-2xs transition"
            >
              {sidebarCollapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-amber-700" />
                  <span className="text-[11px] font-bold text-amber-900">Show Tabs</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline text-[11px] text-slate-600 font-medium">Full Screen</span>
                </>
              )}
            </button>
            
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm capitalize truncate">
              {visibleNavItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* WhatsApp Alerts & Lock Screen Setup Button */}
            <button
              type="button"
              onClick={() => setShowNotificationSettingsModal(true)}
              title="Configure WhatsApp & Lock Screen Notifications"
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">WhatsApp Alerts</span>
            </button>

            {/* Download / Install Mobile App Button (Hidden inside application) */}
            {!isNativeApp && (
              <button
                type="button"
                onClick={() => handleOpenInstallModal()}
                title="Install Golden Bloom Mobile App on iPhone or Android"
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[11px] sm:text-xs">
                  {clientDevice === 'iphone' ? '🍏 iPhone App' : clientDevice === 'android' ? '🤖 Android (.APK)' : '📱 Mobile App'}
                </span>
              </button>
            )}

            {/* Real-time Notification Bell & Mobile/PC Screen Alerts */}
            <NotificationBell 
              onOpenLead={handleOpenLeadById} 
              onOpenSettings={() => setShowNotificationSettingsModal(true)} 
            />

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => triggerRefresh(true)}
              disabled={isRefreshing}
              title="Refresh live data from MySQL database"
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-60 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-amber-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Auto-Refresh Timer / Indicator */}
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto (60s)</span>
            </span>

            {/* Database Engine Tag */}
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>MySQL: goldenbloom_crm</span>
            </span>

            {/* Inbound Status */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Ingestion</span>
            </span>
          </div>
        </header>

        {/* Main Content Render */}
        <main className="flex-1 p-3 sm:p-4 lg:p-5 max-w-[1600px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              currentUser={currentUser}
              onNavigateToLeads={handleNavigateToLeads}
              onNavigateToTab={(tab) => switchTab(tab)}
            />
          )}

          {(activeTab === 'leads' || activeTab === 'followups') && (
            <LeadsView
              key={activeTab}
              currentUser={currentUser}
              telecallers={telecallers}
              onOpenLogCall={(lead) => setActiveCallModalLead(lead)}
              initialFilter={activeTab === 'followups' ? { today_followups: true } : leadsFilter}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'activities' && (
            <CallHistoryView currentUser={currentUser} refreshTrigger={refreshTrigger} />
          )}

          {activeTab === 'telecallers' && (
            <TelecallersView currentUser={currentUser} onUsersUpdated={loadTelecallers} />
          )}

          {activeTab === 'import' && (
            <CsvImportView onImportComplete={() => { loadStats(); switchTab('leads'); }} />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsView />
          )}
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Golden Bloom (<a href="https://goldenbloom.ae" target="_blank" className="text-amber-800 font-semibold hover:underline">goldenbloom.ae</a>). Lead Management CRM &bull; MySQL Database.
        </footer>

      </div>

      {/* Call Logger Modal */}
      {activeCallModalLead && (
        <LogCallModal
          lead={activeCallModalLead}
          onClose={() => setActiveCallModalLead(null)}
          onSuccess={handleCallLogged}
          isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'super_admin'}
        />
      )}

      {/* Notification-triggered Lead Details Modal */}
      {targetNotificationLead && (
        <LeadDetailsModal
          lead={targetNotificationLead}
          onClose={() => setTargetNotificationLead(null)}
          onOpenLogCall={(lead) => {
            setTargetNotificationLead(null);
            setActiveCallModalLead(lead);
          }}
          isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'super_admin'}
          isSuperAdmin={currentUser?.role === 'super_admin'}
          telecallers={telecallers}
        />
      )}

      {/* Mobile App Install & APK Download Modal */}
      {showDownloadApkModal && (
        <DownloadApkModal 
          initialTab={installModalTab}
          onClose={() => setShowDownloadApkModal(false)} 
        />
      )}

      {/* Push & WhatsApp Notification Settings Modal */}
      {showNotificationSettingsModal && (
        <NotificationSettingsModal
          isOpen={showNotificationSettingsModal}
          onClose={() => setShowNotificationSettingsModal(false)}
          onOpenLead={handleOpenLeadById}
        />
      )}

      {/* iOS Safari Smart Add-to-Home-Screen Banner (Hidden inside application) */}
      {!isNativeApp && (
        <IosInstallBanner onOpenInstallModal={(tab) => handleOpenInstallModal(tab)} />
      )}

    </div>
  );
}
