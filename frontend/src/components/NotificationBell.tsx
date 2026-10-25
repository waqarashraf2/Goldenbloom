'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, CheckCheck, Trash2, Sparkles, UserCheck, RefreshCw, 
  ExternalLink, X, AlertCircle, ChevronRight, Check, Settings
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
  onOpenSettings?: () => void;
}

export default function NotificationBell({ onOpenLead, onOpenSettings }: NotificationBellProps) {
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

  // Close flyout on click outside (for desktop)
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
      } catch (err) {
        console.error('Failed to mark notification read', err);
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
        <>
          {/* Mobile Screen Dimming Backdrop (Dismiss on tap outside) */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          {/* Flyout Panel (Full-Width Pinned on Mobile, Dropdown on Desktop) */}
          <div className="fixed inset-x-3 top-14 sm:inset-x-auto sm:top-full sm:right-0 sm:absolute sm:mt-2 w-auto sm:w-96 max-h-[84vh] sm:max-h-[34rem] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 sm:zoom-in-100 sm:slide-in-from-top-2 duration-150">
            
            {/* Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenSettings();
                    }}
                    title="WhatsApp & Lock Screen Settings"
                    className="p-1.5 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-emerald-700" />
                  </button>
                )}

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="p-1.5 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
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
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile & PC Native Push Permission Prompt Banner */}
            {permissionStatus !== 'granted' && (
              <div className="p-3 bg-linear-to-r from-amber-50 to-emerald-50 border-b border-amber-200 text-xs shrink-0">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0 mt-0.5">🔔</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-xs">Turn on Screen Notifications</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Receive slide bar &amp; lock screen alerts even when your phone is locked.
                    </p>
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      className="mt-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                    >
                      <span>Allow Screen Alerts</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List of Notifications */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
              {loading && notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    You will be alerted when new leads arrive or are assigned to you.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isNew = notif.type === 'new_lead';
                  const isAssigned = notif.type === 'lead_assigned';
                  const isRepeat = notif.type === 'repeat_inquiry';

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 transition cursor-pointer flex items-start gap-3 hover:bg-slate-50 active:bg-slate-100 ${
                        !notif.is_read ? 'bg-amber-50/50' : 'bg-white'
                      }`}
                    >
                      {/* Icon Badge */}
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm mt-0.5 ${
                          isNew
                            ? 'bg-emerald-100 text-emerald-800'
                            : isAssigned
                            ? 'bg-blue-100 text-blue-800'
                            : isRepeat
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isNew ? '🌿' : isAssigned ? '🎯' : isRepeat ? '🔄' : '🔔'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`text-xs sm:text-sm truncate ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed break-words">
                          {notif.message}
                        </p>

                        {notif.lead_id && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900">
                            <span>View Lead #{notif.lead_id}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Unread indicator */}
                      {!notif.is_read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0 mt-1.5 ring-2 ring-white" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with settings link */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-[11px] text-slate-500 font-medium truncate">
                Lock screen alerts ready
              </span>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings();
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer shrink-0 text-xs"
                >
                  <span>💬 WhatsApp &amp; Push Setup</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
