import { NextResponse } from 'next/server';
import Ably from 'ably';
import { env } from '@/lib/env';

export async function GET() {
  const client = new Ably.Rest(env.ABLY_API_KEY);
  
  const tokenRequestData = await client.auth.createTokenRequest({ 
    clientId: 'anonymous',
    capability: {
      'inventory:*': ['subscribe'],
    },
  });

  return NextResponse.json(tokenRequestData);
}
