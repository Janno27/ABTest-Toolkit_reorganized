import { NextRequest, NextResponse } from 'next/server';
import { GET_ONE } from '../route';

// Force le comportement dynamique de la route
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ record_id: string }> }
): Promise<NextResponse> {
  try {
    // Récupération asynchrone des paramètres
    const { record_id } = await params;
    
    // Appel de la méthode GET_ONE avec l'ID extrait
    const record = await GET_ONE(record_id);

    if (!record) {
      return new NextResponse(
        JSON.stringify({ error: "Record not found" }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify(record),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Error fetching record:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch record" }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
