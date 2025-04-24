import { NextResponse, type NextRequest } from 'next/server';

// Typages
interface AirtableResponse {
  records: Array<{
    id: string;
    fields: Record<string, unknown>;
    createdTime: string;
  }>;
  offset?: string;
}

interface ReferenceTables {
  Owner: string;
  Market: string;
  Page: string;
  KPI: string;
}

interface ColumnNames {
  Owner: string;
  Market: string;
  Page: string;
  KPI: string;
}

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

// Configuration
const referenceTables: ReferenceTables = {
  Owner: "Owner",
  Market: "Market",
  Page: "Page",
  KPI: "KPI"
};

const columnNames: ColumnNames = {
  Owner: "Name",
  Market: "Market",
  Page: "Name",
  KPI: "KPI"
};

// Fonctions utilitaires
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

    if (!response.ok) return null;

    const record = await response.json();
    const columnKey = columnNames[tableName as keyof ColumnNames] || "Name";
    return record.fields[columnKey]?.toString() || null;
  } catch (error) {
    console.error(`Error fetching ${tableName} record:`, error);
    return null;
  }
}

async function resolveReferences(
  record: AirtableExperimentRecord,
  baseId: string,
  apiKey: string
): Promise<void> {
  try {
    const promises = [];

    if (record.ownerId) {
      promises.push(
        getRecordNameById(record.ownerId, referenceTables.Owner, baseId, apiKey)
          .then(name => { record.ownerName = name || "Unknown Owner"; })
      );
    }

    if (record.marketId) {
      promises.push(
        getRecordNameById(record.marketId, referenceTables.Market, baseId, apiKey)
          .then(name => { record.marketName = name || "Unknown Market"; })
      );
    }

    if (record.pageId) {
      promises.push(
        getRecordNameById(record.pageId, referenceTables.Page, baseId, apiKey)
          .then(name => { record.pageName = name || "Unknown Page"; })
      );
    }

    if (record.mainKpiId) {
      promises.push(
        getRecordNameById(record.mainKpiId, referenceTables.KPI, baseId, apiKey)
          .then(name => { record.mainKpiName = name || "Unknown KPI"; })
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("Error resolving references:", error);
  }
}

// Handlers API
export async function GET(request: NextRequest) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = "Experimentations";
  const VIEW_NAME = "To be Prioritized";

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json(
      { error: "Configuration Airtable manquante" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`
    );
    url.searchParams.set('view', VIEW_NAME);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur Airtable: ${JSON.stringify(errorData)}`);
    }

    const data: AirtableResponse = await response.json();

    const formattedRecords = await Promise.all(
      data.records.map(async (record) => {
        const baseRecord: AirtableExperimentRecord = {
          id: record.id,
          name: (record.fields.Name as string) || "Sans titre",
          hypothesis: (record.fields.Hypothesis as string) || "",
          ownerId: Array.isArray(record.fields.Owner) ? record.fields.Owner[0] as string : "",
          marketId: Array.isArray(record.fields.Market) ? record.fields.Market[0] as string : "",
          pageId: Array.isArray(record.fields.Page) ? record.fields.Page[0] as string : "",
          context: (record.fields.Context as string) || "",
          description: (record.fields.Description as string) || "",
          mainKpiId: Array.isArray(record.fields["Main KPI"]) ? record.fields["Main KPI"][0] as string : "",
          scope: (record.fields.Scope as string) || "",
          recordLink: (record.fields["Record Link"] as string) || 
            `https://airtable.com/${AIRTABLE_BASE_ID}/${TABLE_NAME}/${record.id}`
        };

        await resolveReferences(baseRecord, AIRTABLE_BASE_ID, AIRTABLE_API_KEY);
        return baseRecord;
      })
    );

    return NextResponse.json(formattedRecords);
  } catch (error: unknown) {
    console.error("Erreur de récupération des données:", error);
    return NextResponse.json(
      { error: "Échec de la récupération des données" },
      { status: 500 }
    );
  }
}
