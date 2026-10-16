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
import { 
  LayoutDashboard, Users, Clock, PhoneCall, FileSpreadsheet, 
  LogOut, Shield, Menu, X, Key, TableProperties, Database,
  PanelLeftClose, PanelLeftOpen, RotateCw
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
      if (urlTab && VALID_TABS.includes(urlTab)) {
        setActiveTab(urlTab);
        if (urlTab === 'followups') {
          setLeadsFilter({ today_followups: true });
        }
      } else if (user && user.role !== 'admin') {
        setActiveTab('leads');
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
      if (currentUser.role === 'admin') {
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
        currentUser?.role === 'admin' ? loadTelecallers() : Promise.resolve(),
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
        : (data.user.role === 'admin' ? 'dashboard' : 'leads');
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

  const handleQuickSwitch = (email: string) => {
    handleLogin(email, 'password123');
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
      label: currentUser?.role === 'admin' ? 'All Leads' : 'My Leads', 
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
    if (currentUser.role === 'admin') return true;
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

          {/* Quick Demo Switcher */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2 text-xs">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-700" />
              1-Click Demo Accounts:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin@goldenbloom.ae')}
                className="w-full p-2 bg-white hover:bg-amber-100/60 border border-amber-300 rounded-lg font-medium text-slate-800 flex items-center justify-between transition text-left"
              >
                <span>👑 <strong>Admin</strong> (Full Access)</span>
                <span className="text-[11px] text-amber-700 font-semibold">Sign In &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('sarah@goldenbloom.ae')}
                className="w-full p-2 bg-white hover:bg-amber-100/60 border border-amber-300 rounded-lg font-medium text-slate-800 flex items-center justify-between transition text-left"
              >
                <span>📞 <strong>Sarah Khan</strong> (Telecaller)</span>
                <span className="text-[11px] text-amber-700 font-semibold">Sign In &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('ali@goldenbloom.ae')}
                className="w-full p-2 bg-white hover:bg-amber-100/60 border border-amber-300 rounded-lg font-medium text-slate-800 flex items-center justify-between transition text-left"
              >
                <span>📞 <strong>Ali Raza</strong> (Telecaller)</span>
                <span className="text-[11px] text-amber-700 font-semibold">Sign In &rarr;</span>
              </button>
            </div>
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
                placeholder="admin@goldenbloom.ae"
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

        {/* Sidebar Footer: User Card & Role Switcher */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 space-y-2">
          
          {/* Quick Perspective Switcher */}
          <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-[10px]">
            <span className="font-semibold text-slate-500 block mb-1">Switch View:</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleQuickSwitch('admin@goldenbloom.ae')}
                className={`py-0.5 text-center rounded font-bold text-[10px] transition ${
                  currentUser.role === 'admin' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => handleQuickSwitch('sarah@goldenbloom.ae')}
                className={`py-0.5 text-center rounded font-bold text-[10px] transition ${
                  currentUser.email === 'sarah@goldenbloom.ae' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sarah
              </button>
              <button
                onClick={() => handleQuickSwitch('ali@goldenbloom.ae')}
                className={`py-0.5 text-center rounded font-bold text-[10px] transition ${
                  currentUser.email === 'ali@goldenbloom.ae' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ali
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-800 text-[11px] truncate">{currentUser.name}</div>
                <div className="text-[9px] text-slate-400 uppercase font-semibold">{currentUser.role}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
            >
              <LogOut className="w-3.5 h-3.5" />
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
            <TelecallersView onUsersUpdated={loadTelecallers} />
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
        />
      )}

    </div>
  );
}
