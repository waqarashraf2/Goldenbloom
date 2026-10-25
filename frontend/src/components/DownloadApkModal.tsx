'use client';

import React, { useState } from 'react';
import { 
  X, Smartphone, Download, BellRing, Zap, ShieldCheck, 
  CheckCircle2, ArrowRight, ExternalLink, QrCode
} from 'lucide-react';

interface DownloadApkModalProps {
  onClose: () => void;
}

export default function DownloadApkModal({ onClose }: DownloadApkModalProps) {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const apkDownloadUrl = '/downloads/goldenbloom-crm.apk';

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
        <div className="p-4 border-b border-slate-200 bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-2xs">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-white">Golden Bloom Mobile App</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-amber-900 shadow-2xs">
                  APK v1.0
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Direct Android Install &bull; Real-time Lock Screen Alerts
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

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Main Download Hero Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl shadow-xs">
              📲
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Install Golden Bloom CRM on Your Phone
              </h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                Receive instant WhatsApp-style notifications on your phone lock screen whenever a new lead arrives or is assigned.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-amber-800 hover:bg-amber-900 active:bg-black text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer text-sm"
            >
              <Download className="w-4 h-4" />
              <span>{downloadStarted ? 'Downloading Again...' : 'Download Android APK (Direct)'}</span>
            </button>

            {downloadStarted && (
              <p className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Download started! Check your phone downloads.</span>
              </p>
            )}
          </div>

          {/* Key Benefits */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Why Install Mobile App?
            </h5>

            <div className="grid grid-cols-1 gap-2">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 text-xs">WhatsApp-Style Screen Alerts</h6>
                  <p className="text-[11px] text-slate-500">
                    Works 100% even when phone screen is locked or app is completely closed.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 text-xs">1-Tap Direct Lead View</h6>
                  <p className="text-[11px] text-slate-500">
                    Tapping the notification opens the exact lead details modal instantly on your phone.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h6 className="font-bold text-slate-900 text-xs">Fast 1-Click Dialing &amp; WhatsApp</h6>
                  <p className="text-[11px] text-slate-500">
                    Call clients directly from mobile SIM or open WhatsApp with 1 tap.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Easy 3-Step Installation Guide */}
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2 text-xs">
            <h5 className="font-bold text-amber-950 flex items-center gap-1.5">
              <span>📋 Quick 3-Step Installation Guide:</span>
            </h5>

            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-amber-900">
              <li>
                Tap <strong>Download Android APK</strong> button above to download <code className="bg-amber-100 px-1 rounded font-mono">goldenbloom-crm.apk</code>.
              </li>
              <li>
                Open the downloaded file. If Android shows a prompt saying <em>"Install unknown apps"</em>, tap <strong>Settings &rarr; Allow from this source</strong>.
              </li>
              <li>
                Tap <strong>Install</strong>, then open Golden Bloom CRM and login with your email &amp; password. Allow notifications when prompted!
              </li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Compatible with all Android phones (Samsung, Xiaomi, Vivo, etc.)
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
