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
  return { movies: [], supabaseConfig: { url: '', anonKey: '', enabled: false } };
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getLocalDb();
  const EMBEDDED_SUPABASE_URL = 'https://zuzvukxufrsawplsekgh.supabase.co';
  const EMBEDDED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1enZ1a3h1ZnJzYXdwbHNla2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NDk5NzAsImV4cCI6MjEwMzAyNTk3MH0.Re-9OHwvylRX8gfC42MDbKDmGbyfG72HSeuLBNKYFBA';

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || db.supabaseConfig?.url || EMBEDDED_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || db.supabaseConfig?.anonKey || EMBEDDED_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(200).json({
      success: true,
      message: `Tersinkron dengan Database Lokal (${(db.movies || []).length} film).`,
      totalMovies: (db.movies || []).length,
      data: db.movies || [],
    });
  }

  try {
    const supabase = createClient(url.trim(), anonKey.trim());
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (data && Array.isArray(data)) {
      db.movies = data;
      saveLocalDb(db);
      return res.status(200).json({
        success: true,
        message: `Berhasil sinkronisasi! ${data.length} film termuat dari Supabase.`,
        totalMovies: data.length,
        data,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Database Supabase kosong.',
      totalMovies: 0,
      data: [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Sync error' });
  }
}
