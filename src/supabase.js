// src/supabase.js
import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL dan ANON_KEY proyek Supabase Anda
// Anda bisa menemukannya di Dashboard Supabase Anda: Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // Pastikan ini diatur di .env Anda
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Pastikan ini diatur di .env Anda


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
