import { headers } from "next/headers";
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios';

const NEST_API_URL = process.env.NEST_API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const headersList = await headers();
    const { callId } = await params;

    const response = await axios.get(`${NEST_API_URL}/calls/${callId}/participants`, {
      headers: {
        cookie: headersList.get('cookie') || '',
        authorization: headersList.get('authorization') || '',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error proxying GET /calls/${(await params).callId}/participants:`, error.response?.data || error.message);
    return NextResponse.json(
      error.response?.data || { error: 'Failed to proxy request' },
      { status: error.response?.status || 500 }
    );
  }
}
