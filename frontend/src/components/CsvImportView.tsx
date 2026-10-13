'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Sparkles } from 'lucide-react';

export default function CsvImportView({ onImportComplete }: { onImportComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState('csv_import');
  const [campaign, setCampaign] = useState('Meta Ads Batch');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; duplicates_skipped: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);
    formData.append('campaign_name', campaign);

    try {
      const res = await apiRequest('/leads/import-csv', {
        method: 'POST',
        body: formData,
      });

      setResult(res);
      setFile(null);
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'CSV Import failed. Check file formatting.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Full Name,Phone Number,Email Address,Service Requested,Message\n" +
      "Noura Al Kaabi,+971502233445,noura@example.com,Luxury Birthday Bouquet,Needs pastel peonies and roses delivery to Dubai Marina\n" +
      "Khalid Mansoor,+971556677889,khalid@example.com,Corporate Floral Subscription,Weekly flower vase setup for reception";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "goldenbloom_sample_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-700" />
            Bulk CSV Lead Import
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Upload CSV lead exports from Meta Ads or Google Sheets. Duplicates are automatically skipped by phone number.
          </p>
        </div>

        <button
          onClick={downloadSampleCsv}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {result && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{result.message}</span>
          </div>
          <div className="text-[11px] text-emerald-700 flex flex-wrap gap-3">
            <span>✅ <strong>{result.imported}</strong> new leads imported successfully.</span>
            <span>⏭️ <strong>{result.duplicates_skipped}</strong> duplicates skipped.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <form onSubmit={handleUpload} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        
        {/* Dropzone */}
        <div className="border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-xl p-5 text-center bg-amber-50/20 transition cursor-pointer relative">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <span className="p-2 bg-amber-100 text-amber-900 rounded-full">
              <Upload className="w-4 h-4" />
            </span>
            <div className="text-xs font-bold text-slate-800">
              {file ? file.name : 'Click or Drag & Drop your CSV file here'}
            </div>
            <p className="text-[11px] text-slate-400">
              Supports standard Meta / Google Sheet CSV files (Name, Phone, Email, Service, etc.)
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Lead Source Tag</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            >
              <option value="facebook_ads">Meta / Facebook Ads Export</option>
              <option value="csv_import">General CSV Import</option>
              <option value="google_sheet">Offline Google Sheet Export</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Campaign / Batch Name</label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="e.g. FB_Luxury_Oct_Dubai"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={!file || loading}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Processing CSV...' : 'Start Safe Import'}
          </button>
        </div>

      </form>

    </div>
  );
}
