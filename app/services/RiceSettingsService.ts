// RiceSettingsService.ts
// Service pour gérer les opérations CRUD sur les paramètres RICE

import { 
  RiceSettings, 
  ReachCategory, 
  ImpactKPI, 
  ConfidenceSource, 
  EffortSize,
  ImpactMetric
} from '@/app/types/RiceServiceTypes';

// Service d'abstraction pour la gestion des paramètres RICE
class RiceSettingsService {
  private STORAGE_KEY = 'rice_settings';

  // Récupérer tous les paramètres RICE
  async getAllSettings(): Promise<RiceSettings[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      const storedSettings = localStorage.getItem(this.STORAGE_KEY);
      return storedSettings ? JSON.parse(storedSettings) : [];
    } catch (error) {
      console.error('Error fetching RICE settings:', error);
      return [];
    }
  }

  // Récupérer un paramètre RICE par ID
  async getSettingsById(id: string): Promise<RiceSettings | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      const settings = await this.getAllSettings();
      return settings.find(s => s.id === id) || null;
    } catch (error) {
      console.error(`Error fetching RICE settings with id ${id}:`, error);
      return null;
    }
  }

  // Créer de nouveaux paramètres RICE
  async createSettings(settings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiceSettings> {
    if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
    
    try {
      const allSettings = await this.getAllSettings();
      
      const newSettings: RiceSettings = {
        ...settings,
        id: this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      allSettings.push(newSettings);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSettings));
      
      return newSettings;
    } catch (error) {
      console.error('Error creating RICE settings:', error);
      throw error;
    }
  }

  // Mettre à jour des paramètres RICE existants
  async updateSettings(id: string, updates: Partial<RiceSettings>): Promise<RiceSettings> {
    if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
    
    try {
      const allSettings = await this.getAllSettings();
      const index = allSettings.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error(`Settings with id ${id} not found`);
      }
      
      const updatedSettings: RiceSettings = {
        ...allSettings[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      allSettings[index] = updatedSettings;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allSettings));
      
      return updatedSettings;
    } catch (error) {
      console.error(`Error updating RICE settings with id ${id}:`, error);
      throw error;
    }
  }

  // Supprimer des paramètres RICE
  async deleteSettings(id: string): Promise<boolean> {
    if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
    
    try {
      const allSettings = await this.getAllSettings();
      const newSettings = allSettings.filter(s => s.id !== id);
      
      if (newSettings.length === allSettings.length) {
        return false;
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      console.error(`Error deleting RICE settings with id ${id}:`, error);
      throw error;
    }
  }

  // Cloner des paramètres RICE existants
  async cloneSettings(id: string, newName: string): Promise<RiceSettings> {
    if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
    
    try {
      const settings = await this.getSettingsById(id);
      if (!settings) {
        throw new Error(`Settings with id ${id} not found`);
      }
      
      const clonedSettings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'> = {
        ...settings,
        name: newName || `${settings.name} (copie)`
      };
      
      return this.createSettings(clonedSettings);
    } catch (error) {
      console.error(`Error cloning RICE settings with id ${id}:`, error);
      throw error;
    }
  }

  // OPÉRATIONS POUR LES FACTEURS RICE

  // Reach Categories
  async addReachCategory(settingsId: string, category: Omit<ReachCategory, 'id'>): Promise<ReachCategory> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const newCategory: ReachCategory = {
      ...category,
      id: this.generateId()
    };
    
    const updatedCategories = [...(settings.reachCategories ?? []), newCategory];
    await this.updateSettings(settingsId, { reachCategories: updatedCategories });
    
    return newCategory;
  }

  async updateReachCategory(settingsId: string, categoryId: string, updates: Partial<ReachCategory>): Promise<ReachCategory> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const index = settings.reachCategories?.findIndex(c => c.id === categoryId) ?? -1;
    if (index === -1) throw new Error(`Category with id ${categoryId} not found`);
    
    const updatedCategory = {
      ...settings.reachCategories[index],
      ...updates
    };
    
    const updatedCategories = [...(settings.reachCategories ?? [])];
    updatedCategories[index] = updatedCategory;
    
    await this.updateSettings(settingsId, { reachCategories: updatedCategories });
    return updatedCategory;
  }

  async deleteReachCategory(settingsId: string, categoryId: string): Promise<boolean> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const updatedCategories = (settings.reachCategories ?? []).filter(c => c.id !== categoryId);
    if (updatedCategories.length === (settings.reachCategories?.length ?? 0)) {
      return false;
    }
    
    await this.updateSettings(settingsId, { reachCategories: updatedCategories });
    return true;
  }

  // Impact KPIs
  async addImpactKPI(settingsId: string, kpi: Omit<ImpactKPI, 'id'>): Promise<ImpactKPI> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const newKPI: ImpactKPI = {
      ...kpi,
      id: this.generateId()
    };
    
    const updatedKPIs = [...(settings.impactKPIs ?? []), newKPI];
    await this.updateSettings(settingsId, { impactKPIs: updatedKPIs });
    
    return newKPI;
  }

  async updateImpactKPI(settingsId: string, kpiId: string, updates: Partial<ImpactKPI>): Promise<ImpactKPI> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const index = settings.impactKPIs?.findIndex(k => k.id === kpiId) ?? -1;
    if (index === -1) throw new Error(`KPI with id ${kpiId} not found`);
    
    const updatedKPI = {
      ...settings.impactKPIs[index],
      ...updates
    };
    
    const updatedKPIs = [...(settings.impactKPIs ?? [])];
    updatedKPIs[index] = updatedKPI;
    
    await this.updateSettings(settingsId, { impactKPIs: updatedKPIs });
    return updatedKPI;
  }

  async deleteImpactKPI(settingsId: string, kpiId: string): Promise<boolean> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const updatedKPIs = (settings.impactKPIs ?? []).filter(k => k.id !== kpiId);
    if (updatedKPIs.length === (settings.impactKPIs?.length ?? 0)) {
      return false;
    }
    
    await this.updateSettings(settingsId, { impactKPIs: updatedKPIs });
    return true;
  }

  // Impact Metrics (corrigé avec opérateur de coalescence)
  async addImpactMetric(settingsId: string, metric: Omit<ImpactMetric, 'id'>): Promise<ImpactMetric> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const newMetric: ImpactMetric = {
      ...metric,
      id: this.generateId()
    };
    
    // Correction avec opérateur de coalescence nullish
    const updatedMetrics = [...(settings.impactMetrics ?? []), newMetric];
    await this.updateSettings(settingsId, { impactMetrics: updatedMetrics });
    
    return newMetric;
  }

  async updateImpactMetric(id: string, updates: Partial<ImpactMetric>) {
    const settings = await this.getSettings();
    
    // Ajout d'une vérification et valeur par défaut
    const impactMetrics = settings.impactMetrics ?? [];
    const index = impactMetrics.findIndex(m => m.id === id);
    
    if (index === -1) {
      throw new Error('Impact metric not found');
    }
  
    // Création de la métrique mise à jour avec vérification de l'index
    const updatedMetric = {
      ...impactMetrics[index], // Accès sécurisé avec impactMetrics garanti d'être un tableau
      ...updates
    };
  
    // Mise à jour du tableau
    const updatedMetrics = [
      ...impactMetrics.slice(0, index),
      updatedMetric,
      ...impactMetrics.slice(index + 1)
    ];
  
    await this.updateSettings(settings.id, { impactMetrics: updatedMetrics });
  }

  async deleteImpactMetric(settingsId: string, metricId: string): Promise<boolean> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const updatedMetrics = (settings.impactMetrics ?? []).filter(m => m.id !== metricId);
    if (updatedMetrics.length === (settings.impactMetrics?.length ?? 0)) {
      return false;
    }
    
    await this.updateSettings(settingsId, { impactMetrics: updatedMetrics });
    return true;
  }

  // Confidence Sources
  async addConfidenceSource(settingsId: string, source: Omit<ConfidenceSource, 'id'>): Promise<ConfidenceSource> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const newSource: ConfidenceSource = {
      ...source,
      id: this.generateId()
    };
    
    const updatedSources = [...(settings.confidenceSources ?? []), newSource];
    await this.updateSettings(settingsId, { confidenceSources: updatedSources });
    
    return newSource;
  }

  async updateConfidenceSource(settingsId: string, sourceId: string, updates: Partial<ConfidenceSource>): Promise<ConfidenceSource> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const index = settings.confidenceSources?.findIndex(s => s.id === sourceId) ?? -1;
    if (index === -1) throw new Error(`Source with id ${sourceId} not found`);
    
    const updatedSource = {
      ...settings.confidenceSources[index],
      ...updates
    };
    
    const updatedSources = [...(settings.confidenceSources ?? [])];
    updatedSources[index] = updatedSource;
    
    await this.updateSettings(settingsId, { confidenceSources: updatedSources });
    return updatedSource;
  }

  async deleteConfidenceSource(settingsId: string, sourceId: string): Promise<boolean> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const updatedSources = (settings.confidenceSources ?? []).filter(s => s.id !== sourceId);
    if (updatedSources.length === (settings.confidenceSources?.length ?? 0)) {
      return false;
    }
    
    await this.updateSettings(settingsId, { confidenceSources: updatedSources });
    return true;
  }

  // Effort Sizes
  async addEffortSize(settingsId: string, size: Omit<EffortSize, 'id'>): Promise<EffortSize> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const newSize: EffortSize = {
      ...size,
      id: this.generateId()
    };
    
    const updatedSizes = [...(settings.effortSizes ?? []), newSize];
    await this.updateSettings(settingsId, { effortSizes: updatedSizes });
    
    return newSize;
  }

  async updateEffortSize(settingsId: string, sizeId: string, updates: Partial<EffortSize>): Promise<EffortSize> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const index = settings.effortSizes?.findIndex(s => s.id === sizeId) ?? -1;
    if (index === -1) throw new Error(`Size with id ${sizeId} not found`);
    
    const updatedSize = {
      ...settings.effortSizes[index],
      ...updates
    };
    
    const updatedSizes = [...(settings.effortSizes ?? [])];
    updatedSizes[index] = updatedSize;
    
    await this.updateSettings(settingsId, { effortSizes: updatedSizes });
    return updatedSize;
  }

  async deleteEffortSize(settingsId: string, sizeId: string): Promise<boolean> {
    const settings = await this.getSettingsById(settingsId);
    if (!settings) throw new Error(`Settings with id ${settingsId} not found`);
    
    const updatedSizes = (settings.effortSizes ?? []).filter(s => s.id !== sizeId);
    if (updatedSizes.length === (settings.effortSizes?.length ?? 0)) {
      return false;
    }
    
    await this.updateSettings(settingsId, { effortSizes: updatedSizes });
    return true;
  }

  // Génération d'ID unique
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}

export const riceSettingsService = new RiceSettingsService();
export default riceSettingsService;