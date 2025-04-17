#!/bin/bash

# Script de déploiement pour A-B Test ToolKit

# Vérifier que les variables d'environnement sont définies
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "Erreur: Les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY doivent être définies."
  echo "Utilisez: SUPABASE_URL=xxx SUPABASE_ANON_KEY=xxx ./deploy.sh"
  exit 1
fi

# Créer le fichier .env.production
echo "Création du fichier .env.production..."
cat > .env.production << EOL
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_USE_SUPABASE=true

# Backend API
NEXT_PUBLIC_API_URL=$BACKEND_URL

# Environnement
NODE_ENV=production
EOL

# Construction de l'application
echo "Construction de l'application Next.js..."
npm run build

# Vérification de la construction
if [ $? -ne 0 ]; then
  echo "Erreur lors de la construction de l'application."
  exit 1
fi

echo "Construction réussie!"
echo "Pour déployer sur Render, connectez votre dépôt GitHub à Render et utilisez les paramètres suivants:"
echo "- Frontend: npm install && npm run build && npm start"
echo "- Backend: pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port \$PORT"
