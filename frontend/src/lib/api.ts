const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'telecaller';
  phone?: string;
  is_active?: boolean;
  allowed_tabs?: string[];
  leads_count?: number;
  call_logs_count?: number;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  source: 'website' | 'facebook_ads' | 'google_sheet' | 'csv_import' | 'manual';
  status: 'new' | 'connected' | 'not_connected' | 'follow_up' | 'interested' | 'not_interested' | 'closed_won' | 'closed_lost';
  assigned_to?: number | null;
  assigned_user?: User | null;
  assigned_at?: string | null;
  service_requested?: string | null;
  campaign_name?: string | null;
  ad_name?: string | null;
  lead_notes?: string | null;
  last_call_status?: string | null;
  last_contacted_at?: string | null;
  next_follow_up_date?: string | null;
  call_attempts: number;
  call_logs?: CallLog[];
  custom_fields?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: number;
  lead_id: number;
  user_id: number;
  call_status: 'connected' | 'no_answer' | 'busy' | 'switched_off' | 'callback_requested';
  outcome?: string | null;
  notes: string;
  follow_up_date?: string | null;
  duration_seconds?: number | null;
  created_at: string;
  user?: User;
  lead?: Lead;
}

export interface DashboardStats {
  role: 'admin' | 'telecaller';
  stats: {
    total_leads?: number;
    website_leads?: number;
    facebook_leads?: number;
    google_sheet_leads?: number;
    csv_leads?: number;
    unassigned_leads?: number;
    today_followups: number;
    calls_today: number;
    total_calls: number;
    connected_calls: number;
    connection_rate: number;
    deals_won: number;
    total_assigned?: number;
    new_leads?: number;
  };
  telecaller_performance?: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    is_active: boolean;
    assigned_leads: number;
    total_calls: number;
    connected_calls: number;
    connection_rate: number;
    pending_followups: number;
    deals_won: number;
    busy_calls?: number;
    no_answer_calls?: number;
    switched_off_calls?: number;
    callback_calls?: number;
    recent_calls?: CallLog[];
  }>;
  recent_activities?: CallLog[];
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
