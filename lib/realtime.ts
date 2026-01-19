import Ably from 'ably';
import { env } from '@/lib/env';

let client: Ably.Rest;
export function getAbly() {
  if (!client) client = new Ably.Rest(env.ABLY_API_KEY);
  return client;
}

export async function publishInventory(variantId: string, available: number) {
  const ably = getAbly();
  await ably.channels.get(`inventory:${variantId}`).publish('update', { variantId, available });
}
