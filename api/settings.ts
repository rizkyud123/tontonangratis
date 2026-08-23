import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

function getLocalDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch {
    // fallback
  }
  return {
    movies: [],
    supabaseConfig: { url: '', anonKey: '', enabled: false },
    adConfig: {
      directLinkUrl: '',
      banner468x60: '',
      banner728x90: '',
      banner300x250: '',
      popunderUrl: '',
    },
    apiConfig: {
      tmdbApiKey: '',
      tmdbLanguage: 'id-ID',
      defaultProvider: 'vidsrc_xyz',
      customEmbedTemplate: 'https://vidsrc.xyz/embed/movie/{tmdb_id}',
      autoMultiServers: true,
      enabledProviders: ['vidsrc_xyz', 'vidsrc_to', 'superembed', 'embed_su', 'autoembed', 'vidlink', 'moviesapi', 'smashystream', '2embed'],
    },
  };
}

function saveLocalDb(db: any) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

const EMBEDDED_SUPABASE_URL = 'https://zuzvukxufrsawplsekgh.supabase.co';
const EMBEDDED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enZ1a3h1ZnJzYXdwbHNla2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDk5NzAsImV4cCI6MjEwMzAyNTk3MH0.Re-9OHwvylRX8gfC42MDbKDmGbyfG72HSeuLBNKYFBA';

function getSupabaseClient(db: any) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || db.supabaseConfig?.url || EMBEDDED_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || db.supabaseConfig?.anonKey || EMBEDDED_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    try {
      return createClient(url.trim(), anonKey.trim());
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getLocalDb();
  const supabase = getSupabaseClient(db);

  try {
    // GET /api/settings
    if (req.method === 'GET') {
      let sbConfig = db.supabaseConfig || { url: '', anonKey: '', enabled: false };
      let apiConfig = db.apiConfig || {};
      let adConfig = db.adConfig || {};

      if (supabase) {
        try {
          const { data } = await supabase.from('app_settings').select('*');
          if (data && Array.isArray(data)) {
            for (const row of data) {
              if (row.key === 'api_config' && row.value) apiConfig = { ...apiConfig, ...row.value };
              if (row.key === 'ad_config' && row.value) adConfig = { ...adConfig, ...row.value };
            }
          }
        } catch {
          // ignore
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          supabaseConfig: sbConfig,
          apiConfig,
          adConfig,
        },
      });
    }

    // POST /api/settings
    if (req.method === 'POST') {
      const { supabaseConfig, apiConfig, adConfig } = req.body || {};

      if (supabaseConfig) {
        db.supabaseConfig = { ...(db.supabaseConfig || {}), ...supabaseConfig };
      }
      if (apiConfig) {
        db.apiConfig = { ...(db.apiConfig || {}), ...apiConfig };
      }
      if (adConfig) {
        db.adConfig = { ...(db.adConfig || {}), ...adConfig };
      }

      saveLocalDb(db);

      // Also upsert to Supabase if connected
      const client = getSupabaseClient(db);
      if (client) {
        try {
          if (apiConfig) {
            await client.from('app_settings').upsert({
              key: 'api_config',
              value: db.apiConfig,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });
          }
          if (adConfig) {
            await client.from('app_settings').upsert({
              key: 'ad_config',
              value: db.adConfig,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });
          }
        } catch {
          // ignore
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Pengaturan berhasil disimpan',
        data: {
          supabaseConfig: db.supabaseConfig,
          apiConfig: db.apiConfig,
          adConfig: db.adConfig,
        },
      });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
}
