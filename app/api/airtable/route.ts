import { NextResponse } from 'next/server';

// Typages
interface AirtableResponse {
  records: Array<{
    id: string;
    fields: Record<string, any>;
    createdTime: string;
  }>;
  offset?: string;
}

// Tables de référence pour les lookups
const referenceTables = {
  Owner: "Owner",
  Market: "Market",
  Page: "Page",
  KPI: "KPI"
};

// Noms des colonnes dans les tables de référence
const columnNames = {
  Owner: "Name",
  Market: "Market",
  Page: "Name",
  KPI: "KPI"
};

export interface AirtableExperimentRecord {
  id: string;
  name: string;
  hypothesis?: string;
  ownerId?: string;
  ownerName?: string;
  marketId?: string;
  marketName?: string;
  pageId?: string;
  pageName?: string;
  context?: string;
  description?: string;
  mainKpiId?: string;
  mainKpiName?: string;
  scope?: string;
  recordLink?: string;
}

/**
 * Récupère les données depuis Airtable
 */
export async function GET() {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = "Experimentations";
  const VIEW_NAME = "To be Prioritized";

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json(
      { error: "Airtable configuration missing" },
      { status: 500 }
    );
  }

  try {
    // Construction de l'URL avec paramètres de filtre
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?view=${encodeURIComponent(VIEW_NAME)}`;
    
    // Appel à l'API Airtable
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Airtable API error: ${JSON.stringify(errorData)}`);
    }

    const data: AirtableResponse = await response.json();
    
    // Formater les données pour notre API
    const formattedRecords = data.records.map((record) => ({
      id: record.id,
      name: record.fields.Name || "Sans titre",
      hypothesis: record.fields.Hypothesis || "",
      ownerId: Array.isArray(record.fields.Owner) ? record.fields.Owner[0] : "",
      ownerName: "", // Sera rempli plus tard si possible
      marketId: Array.isArray(record.fields.Market) ? record.fields.Market[0] : "",
      marketName: "", // Sera rempli plus tard si possible
      pageId: Array.isArray(record.fields.Page) ? record.fields.Page[0] : "",
      pageName: "", // Sera rempli plus tard si possible
      context: record.fields.Context || "",
      description: record.fields.Description || "",
      mainKpiId: Array.isArray(record.fields["Main KPI"]) ? record.fields["Main KPI"][0] : "",
      mainKpiName: "", // Sera rempli plus tard si possible
      scope: record.fields.Scope || "",
      recordLink: record.fields["Record Link"] || `https://airtable.com/${AIRTABLE_BASE_ID}/${TABLE_NAME}/${record.id}`
    }));

    return NextResponse.json(formattedRecords);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des données Airtable:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch data from Airtable" },
      { status: 500 }
    );
  }
}

/**
 * Récupère un enregistrement spécifique depuis Airtable avec les références résolues
 */
export async function GET_ONE(recordId: string): Promise<AirtableExperimentRecord | null> {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = "Experimentations";

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !recordId) {
    return null;
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}/${recordId}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const record = await response.json();
    
    // Créer l'objet de base
    const formattedRecord: AirtableExperimentRecord = {
      id: record.id,
      name: record.fields.Name || "Sans titre",
      hypothesis: record.fields.Hypothesis || "",
      ownerId: Array.isArray(record.fields.Owner) ? record.fields.Owner[0] : "",
      marketId: Array.isArray(record.fields.Market) ? record.fields.Market[0] : "",
      pageId: Array.isArray(record.fields.Page) ? record.fields.Page[0] : "",
      context: record.fields.Context || "",
      description: record.fields.Description || "",
      mainKpiId: Array.isArray(record.fields["Main KPI"]) ? record.fields["Main KPI"][0] : "",
      scope: record.fields.Scope || "",
      recordLink: record.fields["Record Link"] || `https://airtable.com/${AIRTABLE_BASE_ID}/${TABLE_NAME}/${record.id}`
    };

    // Récupérer les noms des références
    await resolveReferences(formattedRecord, AIRTABLE_BASE_ID, AIRTABLE_API_KEY);
    
    return formattedRecord;
  } catch (error) {
    console.error("Erreur lors de la récupération d'un enregistrement Airtable:", error);
    return null;
  }
}

/**
 * Résout les références pour obtenir les noms des entités liées
 */
async function resolveReferences(
  record: AirtableExperimentRecord, 
  baseId: string, 
  apiKey: string
): Promise<void> {
  try {
    // Résoudre Owner
    if (record.ownerId) {
      const ownerName = await getRecordNameById(
        record.ownerId, 
        referenceTables.Owner, 
        baseId, 
        apiKey
      );
      record.ownerName = ownerName || "Unknown Owner";
    }
    
    // Résoudre Market
    if (record.marketId) {
      const marketName = await getRecordNameById(
        record.marketId, 
        referenceTables.Market, 
        baseId, 
        apiKey
      );
      record.marketName = marketName || "Unknown Market";
    }
    
    // Résoudre Page
    if (record.pageId) {
      const pageName = await getRecordNameById(
        record.pageId, 
        referenceTables.Page, 
        baseId, 
        apiKey
      );
      record.pageName = pageName || "Unknown Page";
    }
    
    // Résoudre Main KPI
    if (record.mainKpiId) {
      const kpiName = await getRecordNameById(
        record.mainKpiId, 
        referenceTables.KPI, 
        baseId, 
        apiKey
      );
      record.mainKpiName = kpiName || "Unknown KPI";
    }
  } catch (error) {
    console.error("Erreur lors de la résolution des références:", error);
  }
}

/**
 * Récupère le nom d'un enregistrement depuis une table de référence
 */
async function getRecordNameById(
  recordId: string, 
  tableName: string, 
  baseId: string, 
  apiKey: string
): Promise<string | null> {
  try {
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const record = await response.json();
    
    // Utiliser le bon nom de colonne selon la table
    const columnName = columnNames[tableName as keyof typeof columnNames] || "Name";
    return record.fields[columnName] || null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du nom pour l'ID ${recordId} dans la table ${tableName}:`, error);
    return null;
  }
} 