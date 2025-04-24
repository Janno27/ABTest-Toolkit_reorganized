import { NextRequest, NextResponse } from 'next/server';
import { GET_ONE } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: { record_id: string } } // Typage strict Next.js 13+
) {
  try {    
    const record = await GET_ONE(params.record_id);
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch record" },
      { status: 500 }
    );
  }
}