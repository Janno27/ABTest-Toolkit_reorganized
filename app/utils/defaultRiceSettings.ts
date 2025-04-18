import { RiceSettings, RiceWeights } from "../types/RiceServiceTypes";

// Générer un ID unique
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Poids RICE par défaut
export const defaultRiceWeights: RiceWeights = {
  reach: 30,
  impact: 30,
  confidence: 20,
  effort: 20
};

// Paramètres RICE par défaut
export const defaultRiceSettings: RiceSettings = {
  id: generateId(),
  name: "Paramètres RICE par défaut",
  customWeightsEnabled: false,
  localMarketRuleEnabled: false,
  reachWeight: 30,
  impactWeight: 30,
  confidenceWeight: 20,
  effortWeight: 20,
  weights: defaultRiceWeights,
  
  reachCategories: [
    {
      id: generateId(),
      name: "Petit",
      minReach: 0,
      maxReach: 100,
      points: 1,
      example: "Impact sur un nombre limité d'utilisateurs"
    },
    {
      id: generateId(),
      name: "Moyen",
      minReach: 100,
      maxReach: 1000,
      points: 3,
      example: "Impact sur un segment d'utilisateurs"
    },
    {
      id: generateId(),
      name: "Large",
      minReach: 1000,
      maxReach: 10000,
      points: 6,
      example: "Impact sur une large part des utilisateurs"
    },
    {
      id: generateId(),
      name: "Très large",
      minReach: 10000,
      maxReach: 100000,
      points: 10,
      example: "Impact sur presque tous les utilisateurs"
    }
  ],
  
  impactKPIs: [
    {
      id: generateId(),
      name: "Engagement",
      minDelta: "0%",
      maxDelta: "10%",
      pointsPerUnit: "1 point par 1%",
      example: "Augmentation du temps passé",
      isBehaviorMetric: false
    },
    {
      id: generateId(),
      name: "Conversion",
      minDelta: "0%",
      maxDelta: "5%",
      pointsPerUnit: "2 points par 1%",
      example: "Augmentation du taux de conversion",
      isBehaviorMetric: false
    },
    {
      id: generateId(),
      name: "Revenue",
      minDelta: "0$",
      maxDelta: "10,000$",
      pointsPerUnit: "1 point par 1,000$",
      example: "Augmentation du revenu par utilisateur",
      isBehaviorMetric: false
    },
    {
      id: generateId(),
      name: "Satisfaction",
      minDelta: "0",
      maxDelta: "2",
      pointsPerUnit: "5 points par point",
      example: "Amélioration du NPS/CSAT",
      isBehaviorMetric: false
    },
    {
      id: generateId(),
      name: "Behavior",
      minDelta: "0%",
      maxDelta: "100%",
      pointsPerUnit: "Selon l'impact",
      example: "Changement de comportement utilisateur",
      isBehaviorMetric: false
    }
  ],
  
  confidenceSources: [
    {
      id: generateId(),
      name: "Hypothèse",
      points: 1,
      example: "Basé sur une hypothèse ou intuition"
    },
    {
      id: generateId(),
      name: "Retour utilisateur",
      points: 3,
      example: "Basé sur des retours utilisateurs limités"
    },
    {
      id: generateId(),
      name: "Données internes",
      points: 6,
      example: "Basé sur l'analyse de données internes"
    },
    {
      id: generateId(),
      name: "Tests utilisateurs",
      points: 8,
      example: "Basé sur des tests utilisateurs concluants"
    },
    {
      id: generateId(),
      name: "A/B test",
      points: 10,
      example: "Basé sur des tests A/B concluants"
    }
  ],
  
  effortSizes: [
    {
      id: generateId(),
      name: "XS",
      duration: "1-2 jours",
      devEffort: 1,
      designEffort: 1,
      example: "Simple changement de texte ou de couleur"
    },
    {
      id: generateId(),
      name: "S",
      duration: "3-5 jours",
      devEffort: 2,
      designEffort: 2,
      example: "Modification simple d'une feature existante"
    },
    {
      id: generateId(),
      name: "M",
      duration: "1-2 semaines",
      devEffort: 4,
      designEffort: 3,
      example: "Nouvelle fonctionnalité simple"
    },
    {
      id: generateId(),
      name: "L",
      duration: "3-4 semaines",
      devEffort: 8,
      designEffort: 5,
      example: "Fonctionnalité complexe ou refactoring important"
    },
    {
      id: generateId(),
      name: "XL",
      duration: "2+ mois",
      devEffort: 13,
      designEffort: 8,
      example: "Nouveau module ou refonte majeure"
    }
  ],
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}; 