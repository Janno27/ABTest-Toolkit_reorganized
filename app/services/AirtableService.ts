"use client";

export interface AirtableRecord {
  id: string;
  name: string;
}

class AirtableService {
  private baseId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Ces valeurs devraient idéalement venir des variables d'environnement
    this.baseId = "appvlnIm2BncMAHfo";
    this.apiKey = ""; // À remplir si nécessaire, mais pour une meilleure sécurité, utilisez l'API côté serveur
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}`;
  }

  async getRecordsFromExperimentations(): Promise<AirtableRecord[]> {
    try {
      // Appel à notre API route qui communique avec Airtable
      const response = await fetch('/api/airtable');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${JSON.stringify(errorData)}`);
      }
      
      const data: AirtableRecord[] = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des données Airtable:", error);
      
      // En cas d'erreur, on renvoie des données factices pour ne pas bloquer l'interface
      return [
        { id: "rec1", name: "Homepage redesign" },
        { id: "rec2", name: "Checkout flow optimization" },
        { id: "rec3", name: "Product page A/B test" },
        { id: "rec4", name: "Search functionality improvement" },
        { id: "rec5", name: "Mobile app onboarding" }
      ];
    }
  }
}

const airtableService = new AirtableService();
export default airtableService; 