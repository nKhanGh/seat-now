import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  async get() {
    if (this.connection.readyState !== 1 || !this.connection.db) {
      throw new ServiceUnavailableException({ code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' });
    }
    try {
      await this.connection.db.admin().ping();
    } catch {
      throw new ServiceUnavailableException({ code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' });
    }
    return { data: { status: 'ok', database: 'ok' } };
  }
}
