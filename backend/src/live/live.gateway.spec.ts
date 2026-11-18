import { Server, Socket } from 'socket.io';
import { LiveGateway } from './live.gateway';

describe('LiveGateway', () => {
  it('replaces room subscriptions and ignores invalid slugs', () => {
    const rooms = new Set(['socket-1', 'venue:old']);
    const client = {
      rooms,
      leave: jest.fn((room: string) => { rooms.delete(room); }),
      join: jest.fn((room: string) => { rooms.add(room); }),
    } as unknown as Socket;
    const gateway = new LiveGateway();
    const result = gateway.watch(client, { venueSlugs: ['demo-cafe', 'demo-cafe', 'bad slug'], parkingSlugs: ['demo-parking'] });
    expect(result).toEqual({ venueCount: 1, parkingCount: 1 });
    expect([...rooms]).toEqual(['socket-1', 'venue:demo-cafe', 'parking:demo-parking']);
  });

  it('publishes only to the matching venue or parking room', () => {
    const emit = jest.fn((_event: string, _payload: unknown) => undefined);
    const to = jest.fn((_room: string) => ({ emit }));
    const gateway = new LiveGateway();
    gateway.server = { to } as unknown as Server;
    gateway.venueUpdated('demo-cafe', 12);
    gateway.parkingUpdated('demo-parking', 13);
    expect(to.mock.calls.map((call) => call[0])).toEqual(['venue:demo-cafe', 'parking:demo-parking']);
    expect(emit.mock.calls.map((call) => call[0])).toEqual(['venue.availability.updated.v1', 'parking.availability.updated.v1']);
  });
});
