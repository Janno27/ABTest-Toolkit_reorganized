-- Schéma de base de données pour A-B Test ToolKit
-- Version: 1.0.0
-- Date: 2025-04-16

-- Table des paramètres RICE
CREATE TABLE IF NOT EXISTS rice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  custom_weights_enabled BOOLEAN DEFAULT FALSE,
  local_market_rule_enabled BOOLEAN DEFAULT TRUE,
  reach_weight NUMERIC NOT NULL DEFAULT 0.25,
  impact_weight NUMERIC NOT NULL DEFAULT 0.25,
  confidence_weight NUMERIC NOT NULL DEFAULT 0.25,
  effort_weight NUMERIC NOT NULL DEFAULT 0.25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories de portée
CREATE TABLE IF NOT EXISTS rice_reach_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_reach NUMERIC NOT NULL,
  max_reach NUMERIC NOT NULL,
  points NUMERIC NOT NULL,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des KPIs d'impact
CREATE TABLE IF NOT EXISTS rice_impact_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_delta TEXT NOT NULL,
  max_delta TEXT NOT NULL,
  points_per_unit TEXT NOT NULL,
  example TEXT,
  is_behavior_metric BOOLEAN DEFAULT FALSE,
  parent_kpi_id UUID REFERENCES rice_impact_kpis(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sources de confiance
CREATE TABLE IF NOT EXISTS rice_confidence_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points NUMERIC NOT NULL,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tailles d'effort
CREATE TABLE IF NOT EXISTS rice_effort_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  dev_effort NUMERIC NOT NULL,
  design_effort NUMERIC NOT NULL,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions RICE
CREATE TABLE IF NOT EXISTS rice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  settings_id UUID REFERENCES rice_settings(id) ON DELETE SET NULL,
  created_by UUID,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants
CREATE TABLE IF NOT EXISTS rice_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'participant',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des votes de portée
CREATE TABLE IF NOT EXISTS rice_reach_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  category_id UUID REFERENCES rice_reach_categories(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des votes d'impact
CREATE TABLE IF NOT EXISTS rice_impact_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  kpi_id UUID REFERENCES rice_impact_kpis(id) ON DELETE CASCADE,
  expected_value DECIMAL NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des votes de confiance
CREATE TABLE IF NOT EXISTS rice_confidence_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  source_id UUID REFERENCES rice_confidence_sources(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des votes d'effort
CREATE TABLE IF NOT EXISTS rice_effort_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  user_id UUID,
  dev_size_id UUID REFERENCES rice_effort_sizes(id) ON DELETE CASCADE,
  design_size_id UUID REFERENCES rice_effort_sizes(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résultats RICE
CREATE TABLE IF NOT EXISTS rice_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  reach_score NUMERIC NOT NULL,
  impact_score NUMERIC NOT NULL,
  confidence_score NUMERIC NOT NULL,
  effort_score NUMERIC NOT NULL,
  rice_score NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rice_reach_categories_settings_id ON rice_reach_categories(settings_id);
CREATE INDEX IF NOT EXISTS idx_rice_impact_kpis_settings_id ON rice_impact_kpis(settings_id);
CREATE INDEX IF NOT EXISTS idx_rice_confidence_sources_settings_id ON rice_confidence_sources(settings_id);
CREATE INDEX IF NOT EXISTS idx_rice_effort_sizes_settings_id ON rice_effort_sizes(settings_id);
CREATE INDEX IF NOT EXISTS idx_rice_sessions_settings_id ON rice_sessions(settings_id);
CREATE INDEX IF NOT EXISTS idx_rice_participants_session_id ON rice_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_rice_reach_votes_session_id ON rice_reach_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_rice_impact_votes_session_id ON rice_impact_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_rice_confidence_votes_session_id ON rice_confidence_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_rice_effort_votes_session_id ON rice_effort_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_rice_results_session_id ON rice_results(session_id);
