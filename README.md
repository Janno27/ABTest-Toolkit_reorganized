# README principal pour A-B Test ToolKit

## Vue d'ensemble

A-B Test ToolKit est une application qui implémente un système de prioritisation RICE (Reach, Impact, Confidence, Effort) pour aider les équipes à prendre des décisions sur les fonctionnalités à développer et les tests A/B à réaliser.

## Fonctionnalités clés

- Processus de vote en plusieurs étapes pour évaluer chaque dimension du RICE
- Modes hôte et participant pour faciliter les sessions collaboratives
- Visualisation en temps réel des votes et des résultats
- Calcul automatique du score final RICE
- Interface utilisateur moderne et conviviale

## Structure de l'application

L'application est composée de deux parties principales :

1. **Frontend (Next.js)** : Interface utilisateur pour la gestion des sessions RICE
2. **Backend (FastAPI)** : API pour les calculs statistiques des tests A/B

## Installation et démarrage

### Prérequis

- Node.js 18+
- Python 3.8+
- (Optionnel) Compte Supabase pour la persistance des données

### Installation

1. Clonez le dépôt :
   ```
   git clone https://github.com/votre-utilisateur/A-B-Test-ToolKit.git
   cd A-B-Test-ToolKit
   ```

2. Installez les dépendances du frontend :
   ```
   npm install
   ```

3. Installez les dépendances du backend :
   ```
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. Configurez les variables d'environnement :
   ```
   cp .env.example .env.local
   ```
   Modifiez le fichier `.env.local` avec vos propres valeurs.

### Démarrage en développement

1. Démarrez le frontend :
   ```
   npm run dev
   ```

2. Dans un autre terminal, démarrez le backend :
   ```
   cd backend
   uvicorn main:app --reload
   ```

L'application sera accessible à l'adresse http://localhost:3000

## Configuration de Supabase (optionnel)

Pour utiliser Supabase comme base de données au lieu du stockage local :

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Exécutez les scripts SQL fournis dans le dossier `docs/database-schema.md`
4. Mettez à jour votre fichier `.env.local` avec les informations de votre projet Supabase
5. Définissez `NEXT_PUBLIC_USE_SUPABASE=true` dans votre fichier `.env.local`

## Déploiement en production

L'application est configurée pour être déployée sur [Render](https://render.com) :

1. Créez un compte sur Render
2. Connectez votre dépôt GitHub
3. Créez un nouveau service Web pour le frontend et un autre pour le backend
4. Configurez les variables d'environnement dans Render
5. Déployez l'application

Pour plus de détails, consultez le guide de déploiement dans `docs/deployment.md`.

## Documentation

- [Framework RICE](docs/rice-framework.md) - Documentation détaillée sur le framework RICE
- [Intégration Supabase](docs/supabase-integration.md) - Guide d'intégration avec Supabase
- [Schéma de base de données](docs/database-schema.md) - Documentation sur le schéma de la base de données
- [Guide de déploiement](docs/deployment.md) - Instructions détaillées pour le déploiement

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
