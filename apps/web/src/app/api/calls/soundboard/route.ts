import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import axios from 'axios';

const NEST_API_URL = process.env.NEST_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const body = await request.json();

    const response = await axios.post(`${NEST_API_URL}/calls/soundboard`, body, {
      headers: {
        cookie: headersList.get('cookie') || '',
        authorization: headersList.get('authorization') || '',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error proxying POST /calls/soundboard:', error.response?.data || error.message);
    return NextResponse.json(
      error.response?.data || { error: 'Failed to proxy request' },
      { status: error.response?.status || 500 }
    );
  }
}
