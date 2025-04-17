import { z } from 'zod';

// Schéma de validation pour les variables d'environnement
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL doit être une URL valide'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY est requis'),
  NEXT_PUBLIC_USE_SUPABASE: z.enum(['true', 'false']).default('false'),
  
  // Backend API
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL doit être une URL valide'),
  
  // Environnement
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Type pour les variables d'environnement validées
export type Env = z.infer<typeof envSchema>;

// Fonction pour valider les variables d'environnement
export function validateEnv(): Env {
  try {
    // Récupérer les variables d'environnement
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_USE_SUPABASE: process.env.NEXT_PUBLIC_USE_SUPABASE,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Valider les variables d'environnement
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Erreur de validation des variables d\'environnement:');
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('Erreur inattendue lors de la validation des variables d\'environnement:', error);
    }
    
    // En développement, on peut continuer avec des valeurs par défaut
    if (process.env.NODE_ENV === 'development') {
      console.warn('Utilisation de valeurs par défaut pour le développement');
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        NEXT_PUBLIC_USE_SUPABASE: process.env.NEXT_PUBLIC_USE_SUPABASE || 'false',
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        NODE_ENV: 'development',
      };
    }
    
    // En production, on doit arrêter l'application
    throw new Error('Variables d\'environnement invalides. Vérifiez votre fichier .env');
  }
}

// Exporter les variables d'environnement validées
export const env = validateEnv();
