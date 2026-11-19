import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import { Server, Socket } from 'socket.io';

type WatchRequest = { venueSlugs?: unknown; parkingSlugs?: unknown };

function validSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((slug): slug is string => typeof slug === 'string' && /^[a-z0-9-]{1,80}$/.test(slug)),
    ),
  ].slice(0, 50);
}

@WebSocketGateway({ namespace: '/live' })
export class LiveGateway {
  @WebSocketServer() server?: Server;

  @SubscribeMessage('watch')
  watch(@ConnectedSocket() client: Socket, @MessageBody() body: WatchRequest) {
    for (const room of client.rooms) {
      if (room.startsWith('venue:') || room.startsWith('parking:')) void client.leave(room);
    }
    const venueSlugs = validSlugs(body?.venueSlugs);
    const parkingSlugs = validSlugs(body?.parkingSlugs);
    for (const slug of venueSlugs) void client.join(`venue:${slug}`);
    for (const slug of parkingSlugs) void client.join(`parking:${slug}`);
    return { venueCount: venueSlugs.length, parkingCount: parkingSlugs.length };
  }

  venueUpdated(slug: string, version: number) {
    this.server
      ?.to(`venue:${slug}`)
      .emit('venue.availability.updated.v1', { eventId: randomUUID(), slug, version });
  }

  parkingUpdated(slug: string, version: number) {
    this.server
      ?.to(`parking:${slug}`)
      .emit('parking.availability.updated.v1', { eventId: randomUUID(), slug, version });
  }
}
