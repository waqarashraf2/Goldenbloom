'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Download, BellRing, Zap, CheckCircle2, 
  Share, PlusSquare, ExternalLink, ArrowRight, Sparkles, AlertCircle
} from 'lucide-react';

interface DownloadApkModalProps {
  onClose: () => void;
  initialTab?: 'android' | 'iphone';
}

export default function DownloadApkModal({ onClose, initialTab }: DownloadApkModalProps) {
  const [deviceTab, setDeviceTab] = useState<'android' | 'iphone'>(initialTab || 'android');
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const apkDownloadUrl = '/downloads/goldenbloom-crm.apk';

  // Automatically detect device if initialTab was not explicitly provided
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (!initialTab && isIOS) {
        setDeviceTab('iphone');
      }
      if (typeof navigator.share === 'function') {
        setCanShare(true);
      }
    }
  }, [initialTab]);

  const handleDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.download = 'goldenbloom-crm.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleIosShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Golden Bloom CRM',
          text: 'Golden Bloom Leads & Telecaller Management CRM',
          url: window.location.href,
        });
        setShareSuccess(true);
      }
    } catch {
      // User cancelled share dialog or error, ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-linear-to-r from-amber-600 via-amber-700 to-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-xs">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Golden Bloom Mobile App</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-950 shadow-2xs">
                  Official
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Install on iPhone (iOS) &amp; Android &bull; Real-time Alerts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2.5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDeviceTab('iphone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
              deviceTab === 'iphone'
                ? 'bg-white text-emerald-900 border-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <span className="text-sm">🍏</span>
            <span>Apple iPhone (iOS)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setDeviceTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
              deviceTab === 'android'
                ? 'bg-white text-amber-900 border-amber-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <span className="text-sm">🤖</span>
            <span>Android Mobile (.APK)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">

          {/* TAB 1: APPLE IPHONE (iOS) */}
          {deviceTab === 'iphone' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* iOS Explanation Alert */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <span className="text-base">🍏</span>
                  <span>iPhone par App Kaise Install Hogi?</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Apple iPhone par koi <strong>.APK</strong> file download karne ki zaroorat nahi hoti. Apple Safari ka official feature hai: <strong>&ldquo;Add to Home Screen&rdquo;</strong>. Is se Golden Bloom CRM direct aapke iPhone ki screen par official app ki tarah save ho jati hai aur lock screen notifications support karti hai!
                </p>
              </div>

              {/* iPhone Step-by-Step Visual Cards */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>3 Asaan Steps (Only 5 Seconds):</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-2 py-0.5 rounded-full">
                    No App Store Needed
                  </span>
                </h4>

                {/* Step 1 */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-2xs hover:border-emerald-300 transition">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    1
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900">Safari ka Share Button dabayein</p>
                      <Share className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Safari browser ke sab se neeche bar mein <strong>Share</strong> icon (square jis me upar ka teer 📤 hai) par tap karein.
                    </p>
                    {canShare && (
                      <button
                        type="button"
                        onClick={handleIosShare}
                        className="mt-1.5 py-1.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Share className="w-3.5 h-3.5 text-sky-700" />
                        <span>Abhi Safari Share Menu Kholein</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-2xs hover:border-emerald-300 transition">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    2
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900">&ldquo;Add to Home Screen&rdquo; select karein</p>
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Share sheet khulne par thora niche scroll karein aur <strong>&ldquo;Add to Home Screen&rdquo;</strong> (➕) par tap karein.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-2xs hover:border-emerald-300 transition">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    3
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-slate-900">Top-right par &ldquo;Add&rdquo; dabayein</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Upar right side par <strong>Add</strong> button hoga, use tap kar dein. Bas, Golden Bloom ka official icon aapki iPhone screen par lag jayega!
                    </p>
                  </div>
                </div>
              </div>

              {/* iPhone Home Screen Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 shadow-md shrink-0 flex items-center justify-center">
                  <img 
                    src="/apple-touch-icon.png" 
                    alt="Golden Bloom Icon" 
                    className="w-10 h-10 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">Aapki iPhone Screen Par Result:</p>
                  <p className="text-[11px] text-slate-500">
                    &ldquo;Golden Bloom&rdquo; app open karein, login karein aur notifications allow karein. Slide-bar aur Lock Screen notifications WhatsApp ki tarah aayengi!
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ANDROID MOBILE (.APK) */}
          {deviceTab === 'android' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white p-1.5 border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
                  <img 
                    src="/goldenbloom-logo.png" 
                    alt="Golden Bloom Logo" 
                    className="w-11 h-11 object-contain"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Download Android Mobile App (.APK)
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5 leading-relaxed">
                    Golden Bloom official Android package with custom launcher icon, sound &amp; vibration alerts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3 px-4 bg-amber-800 hover:bg-amber-900 active:scale-98 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadStarted ? 'Downloading File Again...' : 'Download Android APK (Direct)'}</span>
                </button>

                {downloadStarted && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Download shuru ho gaya! Phone ke &ldquo;Downloads&rdquo; folder se install karein.</span>
                  </p>
                )}
              </div>

              {/* Android Steps */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2 text-xs">
                <h5 className="font-bold text-amber-950 flex items-center gap-1.5">
                  <span>📋 Android Installation Guide:</span>
                </h5>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900 leading-relaxed">
                  <li>Download complete hone ke baad file par tap karein.</li>
                  <li>Agar security prompt aaye to <strong>&ldquo;Settings &rarr; Allow from this source&rdquo;</strong> ko ON karein.</li>
                  <li><strong>Install</strong> par tap karein, app open karein aur notifications permission allow karein!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Key Shared Mobile Features */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Mobile App Features (iPhone &amp; Android):
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 text-xs">Lock Screen Sound Alerts</h6>
                  <p className="text-[10px] text-slate-500">
                    Naye lead aane par instant chime aur vibration alert.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 text-xs">1-Tap Direct Lead View</h6>
                  <p className="text-[10px] text-slate-500">
                    Notification tap karte hi exact lead ka popup khul jayega.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Golden Bloom CRM &bull; iOS &amp; Android Edition
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
