import { NextRequest, NextResponse } from 'next/server';
import { GET_ONE, AirtableExperimentRecord } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: { record_id: string } }
) {
  try {
    const recordId = params.record_id;
    
    if (!recordId) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }
    
    const record = await GET_ONE(recordId);
    
    if (!record) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching Airtable record:", error);
    return NextResponse.json(
      { error: "Failed to fetch Airtable record" },
      { status: 500 }
    );
  }
} 