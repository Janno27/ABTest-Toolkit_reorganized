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