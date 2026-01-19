'use client';

import { useEffect, useState } from 'react';
import Ably from 'ably';

export function RealtimeInventory({ 
  variantId, 
  initialAvailable 
}: { 
  variantId: string; 
  initialAvailable: number;
}) {
  const [available, setAvailable] = useState(initialAvailable);

  useEffect(() => {
    // Connect to Ably for real-time updates
    const ably = new Ably.Realtime({ authUrl: '/api/ably/auth' });
    const channel = ably.channels.get(`inventory:${variantId}`);

    channel.subscribe('update', (message) => {
      if (message.data?.available !== undefined) {
        setAvailable(message.data.available);
      }
    });

    return () => {
      channel.unsubscribe();
      ably.close();
    };
  }, [variantId]);

  return (
    <div style={{ fontSize: '14px', color: available > 0 ? '#0a0' : '#c00', marginTop: '4px' }}>
      {available > 0 ? `${available} in stock` : 'Out of stock'}
    </div>
  );
}
