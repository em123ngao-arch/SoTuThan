// supabaseClient.js - Dynamically bridges LocalStorage and Supabase DB
// If Supabase credentials are not saved in settings, it falls back to LocalStorage.

import { createClient } from '@supabase/supabase-js';

// Load credentials from LocalStorage
const getSupaConfig = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('snt_settings') || '{}');
    if (settings.supabaseUrl && settings.supabaseKey) {
      return {
        url: settings.supabaseUrl,
        key: settings.supabaseKey
      };
    }
  } catch (e) {
    console.error('Error reading Supabase config from LocalStorage', e);
  }
  return null;
};

let supabaseInstance = null;

export const getSupabaseClient = () => {
  const config = getSupaConfig();
  if (!config) return null;
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.key);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
};

// Database Adapter Interface
export const db = {
  // Get all faults
  async getFaults() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('snt_faults')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.error('Supabase query failed, falling back to local:', e);
      }
    }
    // LocalStorage Fallback
    const localData = localStorage.getItem('snt_faults') || '[]';
    return JSON.parse(localData);
  },

  // Save/Update a single fault
  async saveFault(fault) {
    const client = getSupabaseClient();
    if (client) {
      try {
        // Try upserting
        const { data, error } = await client
          .from('snt_faults')
          .upsert(fault)
          .select();
        if (error) throw error;
        return data[0];
      } catch (e) {
        console.error('Supabase save failed, falling back to local:', e);
      }
    }

    // LocalStorage Fallback
    const faults = await this.getFaults();
    const idx = faults.findIndex(f => f.id === fault.id);
    if (idx >= 0) {
      faults[idx] = { ...faults[idx], ...fault };
    } else {
      faults.unshift(fault);
    }
    localStorage.setItem('snt_faults', JSON.stringify(faults));
    return fault;
  },

  // Delete a fault
  async deleteFault(id) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from('snt_faults')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (e) {
        console.error('Supabase delete failed, falling back to local:', e);
      }
    }

    // LocalStorage Fallback
    const faults = await this.getFaults();
    const filtered = faults.filter(f => f.id !== id);
    localStorage.setItem('snt_faults', JSON.stringify(filtered));
    return true;
  },

  // Reset all faults
  async resetFaults() {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from('snt_faults')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
        if (error) throw error;
        return true;
      } catch (e) {
        console.error('Supabase reset failed, falling back to local:', e);
      }
    }

    // LocalStorage Fallback
    localStorage.setItem('snt_faults', JSON.stringify([]));
    return true;
  },

  // Get current settings (budget, pin, etc.)
  getSettings() {
    const defaultSettings = {
      monthlyBudget: 2000000, // 2 million VND default
      supabaseUrl: '',
      supabaseKey: '',
      nganPin: '1111',       // Default PIN for Ngân (Admin)
      baoPin: '0000',        // Default PIN for Bảo (User)
    };
    try {
      const localSettings = localStorage.getItem('snt_settings');
      return localSettings ? { ...defaultSettings, ...JSON.parse(localSettings) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  },

  // Save settings
  saveSettings(settings) {
    localStorage.setItem('snt_settings', JSON.stringify(settings));
    // Clear Supabase cache to force re-initialization with new credentials
    supabaseInstance = null;
    return settings;
  }
};

// SQL Schema script template for users to copy into Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- CÂU LỆNH SQL KHỞI TẠO BẢNG TRÊN SUPABASE SQL EDITOR
-- Tạo bảng snt_faults để lưu danh sách tội danh
CREATE TABLE IF NOT EXISTS public.snt_faults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    evidence TEXT, -- Chứa chuỗi ảnh Base64
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pending'::text NOT NULL, -- pending, deducted, appealed, forgiven, rejected
    appeal_reason TEXT,
    appeal_at TIMESTAMP WITH TIME ZONE,
    admin_note TEXT
);

-- Cho phép truy cập nặc danh (nếu dùng key anon của Supabase)
-- Bật RLS (Row Level Security) nhưng cho phép mọi quyền để đơn giản cho dự án cá nhân
ALTER TABLE public.snt_faults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép mọi người đọc ghi dữ liệu" ON public.snt_faults
    FOR ALL USING (true) WITH CHECK (true);
`;
