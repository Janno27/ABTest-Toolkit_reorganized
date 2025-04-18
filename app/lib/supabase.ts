import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Créer et exporter le client Supabase
let supabaseClient: SupabaseClient | null = null;

// Fonction pour initialiser le client Supabase
export function initSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Les variables d\'environnement Supabase sont manquantes');
  }

  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) as SupabaseClient;
}

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client non initialisé. Appelez initSupabase() en premier.');
  }
  return supabaseClient;
}