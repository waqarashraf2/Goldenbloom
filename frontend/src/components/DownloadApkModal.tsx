'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Download, BellRing, Zap, ShieldCheck, 
  CheckCircle2, ArrowRight, ExternalLink, QrCode, AlertTriangle, Share
} from 'lucide-react';

interface DownloadApkModalProps {
  onClose: () => void;
}

export default function DownloadApkModal({ onClose }: DownloadApkModalProps) {
  const [deviceTab, setDeviceTab] = useState<'android' | 'iphone'>('android');
  const [downloadStarted, setDownloadStarted] = useState(false);
  const apkDownloadUrl = '/downloads/goldenbloom-crm.apk';

  // Detect iOS / iPhone automatically on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        setDeviceTab('iphone');
      }
    }
  }, []);

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.download = 'goldenbloom-crm.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-2xs">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-white">Golden Bloom Mobile App</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-amber-900 shadow-2xs">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Install on Android &amp; iPhone &bull; Lock Screen Alerts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2.5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDeviceTab('android')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
              deviceTab === 'android'
                ? 'bg-white text-amber-800 border-amber-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <span>🤖 Android (.APK)</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceTab('iphone')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
              deviceTab === 'iphone'
                ? 'bg-white text-amber-800 border-amber-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <span>🍏 Apple iPhone (iOS)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">

          {/* TAB 1: ANDROID APK */}
          {deviceTab === 'android' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl shadow-xs">
                  🤖
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Download Android Mobile App (.APK)
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5 leading-relaxed">
                    Installs natively on all Android devices (Samsung, Xiaomi, Oppo, Vivo, Google Pixel).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3 px-4 bg-amber-800 hover:bg-amber-900 active:scale-98 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadStarted ? 'Downloading Again...' : 'Download Android APK (Direct)'}</span>
                </button>

                {downloadStarted && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Download started! Check your phone downloads folder.</span>
                  </p>
                )}
              </div>

              {/* Android Instructions */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2 text-xs">
                <h5 className="font-bold text-amber-950 flex items-center gap-1.5">
                  <span>📋 Android Installation Guide:</span>
                </h5>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                  <li>Tap <strong>Download Android APK</strong> button above to download the file.</li>
                  <li>Open the downloaded file. When prompted, tap <strong>Settings &rarr; Allow from this source</strong>.</li>
                  <li>Tap <strong>Install</strong>, then open Golden Bloom CRM and login. Allow notifications when prompted!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: APPLE IPHONE (iOS) */}
          {deviceTab === 'iphone' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Important iOS Notice */}
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">ℹ️</span>
                <div className="space-y-1">
                  <p className="font-bold">Apple iPhone Does Not Use .APK Files</p>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    Apple iOS blocks .apk files. On iPhone, you do <strong>NOT</strong> need to download any file! You install Golden Bloom directly in 5 seconds via Safari.
                  </p>
                </div>
              </div>

              {/* iPhone 3-Step Guide */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span className="text-base">🍏</span>
                  <span>How to Install on iPhone (in 5 Seconds):</span>
                </h4>

                <div className="space-y-3 text-[11px] text-slate-700">
                  <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">1</span>
                    <div>
                      <p className="font-bold text-slate-900">Open Safari on your iPhone</p>
                      <p className="text-slate-500">Go to <code className="text-amber-800 bg-amber-50 px-1 rounded">crm.goldenbloom.ae</code></p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">2</span>
                    <div>
                      <p className="font-bold text-slate-900">Tap the Share Button</p>
                      <p className="text-slate-500">At the bottom of Safari, tap the Share icon (square with arrow up 📤).</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">3</span>
                    <div>
                      <p className="font-bold text-slate-900">Tap &ldquo;Add to Home Screen&rdquo;</p>
                      <p className="text-slate-500">Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>, then tap <strong>Add</strong>.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Done! Golden Bloom CRM will be installed on your iPhone screen with full lock screen alerts!</span>
                </div>
              </div>
            </div>
          )}

          {/* Key Benefits */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Features on Mobile:
            </h5>

            <div className="grid grid-cols-1 gap-2">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 text-xs">Lock Screen &amp; Slide Bar Notifications</h6>
                  <p className="text-[11px] text-slate-500">
                    Instant chime sound and banner when a lead arrives or is assigned.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 text-xs">1-Tap Direct Lead Modal</h6>
                  <p className="text-[11px] text-slate-500">
                    Tapping the notification opens the exact client details instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Golden Bloom CRM Mobile &bull; iOS &amp; Android
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
