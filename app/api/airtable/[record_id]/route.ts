import { NextResponse, type NextRequest } from 'next/server';
import type { AirtableExperimentRecord } from '../route';

export const dynamic = 'force-dynamic';

// Fonction utilitaire réutilisable
async function fetchAirtableRecord(recordId: string): Promise<AirtableExperimentRecord | null> {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = "Experimentations";

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return null;

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}/${recordId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return null;

    const record = await response.json();
    
    const formattedRecord: AirtableExperimentRecord = {
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

    return formattedRecord;
  } catch (error) {
    console.error("Erreur de récupération:", error);
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: { record_id: string } }
) {
  try {
    const record = await fetchAirtableRecord(context.params.record_id);
    
    if (!record) {
      return NextResponse.json(
        { error: "Enregistrement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(record, { status: 200 });

  } catch (error) {
    console.error("Erreur critique:", error);
    return NextResponse.json(
      { error: "Échec du serveur interne" },
      { status: 500 }
    );
  }
}
