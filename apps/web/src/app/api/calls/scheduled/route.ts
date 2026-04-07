import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const NEST_API_URL = process.env.NEST_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    const response = await axios.get(`${NEST_API_URL}/calls/scheduled`, {
      params: { workspaceId },
      headers: {
        cookie: headersList.get('cookie') || '',
        authorization: headersList.get('authorization') || '',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error proxying GET /calls/scheduled:', error.response?.data || error.message);
    return NextResponse.json(
      error.response?.data || { error: 'Failed to proxy request' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const body = await request.json();

    const response = await axios.post(`${NEST_API_URL}/calls/scheduled`, body, {
      headers: {
        cookie: headersList.get('cookie') || '',
        authorization: headersList.get('authorization') || '',
      },
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Error proxying POST /calls/scheduled:', error.response?.data || error.message);
    return NextResponse.json(
      error.response?.data || { error: 'Failed to proxy request' },
      { status: error.response?.status || 500 }
    );
  }
}
