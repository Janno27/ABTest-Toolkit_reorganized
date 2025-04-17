import { supabase } from '../../lib/supabase';
import {
  RiceSettings,
  ReachCategory,
  ImpactKPI,
  ImpactMetric,
  ConfidenceSource,
  EffortSize,
  RiceServiceInterface
} from '@/app/types/RiceServiceTypes';

// Service pour gérer les paramètres RICE avec Supabase
export class SupabaseRiceSettingsService implements RiceServiceInterface {
  // Récupérer tous les paramètres RICE
  async getAllSettings(): Promise<RiceSettings[]> {
    try {
      const { data, error } = await supabase
        .from('rice_settings')
        .select(`
          *,
          rice_reach_categories (*),
          rice_impact_kpis (*),
          rice_confidence_sources (*),
          rice_effort_sizes (*)
        `);
        
      if (error) throw error;
      
      // Mapper les données au format attendu par l'application
      return data.map(this.mapDbSettingsToApp);
    } catch (error) {
      console.error('Error fetching RICE settings from Supabase:', error);
      return [];
    }
  }

  // Récupérer un paramètre RICE par ID
  async getSettingsById(id: string): Promise<RiceSettings | null> {
    try {
      console.log(`SupabaseRiceSettingsService: getSettingsById appelé avec ID ${id}`);
      
      const { data, error } = await supabase
        .from('rice_settings')
        .select(`
          *,
          rice_reach_categories (*),
          rice_impact_kpis (*),
          rice_confidence_sources (*),
          rice_effort_sizes (*)
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`SupabaseRiceSettingsService: Erreur lors de la récupération des paramètres`, error);
        throw error;
      }
      
      if (!data) {
        console.log(`SupabaseRiceSettingsService: Aucun paramètre trouvé avec l'ID ${id}`);
        return null;
      }
      
      console.log(`SupabaseRiceSettingsService: Paramètres trouvés`, {
        id: data.id,
        name: data.name,
        reachCategoriesCount: data.rice_reach_categories?.length || 0,
        impactKPIsCount: data.rice_impact_kpis?.length || 0,
        confidenceSourcesCount: data.rice_confidence_sources?.length || 0,
        effortSizesCount: data.rice_effort_sizes?.length || 0
      });
      
      return this.mapDbSettingsToApp(data);
    } catch (error) {
      console.error(`Error fetching RICE settings with id ${id} from Supabase:`, error);
      return null;
    }
  }

  // Créer de nouveaux paramètres RICE
  async createSettings(settings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiceSettings> {
    try {
      // Préparer les données pour l'insertion
      const { reachCategories, impactKPIs, confidenceSources, effortSizes, weights, ...mainSettings } = settings;
      
      // Insérer les paramètres principaux
      const { data: createdSettings, error } = await supabase
        .from('rice_settings')
        .insert({
          name: mainSettings.name,
          custom_weights_enabled: mainSettings.customWeightsEnabled,
          local_market_rule_enabled: mainSettings.localMarketRuleEnabled,
          reach_weight: settings.reachWeight || 30,
          impact_weight: settings.impactWeight || 30,
          confidence_weight: settings.confidenceWeight || 20,
          effort_weight: settings.effortWeight || 20
        })
        .select()
        .single();
        
      if (error) throw error;
      if (!createdSettings) throw new Error('Failed to create settings');
      
      // Insérer les catégories de portée
      if (reachCategories?.length) {
        await this.insertReachCategories(createdSettings.id, reachCategories);
      }
      
      // Insérer les KPIs d'impact
      if (impactKPIs?.length) {
        await this.insertImpactKPIs(createdSettings.id, impactKPIs);
      }
      
      // Insérer les sources de confiance
      if (confidenceSources?.length) {
        await this.insertConfidenceSources(createdSettings.id, confidenceSources);
      }
      
      // Insérer les tailles d'effort
      if (effortSizes?.length) {
        await this.insertEffortSizes(createdSettings.id, effortSizes);
      }
      
      // Récupérer les paramètres complets
      return this.getSettingsById(createdSettings.id) as Promise<RiceSettings>;
    } catch (error) {
      console.error('Error creating RICE settings in Supabase:', error);
      throw error;
    }
  }

  // Mettre à jour des paramètres RICE existants
  async updateSettings(id: string, updates: Partial<RiceSettings>): Promise<RiceSettings> {
    try {
      // Vérifier d'abord si le paramètre RICE existe
      const { data: existingSettings, error: checkError } = await supabase
        .from('rice_settings')
        .select('id')
        .eq('id', id)
        .single();
        
      if (checkError || !existingSettings) {
        throw new Error(`Les paramètres RICE avec l'ID ${id} n'existent pas. Impossible de mettre à jour.`);
      }
      
      const { reachCategories, impactKPIs, confidenceSources, effortSizes, weights, ...mainSettings } = updates;
      
      // Mettre à jour les paramètres principaux
      if (Object.keys(mainSettings).length > 0 && !updates.updateSingleItem && !updates.deleteSingleItem) {
        const dbMainSettings: any = {};
        
        if (mainSettings.name) dbMainSettings.name = mainSettings.name;
        if (mainSettings.customWeightsEnabled !== undefined) dbMainSettings.custom_weights_enabled = mainSettings.customWeightsEnabled;
        if (mainSettings.localMarketRuleEnabled !== undefined) dbMainSettings.local_market_rule_enabled = mainSettings.localMarketRuleEnabled;
        if (mainSettings.reachWeight !== undefined) dbMainSettings.reach_weight = mainSettings.reachWeight;
        if (mainSettings.impactWeight !== undefined) dbMainSettings.impact_weight = mainSettings.impactWeight;
        if (mainSettings.confidenceWeight !== undefined) dbMainSettings.confidence_weight = mainSettings.confidenceWeight;
        if (mainSettings.effortWeight !== undefined) dbMainSettings.effort_weight = mainSettings.effortWeight;
        
        const { error } = await supabase
          .from('rice_settings')
          .update(dbMainSettings)
          .eq('id', id);
          
        if (error) throw error;
      }
      
      // Mise à jour individuelle d'un paramètre
      // Cette partie est utilisée si l'utilisateur modifie un seul élément dans un tableau
      if (updates.updateSingleItem) {
        const { type, itemId, key, value } = updates.updateSingleItem;
        
        // Gestion de l'insertion d'un nouvel élément
        if (key === 'insert') {
          if (type === 'reach') {
            const dbCategory = {
              settings_id: id,
              id: itemId,
              name: value.name,
              min_reach: value.minReach,
              max_reach: value.maxReach,
              points: value.points,
              example: value.example
            };
            
            const { error } = await supabase
              .from('rice_reach_categories')
              .insert(dbCategory);
              
            if (error) throw error;
          } 
          else if (type === 'impact') {
            const dbKPI = {
              settings_id: id,
              id: itemId,
              name: value.name,
              min_delta: value.minDelta,
              max_delta: value.maxDelta,
              points_per_unit: value.pointsPerUnit,
              example: value.example,
              is_behavior_metric: value.isBehaviorMetric || false,
              parent_kpi_id: null
            };
            
            // Si c'est une métrique de comportement, rechercher d'abord l'ID du KPI Behavior
            if (value.isBehaviorMetric && value.parentKPI === "Behavior") {
              // Récupérer l'ID du KPI Behavior
              const { data: behaviorData, error: behaviorError } = await supabase
                .from('rice_impact_kpis')
                .select('id')
                .eq('settings_id', id)
                .eq('name', 'Behavior')
                .single();
                
              if (behaviorError) {
                console.error('Erreur lors de la recherche du KPI Behavior:', behaviorError);
              } else if (behaviorData) {
                // Définir l'ID parent avec l'ID réel du KPI Behavior
                dbKPI.parent_kpi_id = behaviorData.id;
              }
            }
            
            const { error } = await supabase
              .from('rice_impact_kpis')
              .insert(dbKPI);
              
            if (error) throw error;
          }
          else if (type === 'confidence') {
            const dbSource = {
              settings_id: id,
              id: itemId,
              name: value.name,
              points: value.points,
              example: value.example
            };
            
            const { error } = await supabase
              .from('rice_confidence_sources')
              .insert(dbSource);
              
            if (error) throw error;
          }
          else if (type === 'effort') {
            const dbSize = {
              settings_id: id,
              id: itemId,
              name: value.name,
              duration: value.duration,
              dev_effort: value.devEffort,
              design_effort: value.designEffort,
              example: value.example
            };
            
            const { error } = await supabase
              .from('rice_effort_sizes')
              .insert(dbSize);
              
            if (error) throw error;
          }
        }
        // Mise à jour d'un élément existant
        else {
          if (type === 'reach' && itemId) {
            const { error } = await supabase
              .from('rice_reach_categories')
              .update({ [this.toDatabaseKey(key)]: value })
              .eq('id', itemId);
              
            if (error) throw error;
          } else if (type === 'impact' && itemId) {
            const { error } = await supabase
              .from('rice_impact_kpis')
              .update({ [this.toDatabaseKey(key)]: value })
              .eq('id', itemId);
              
            if (error) throw error;
          } else if (type === 'confidence' && itemId) {
            const { error } = await supabase
              .from('rice_confidence_sources')
              .update({ [this.toDatabaseKey(key)]: value })
              .eq('id', itemId);
              
            if (error) throw error;
          } else if (type === 'effort' && itemId) {
            const { error } = await supabase
              .from('rice_effort_sizes')
              .update({ [this.toDatabaseKey(key)]: value })
              .eq('id', itemId);
              
            if (error) throw error;
          }
        }
      } 
      // Suppression individuelle d'un élément
      // Cette partie est utilisée si l'utilisateur supprime un seul élément dans un tableau
      else if (updates.deleteSingleItem) {
        const { type, itemId } = updates.deleteSingleItem;
        
        console.log('SupabaseRiceSettingsService: Suppression élément', { type, itemId });
        
        if (type === 'reach' && itemId) {
          console.log('SupabaseRiceSettingsService: Suppression reach category', itemId);
          const { data, error } = await supabase
            .from('rice_reach_categories')
            .delete()
            .eq('id', itemId)
            .select();
            
          console.log('SupabaseRiceSettingsService: Suppression result', { data, error });
            
          if (error) throw error;
        } else if (type === 'impact' && itemId) {
          console.log('SupabaseRiceSettingsService: Suppression impact KPI', itemId);
          const { data, error } = await supabase
            .from('rice_impact_kpis')
            .delete()
            .eq('id', itemId)
            .select();
          
          console.log('SupabaseRiceSettingsService: Suppression result', { data, error });
            
          if (error) throw error;
        } else if (type === 'confidence' && itemId) {
          console.log('SupabaseRiceSettingsService: Suppression confidence source', itemId);
          const { data, error } = await supabase
            .from('rice_confidence_sources')
            .delete()
            .eq('id', itemId)
            .select();
          
          console.log('SupabaseRiceSettingsService: Suppression result', { data, error });
            
          if (error) throw error;
        } else if (type === 'effort' && itemId) {
          console.log('SupabaseRiceSettingsService: Suppression effort size', itemId);
          const { data, error } = await supabase
            .from('rice_effort_sizes')
            .delete()
            .eq('id', itemId)
            .select();
          
          console.log('SupabaseRiceSettingsService: Suppression result', { data, error });
            
          if (error) throw error;
        }
      }
      else {
        // Mettre à jour les collections complètes si elles sont fournies
        if (reachCategories) {
          await this.updateReachCategories(id, reachCategories);
        }
        
        if (impactKPIs) {
          await this.updateImpactKPIs(id, impactKPIs);
        }
        
        if (confidenceSources) {
          await this.updateConfidenceSources(id, confidenceSources);
        }
        
        if (effortSizes) {
          await this.updateEffortSizes(id, effortSizes);
        }
      }
      
      // Récupérer les paramètres mis à jour
      const updatedSettings = await this.getSettingsById(id);
      if (!updatedSettings) throw new Error(`Impossible de récupérer les paramètres après la mise à jour`);
      
      return updatedSettings;
    } catch (error) {
      console.error(`Error updating RICE settings with id ${id} in Supabase:`, error);
      throw error;
    }
  }

  // Supprimer des paramètres RICE
  async deleteSettings(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rice_settings')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error deleting RICE settings with id ${id} from Supabase:`, error);
      throw error;
    }
  }

  // Cloner des paramètres RICE existants
  async cloneSettings(id: string, newName: string): Promise<RiceSettings> {
    try {
      const settings = await this.getSettingsById(id);
      if (!settings) {
        throw new Error(`Settings with id ${id} not found`);
      }
      
      const clonedSettings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'> = {
        ...settings,
        name: newName || `${settings.name} (copie)`
      };
      
      // Supprimer les propriétés qui ne doivent pas être copiées
      delete (clonedSettings as any).id;
      delete (clonedSettings as any).createdAt;
      delete (clonedSettings as any).updatedAt;
      
      return this.createSettings(clonedSettings);
    } catch (error) {
      console.error(`Error cloning RICE settings with id ${id} in Supabase:`, error);
      throw error;
    }
  }

  // OPÉRATIONS SPÉCIFIQUES POUR LES FACTEURS INDIVIDUELS

  // Méthodes privées pour insérer les sous-éléments
  private async insertReachCategories(settingsId: string, categories: Omit<ReachCategory, 'id'>[]): Promise<void> {
    const dbCategories = categories.map(cat => ({
      settings_id: settingsId,
      name: cat.name,
      min_reach: cat.minReach,
      max_reach: cat.maxReach,
      points: cat.points,
      example: cat.example
    }));
    
    const { error } = await supabase
      .from('rice_reach_categories')
      .insert(dbCategories);
      
    if (error) throw error;
  }
  
  private async insertImpactKPIs(settingsId: string, kpis: Omit<ImpactKPI, 'id'>[]): Promise<void> {
    // D'abord, insérer les KPIs parents
    const parentKPIs = kpis.filter(kpi => !kpi.isBehaviorMetric);
    const parentDbKPIs = parentKPIs.map(kpi => ({
      settings_id: settingsId,
      name: kpi.name,
      min_delta: kpi.minDelta,
      max_delta: kpi.maxDelta,
      points_per_unit: kpi.pointsPerUnit,
      example: kpi.example,
      is_behavior_metric: false,
      parent_kpi_id: null
    }));
    
    if (parentDbKPIs.length > 0) {
      const { error } = await supabase
        .from('rice_impact_kpis')
        .insert(parentDbKPIs);
        
      if (error) throw error;
    }
    
    // Ensuite, récupérer le KPI Behavior pour les sous-métriques
    const behaviorKPI = parentKPIs.find(kpi => kpi.name === 'Behavior');
    if (behaviorKPI && kpis.some(kpi => kpi.isBehaviorMetric)) {
      // Récupérer l'ID du KPI Behavior
      const { data: behaviorData, error: behaviorError } = await supabase
        .from('rice_impact_kpis')
        .select('id')
        .eq('settings_id', settingsId)
        .eq('name', 'Behavior')
        .single();
        
      if (behaviorError) throw behaviorError;
      
      if (behaviorData) {
        // Insérer les sous-métriques avec la référence au parent
        const behaviorMetrics = kpis.filter(kpi => kpi.isBehaviorMetric);
        const behaviorDbKPIs = behaviorMetrics.map(kpi => ({
          settings_id: settingsId,
          name: kpi.name,
          min_delta: kpi.minDelta,
          max_delta: kpi.maxDelta,
          points_per_unit: kpi.pointsPerUnit,
          example: kpi.example,
          is_behavior_metric: true,
          parent_kpi_id: behaviorData.id
        }));
        
        if (behaviorDbKPIs.length > 0) {
          const { error } = await supabase
            .from('rice_impact_kpis')
            .insert(behaviorDbKPIs);
            
          if (error) throw error;
        }
      }
    }
  }
  
  private async insertConfidenceSources(settingsId: string, sources: Omit<ConfidenceSource, 'id'>[]): Promise<void> {
    const dbSources = sources.map(source => ({
      settings_id: settingsId,
      name: source.name,
      points: source.points,
      example: source.example
    }));
    
    const { error } = await supabase
      .from('rice_confidence_sources')
      .insert(dbSources);
      
    if (error) throw error;
  }
  
  private async insertEffortSizes(settingsId: string, sizes: Omit<EffortSize, 'id'>[]): Promise<void> {
    const dbSizes = sizes.map(size => ({
      settings_id: settingsId,
      name: size.name,
      duration: size.duration,
      dev_effort: size.devEffort,
      design_effort: size.designEffort,
      example: size.example
    }));
    
    const { error } = await supabase
      .from('rice_effort_sizes')
      .insert(dbSizes);
      
    if (error) throw error;
  }
  
  // Méthodes de mise à jour
  private async updateReachCategories(settingsId: string, categories: ReachCategory[]): Promise<void> {
    try {
      // Vérifier d'abord si le paramètre RICE existe
      const { data: settingsData, error: settingsError } = await supabase
        .from('rice_settings')
        .select('id')
        .eq('id', settingsId)
        .single();
        
      if (settingsError || !settingsData) {
        throw new Error(`Les paramètres RICE avec l'ID ${settingsId} n'existent pas. Impossible de mettre à jour les catégories de portée.`);
      }
      
      // Récupérer les catégories existantes
      const { data: existingCategories, error: categoriesError } = await supabase
        .from('rice_reach_categories')
        .select('id')
        .eq('settings_id', settingsId);
        
      if (categoriesError) throw categoriesError;
      
      // Supprimer toutes les catégories existantes
      if (existingCategories && existingCategories.length > 0) {
        const { error: deleteError } = await supabase
          .from('rice_reach_categories')
          .delete()
          .eq('settings_id', settingsId);
          
        if (deleteError) throw deleteError;
      }
      
      // Insérer les nouvelles catégories
      if (categories && categories.length > 0) {
        await this.insertReachCategories(settingsId, categories);
      }
    } catch (error) {
      console.error(`Error updating reach categories for settings ${settingsId} in Supabase:`, error);
      throw error;
    }
  }
  
  private async updateImpactKPIs(settingsId: string, kpis: ImpactKPI[]): Promise<void> {
    try {
      // Vérifier d'abord si le paramètre RICE existe
      const { data: settingsData, error: settingsError } = await supabase
        .from('rice_settings')
        .select('id')
        .eq('id', settingsId)
        .single();
        
      if (settingsError || !settingsData) {
        throw new Error(`Les paramètres RICE avec l'ID ${settingsId} n'existent pas. Impossible de mettre à jour les KPIs d'impact.`);
      }
      
      // Récupérer les KPIs existants
      const { data: existingKPIs, error: kpisError } = await supabase
        .from('rice_impact_kpis')
        .select('id')
        .eq('settings_id', settingsId);
        
      if (kpisError) throw kpisError;
      
      // Supprimer tous les KPIs existants
      if (existingKPIs && existingKPIs.length > 0) {
        const { error: deleteError } = await supabase
          .from('rice_impact_kpis')
          .delete()
          .eq('settings_id', settingsId);
          
        if (deleteError) throw deleteError;
      }
      
      // Insérer les nouveaux KPIs
      if (kpis && kpis.length > 0) {
        await this.insertImpactKPIs(settingsId, kpis);
      }
    } catch (error) {
      console.error(`Error updating impact KPIs for settings ${settingsId} in Supabase:`, error);
      throw error;
    }
  }
  
  private async updateConfidenceSources(settingsId: string, sources: ConfidenceSource[]): Promise<void> {
    try {
      // Vérifier d'abord si le paramètre RICE existe
      const { data: settingsData, error: settingsError } = await supabase
        .from('rice_settings')
        .select('id')
        .eq('id', settingsId)
        .single();
        
      if (settingsError || !settingsData) {
        throw new Error(`Les paramètres RICE avec l'ID ${settingsId} n'existent pas. Impossible de mettre à jour les sources de confiance.`);
      }
      
      // Récupérer les sources existantes
      const { data: existingSources, error: sourcesError } = await supabase
        .from('rice_confidence_sources')
        .select('id')
        .eq('settings_id', settingsId);
        
      if (sourcesError) throw sourcesError;
      
      // Supprimer toutes les sources existantes
      if (existingSources && existingSources.length > 0) {
        const { error: deleteError } = await supabase
          .from('rice_confidence_sources')
          .delete()
          .eq('settings_id', settingsId);
          
        if (deleteError) throw deleteError;
      }
      
      // Insérer les nouvelles sources
      if (sources && sources.length > 0) {
        await this.insertConfidenceSources(settingsId, sources);
      }
    } catch (error) {
      console.error(`Error updating confidence sources for settings ${settingsId} in Supabase:`, error);
      throw error;
    }
  }
  
  private async updateEffortSizes(settingsId: string, sizes: EffortSize[]): Promise<void> {
    try {
      // Vérifier d'abord si le paramètre RICE existe
      const { data: settingsData, error: settingsError } = await supabase
        .from('rice_settings')
        .select('id')
        .eq('id', settingsId)
        .single();
        
      if (settingsError || !settingsData) {
        throw new Error(`Les paramètres RICE avec l'ID ${settingsId} n'existent pas. Impossible de mettre à jour les tailles d'effort.`);
      }
      
      // Récupérer les tailles existantes
      const { data: existingSizes, error: sizesError } = await supabase
        .from('rice_effort_sizes')
        .select('id')
        .eq('settings_id', settingsId);
        
      if (sizesError) throw sizesError;
      
      // Supprimer toutes les tailles existantes
      if (existingSizes && existingSizes.length > 0) {
        const { error: deleteError } = await supabase
          .from('rice_effort_sizes')
          .delete()
          .eq('settings_id', settingsId);
          
        if (deleteError) throw deleteError;
      }
      
      // Insérer les nouvelles tailles
      if (sizes && sizes.length > 0) {
        await this.insertEffortSizes(settingsId, sizes);
      }
    } catch (error) {
      console.error(`Error updating effort sizes for settings ${settingsId} in Supabase:`, error);
      throw error;
    }
  }
  
  // Méthode pour convertir les clés camelCase en snake_case pour la base de données
  private toDatabaseKey(key: string): string {
    switch (key) {
      case 'minReach': return 'min_reach';
      case 'maxReach': return 'max_reach';
      case 'minDelta': return 'min_delta';
      case 'maxDelta': return 'max_delta';
      case 'pointsPerUnit': return 'points_per_unit';
      case 'isBehaviorMetric': return 'is_behavior_metric';
      case 'parentKpiId': return 'parent_kpi_id';
      case 'devEffort': return 'dev_effort';
      case 'designEffort': return 'design_effort';
      default: return key;
    }
  }
  
  // Méthode pour mapper les données de la base de données au format de l'application
  private mapDbSettingsToApp(dbSettings: any): RiceSettings {
    // Mapper les catégories de portée
    const reachCategories: ReachCategory[] = dbSettings.rice_reach_categories?.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      minReach: cat.min_reach,
      maxReach: cat.max_reach,
      points: cat.points,
      example: cat.example
    })) || [];
    
    // Mapper les KPIs d'impact
    const impactKPIs: ImpactKPI[] = dbSettings.rice_impact_kpis?.map((kpi: any) => ({
      id: kpi.id,
      name: kpi.name,
      minDelta: kpi.min_delta,
      maxDelta: kpi.max_delta,
      pointsPerUnit: kpi.points_per_unit,
      example: kpi.example,
      isBehaviorMetric: kpi.is_behavior_metric,
      parentKpiId: kpi.parent_kpi_id
    })) || [];
    
    // Mapper les sources de confiance
    const confidenceSources: ConfidenceSource[] = dbSettings.rice_confidence_sources?.map((source: any) => ({
      id: source.id,
      name: source.name,
      points: source.points,
      example: source.example
    })) || [];
    
    // Mapper les tailles d'effort
    const effortSizes: EffortSize[] = dbSettings.rice_effort_sizes?.map((size: any) => ({
      id: size.id,
      name: size.name,
      duration: size.duration,
      devEffort: size.dev_effort,
      designEffort: size.design_effort,
      example: size.example
    })) || [];
    
    // Retourner les paramètres RICE complets
    return {
      id: dbSettings.id,
      name: dbSettings.name,
      customWeightsEnabled: dbSettings.custom_weights_enabled,
      localMarketRuleEnabled: dbSettings.local_market_rule_enabled,
      reachWeight: dbSettings.reach_weight,
      impactWeight: dbSettings.impact_weight,
      confidenceWeight: dbSettings.confidence_weight,
      effortWeight: dbSettings.effort_weight,
      createdAt: dbSettings.created_at,
      updatedAt: dbSettings.updated_at,
      reachCategories,
      impactKPIs,
      confidenceSources,
      effortSizes
    };
  }
}

// Exporter une instance du service
const supabaseRiceSettingsService = new SupabaseRiceSettingsService();
export default supabaseRiceSettingsService;
