import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Créer et exporter le client Supabase
let supabaseClient: SupabaseClient | null = null;

// Fonction pour initialiser le client Supabase
export function initSupabase() {
  if (env.NEXT_PUBLIC_USE_SUPABASE === 'true' && env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      supabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('Client Supabase initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du client Supabase:', error);
      // Initialiser avec un client vide en cas d'erreur
      supabaseClient = createClient('https://example.com', 'fallback-key');
      console.warn('Client Supabase initialisé avec des valeurs par défaut');
    }
  } else {
    console.warn('Supabase n\'est pas activé ou les variables d\'environnement sont manquantes');
    console.warn('NEXT_PUBLIC_USE_SUPABASE:', env.NEXT_PUBLIC_USE_SUPABASE);
    console.warn('NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL ? '[DÉFINI]' : '[MANQUANT]');
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[DÉFINI]' : '[MANQUANT]');
    // Initialiser avec un client vide pour éviter les valeurs null
    supabaseClient = createClient('https://example.com', 'fallback-key');
    console.warn('Client Supabase initialisé avec des valeurs par défaut');
  }
  
  return supabaseClient;
}

// Initialiser le client au chargement du module
export const supabase = initSupabase();

// Fonction pour vérifier si Supabase est disponible
export function isSupabaseAvailable() {
  return supabaseClient !== null && 
         env.NEXT_PUBLIC_USE_SUPABASE === 'true' && 
         env.NEXT_PUBLIC_SUPABASE_URL !== undefined && 
         env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined;
}

// Fonction pour obtenir le client Supabase
export function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error('Le client Supabase n\'est pas disponible. Vérifiez vos variables d\'environnement.');
  }
  return supabaseClient;
}
