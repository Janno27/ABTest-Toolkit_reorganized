import { NextResponse } from 'next/server';
import { GET_ONE } from '../route';

// Force le comportement dynamique de la route
export const dynamic = 'force-dynamic';

// Utiliser les syntaxes exactes de la documentation Next.js
export async function GET(
  request: Request,
  { params }: { params: { record_id: string } }
) {
  const id = params.record_id;

  try {
    const record = await GET_ONE(id);
    
    if (!record) {
      return new NextResponse(JSON.stringify({ error: "Record not found" }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new NextResponse(JSON.stringify(record), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error fetching record:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch record" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}