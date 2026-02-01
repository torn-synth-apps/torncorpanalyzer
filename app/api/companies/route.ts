import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeId = searchParams.get('type');
  
  // Access the key securely from the server environment
  // Don't bother to use this key, if you are seeing this code, that means I have already deleted this key.
  const apiKey = "4eSwI8C2L6A7goar";  

  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error: TORN_API_KEY is missing.' }, { status: 500 });
  }

  if (!typeId) {
    return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
  }

  try {
    const url = `https://api.torn.com/company/${typeId}?selections=companies&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Pass through the Torn API response or error
    return NextResponse.json(data);
  } catch (error) {
    console.error('Torn API Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to communicate with Torn API' }, { status: 502 });
  }
}