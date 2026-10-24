'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, CheckCheck, Trash2, Sparkles, UserCheck, RefreshCw, 
  ExternalLink, X, AlertCircle, ChevronRight, Check
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { 
  CrmNotificationItem, 
  requestNotificationPermission, 
  showSystemNotification,
  registerServiceWorker
} from '@/lib/notifications';

interface NotificationBellProps {
  onOpenLead: (leadId: number) => void;
}

export default function NotificationBell({ onOpenLead }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CrmNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSeenIdRef = useRef<number>(0);
  const initialFetchDoneRef = useRef<boolean>(false);

  // Check browser notification permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  // Fetch all recent notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ notifications: CrmNotificationItem[]; unread_count: number }>(
        '/notifications'
      );
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);

      if (data.notifications && data.notifications.length > 0) {
        lastSeenIdRef.current = Math.max(...data.notifications.map(n => n.id));
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  // Background Fast Polling (every 15 seconds) for instant alerts
  useEffect(() => {
    fetchNotifications().then(() => {
      initialFetchDoneRef.current = true;
    });

    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        // Still poll even in background tab so mobile/desktop system notifications trigger!
      }

      try {
        const sinceId = lastSeenIdRef.current;
        const res = await apiRequest<{ new_notifications: CrmNotificationItem[]; unread_count: number }>(
          `/notifications/unread?since_id=${sinceId}`
        );

        setUnreadCount(res.unread_count || 0);

        if (res.new_notifications && res.new_notifications.length > 0) {
          // New notifications arrived!
          const newest = res.new_notifications;
          lastSeenIdRef.current = Math.max(...newest.map(n => n.id), lastSeenIdRef.current);

          // Update in-memory list
          setNotifications(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const fresh = newest.filter(n => !existingIds.has(n.id));
            return [...fresh, ...prev].slice(0, 30);
          });

          // Trigger Native Mobile/Desktop System Notification for each new item!
          if (initialFetchDoneRef.current) {
            newest.forEach(notif => {
              showSystemNotification(notif, onOpenLead);
            });
          }
        }
      } catch {
        // Background polling silent fail
      }
    }, 15000); // 15 seconds fast check

    return () => clearInterval(interval);
  }, []);

  // Close flyout on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    if (granted) {
      // Show confirmation test alert
      showSystemNotification({
        title: 'Notifications Activated! 🔔',
        message: 'You will now receive instant alerts on this device whenever new leads arrive or are assigned to you.',
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/mark-read', { method: 'POST' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleNotificationClick = async (notif: CrmNotificationItem) => {
    if (!notif.is_read) {
      try {
        await apiRequest('/notifications/mark-read', {
          method: 'POST',
          body: JSON.stringify({ id: notif.id }),
        });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }

    setIsOpen(false);

    if (notif.lead_id) {
      onOpenLead(notif.lead_id);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notification history?')) return;
    try {
      await apiRequest('/notifications/clear', { method: 'POST' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        title="Notifications (System & Mobile Alerts)"
        className={`relative p-2 rounded-xl border transition cursor-pointer ${
          isOpen
            ? 'bg-amber-100/70 border-amber-300 text-amber-900 shadow-inner'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
        }`}
      >
        <Bell className="w-4 h-4" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black animate-pulse shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-1.5 hover:bg-white text-slate-500 hover:text-emerald-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Clear all notifications"
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile & PC Native Push Permission Prompt Banner */}
          {permissionStatus !== 'granted' && (
            <div className="p-2.5 bg-linear-to-r from-amber-50 to-emerald-50 border-b border-amber-200 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-base">🔔</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-[11px]">
                    Get Mobile &amp; PC Screen Alerts
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                    Receive instant notifications on your mobile screen &amp; desktop just like WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    className="mt-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-2xs transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Turn On Screen Alerts</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-base">
                  ✨
                </div>
                <p className="font-bold text-slate-700 text-xs">All Caught Up!</p>
                <p className="text-[11px] text-slate-400">
                  New leads and assignment alerts will appear here in real-time.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isNewLead = notif.type === 'new_lead' || notif.type === 'repeat_inquiry';
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 transition cursor-pointer flex items-start gap-2.5 hover:bg-amber-50/50 ${
                      !notif.is_read ? 'bg-amber-50/20' : 'bg-white'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isNewLead 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {isNewLead ? '🌿' : '👤'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-[11px] truncate ${!notif.is_read ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 shrink-0 font-medium">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {notif.message}
                      </p>

                      {notif.lead_id && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:underline">
                          <span>View Lead #{notif.lead_id}</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <span className="text-[10px] text-slate-400">
              ⚡ Real-time alerts synced with WhatsApp &amp; System Notifications
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
