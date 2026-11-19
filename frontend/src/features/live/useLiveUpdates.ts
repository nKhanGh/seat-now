import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

export function useLiveUpdates(venueSlugs: string[], parkingSlugs: string[]) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const venueKey = venueSlugs.join(',');
  const parkingKey = parkingSlugs.join(',');

  useEffect(() => {
    const socket = io('/live', { autoConnect: false });
    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('watch', {
        venueSlugs: venueKey ? venueKey.split(',') : [],
        parkingSlugs: parkingKey ? parkingKey.split(',') : [],
      });
      void queryClient.invalidateQueries({ queryKey: ['map'] });
      void queryClient.invalidateQueries({ queryKey: ['parking'] });
    });
    socket.on('disconnect', () => setStatus('offline'));
    socket.on('connect_error', () => setStatus('offline'));
    socket.on(
      'venue.availability.updated.v1',
      () => void queryClient.invalidateQueries({ queryKey: ['map'] }),
    );
    socket.on(
      'parking.availability.updated.v1',
      () => void queryClient.invalidateQueries({ queryKey: ['parking'] }),
    );
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [venueKey, parkingKey, queryClient]);

  return status;
}
