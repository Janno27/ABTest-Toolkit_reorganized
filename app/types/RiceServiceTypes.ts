// Types pour les services Rice
export interface RiceWeights {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  [key: string]: number; // Pour l'accès via des clés dynamiques
}

export interface ReachCategory {
  id: string;
  name: string;
  minReach: number;
  maxReach: number;
  points: number;
  example: string;
}

export interface ImpactKPI {
  id: string;
  name: string;
  minDelta: string;
  maxDelta: string;
  pointsPerUnit: string;
  example: string;
  isBehaviorMetric?: boolean;
  parentKPI?: string;
}

export interface ImpactMetric {
  id: string;
  name: string;
  description: string;
  points: number;
  example: string;
  color?: string;
}

export interface ConfidenceSource {
  id: string;
  name: string;
  points: number;
  example: string;
  description?: string;
}

export interface EffortSize {
  id: string;
  name: string;
  duration: string;
  devEffort: number;
  designEffort: number;
  example: string;
}

// Interface pour les mises à jour individuelles d'éléments
export interface SingleItemUpdate {
  type: 'reach' | 'impact' | 'confidence' | 'effort';
  itemId: string;
  key: string;
  value: any;
}

// Interface pour les suppressions individuelles d'éléments
export interface SingleItemDelete {
  type: 'reach' | 'impact' | 'confidence' | 'effort';
  itemId: string;
}

export interface RiceSettings {
  id: string;
  name: string;
  customWeightsEnabled: boolean;
  localMarketRuleEnabled: boolean;
  reachWeight: number;
  impactWeight: number;
  confidenceWeight: number;
  effortWeight: number;
  weights: RiceWeights;
  reachCategories: ReachCategory[];
  impactKPIs: ImpactKPI[];
  confidenceSources: ConfidenceSource[];
  effortSizes: EffortSize[];
  impactMetrics?: ImpactMetric[];
  createdAt: string;
  updatedAt: string;
  updateSingleItem?: SingleItemUpdate; // Pour les mises à jour individuelles
  deleteSingleItem?: SingleItemDelete; // Pour les suppressions individuelles
}

// Interface pour le service RICE
export interface RiceServiceInterface {
  getAllSettings(): Promise<RiceSettings[]>;
  getSettingsById(id: string): Promise<RiceSettings | null>;
  createSettings(settings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiceSettings>;
  updateSettings(id: string, updates: Partial<RiceSettings>): Promise<RiceSettings>;
  deleteSettings(id: string): Promise<boolean>;
  
  // Reach Categories
  addReachCategory(settingsId: string, category: Omit<ReachCategory, 'id'>): Promise<ReachCategory>;
  updateReachCategory(settingsId: string, categoryId: string, updates: Partial<ReachCategory>): Promise<ReachCategory>;
  deleteReachCategory(settingsId: string, categoryId: string): Promise<boolean>;
  
  // Impact KPIs
  addImpactKPI(settingsId: string, kpi: Omit<ImpactKPI, 'id'>): Promise<ImpactKPI>;
  updateImpactKPI(settingsId: string, kpiId: string, updates: Partial<ImpactKPI>): Promise<ImpactKPI>;
  deleteImpactKPI(settingsId: string, kpiId: string): Promise<boolean>;
  
  // Confidence Sources
  addConfidenceSource(settingsId: string, source: Omit<ConfidenceSource, 'id'>): Promise<ConfidenceSource>;
  updateConfidenceSource(settingsId: string, sourceId: string, updates: Partial<ConfidenceSource>): Promise<ConfidenceSource>;
  deleteConfidenceSource(settingsId: string, sourceId: string): Promise<boolean>;
  
  // Effort Sizes
  addEffortSize(settingsId: string, size: Omit<EffortSize, 'id'>): Promise<EffortSize>;
  updateEffortSize(settingsId: string, sizeId: string, updates: Partial<EffortSize>): Promise<EffortSize>;
  deleteEffortSize(settingsId: string, sizeId: string): Promise<boolean>;
} 