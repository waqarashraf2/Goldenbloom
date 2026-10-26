'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, X, ArrowRight, Share } from 'lucide-react';

interface IosInstallBannerProps {
  onOpenInstallModal: (tab: 'iphone' | 'android') => void;
}

export default function IosInstallBanner({ onOpenInstallModal }: IosInstallBannerProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    // Detect if device is iOS (iPhone/iPad/iPod)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Detect if already running as installed standalone PWA
    const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Check if dismissed within the last 24 hours
    const dismissedAt = localStorage.getItem('gb_ios_banner_dismissed');
    const isRecentDismissal = dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < (24 * 60 * 60 * 1000);

    if (isIOS && !isStandalone && !isRecentDismissal) {
      setShowBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem('gb_ios_banner_dismissed', Date.now().toString());
    } catch {
      // ignore storage error
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md z-40 animate-in slide-in-from-bottom duration-300">
      <div className="p-3.5 bg-linear-to-r from-emerald-900 via-emerald-800 to-amber-900 text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 shadow-sm flex items-center justify-center">
            <img 
              src="/apple-touch-icon.png" 
              alt="Golden Bloom" 
              className="w-8 h-8 object-contain rounded-md"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold truncate">Install Golden Bloom on iPhone</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 leading-tight">
              Get full screen app &amp; lock screen alerts!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenInstallModal('iphone')}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
          >
            <span>Install</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
