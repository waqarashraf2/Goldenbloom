'use client';

import { apiRequest } from './api';

export interface CrmNotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'new_lead' | 'lead_assigned' | 'repeat_inquiry' | 'general';
  lead_id?: number | null;
  data?: Record<string, any> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

/**
 * Synthesizes a crisp, pleasant messaging chime via Web Audio API
 * (Guaranteed to work without needing an external audio file).
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First Tone: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second Tone: A5 (880 Hz) - pleasant chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.10);
    gain2.gain.setValueAtTime(0.25, now + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.10);
    osc2.stop(now + 0.40);
  } catch (err) {
    // Audio context may be restricted by browser until first user interaction
  }
}

/**
 * Register Service Worker for Mobile & Desktop Native Push Notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return registration;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Request OS / Browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Permission request failed:', err);
    return false;
  }
}

/**
 * Fire native Mobile Slide Bar & Lock Screen System Notification
 */
export async function showSystemNotification(
  notification: { title: string; message: string; lead_id?: number | null },
  onLeadClick?: (leadId: number) => void
): Promise<void> {
  // Always play audio chime
  playNotificationSound();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const title = notification.title || 'Golden Bloom CRM 🌿';
  const options: any = {
    body: notification.message,
    icon: '/icon-192.png',
    badge: '/icon-32.png',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true, // Crucial for persistent slide bar & lock screen display
    renotify: true,           // Ensures sound & vibration fire even if existing notification is present
    silent: false,
    data: {
      lead_id: notification.lead_id,
      url: notification.lead_id ? `/?lead_id=${notification.lead_id}` : '/',
    },
    tag: notification.lead_id ? `gb-lead-${notification.lead_id}` : `gb-notif-${Date.now()}`,
    actions: [
      { action: 'open_lead', title: '👁️ Open Lead' }
    ],
  };

  try {
    // Try Service Worker showNotification first (Required for Mobile Android & iOS PWA & Lock Screen)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return;
      }
    }

    // Fallback: standard Window Notification
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
      if (notification.lead_id) {
        if (onLeadClick) {
          onLeadClick(notification.lead_id);
        } else {
          window.location.href = `/?lead_id=${notification.lead_id}`;
        }
      }
    };
  } catch (err) {
    console.warn('System notification display error:', err);
  }
}

/**
 * Trigger an instant test notification for lock screen and slide bar verification
 */
export async function triggerTestLockScreenNotification(onLeadClick?: (leadId: number) => void): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await showSystemNotification(
    {
      title: '🌿 Golden Bloom Alert Test',
      message: 'Slide bar and lock screen notification is active! Tap here to test lead deep-linking.',
      lead_id: 1,
    },
    onLeadClick
  );
  return true;
}
