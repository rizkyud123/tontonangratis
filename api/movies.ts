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
  return { movies: [], supabaseConfig: { url: '', anonKey: '', enabled: false }, adConfig: {}, apiConfig: {} };
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getLocalDb();
  const supabase = getSupabaseClient(db);

  try {
    // GET /api/movies
    if (req.method === 'GET') {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

          if (!error && data && Array.isArray(data) && data.length > 0) {
            db.movies = data;
            saveLocalDb(db);
            return res.status(200).json({ success: true, total: data.length, data });
          }
        } catch {
          // fallback to db.movies
        }
      }

      return res.status(200).json({
        success: true,
        total: (db.movies || []).length,
        data: db.movies || [],
      });
    }

    // POST /api/movies (Single or Bulk)
    if (req.method === 'POST') {
      const body = req.body || {};

      // Check if Bulk Save
      if (Array.isArray(body.movies)) {
        const newMovies = body.movies;
        if (supabase && newMovies.length > 0) {
          try {
            await supabase.from('movies').upsert(newMovies, { onConflict: 'slug' });
          } catch {
            // ignore
          }
        }

        const existingSlugs = new Set((db.movies || []).map((m: any) => m.slug));
        const toAdd = newMovies.filter((m: any) => !existingSlugs.has(m.slug));
        db.movies = [...toAdd, ...(db.movies || [])];
        saveLocalDb(db);

        return res.status(200).json({ success: true, count: toAdd.length, data: db.movies });
      }

      // Single Movie Save
      const movie = body;
      if (!movie.title || !movie.thumbnail) {
        return res.status(400).json({ success: false, error: 'Judul dan thumbnail wajib diisi' });
      }

      if (supabase) {
        try {
          await supabase.from('movies').upsert(movie, { onConflict: 'slug' });
        } catch {
          // ignore
        }
      }

      const list = db.movies || [];
      const idx = list.findIndex((m: any) => m.id === movie.id || m.slug === movie.slug);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...movie };
      } else {
        list.unshift(movie);
      }
      db.movies = list;
      saveLocalDb(db);

      return res.status(200).json({ success: true, data: movie, total: db.movies.length });
    }

    // DELETE /api/movies
    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (id) {
        if (supabase) {
          try {
            await supabase.from('movies').delete().eq('id', id);
          } catch {
            // ignore
          }
        }
        db.movies = (db.movies || []).filter((m: any) => m.id !== id);
        saveLocalDb(db);
      }
      return res.status(200).json({ success: true, total: (db.movies || []).length });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
}
