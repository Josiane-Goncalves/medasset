import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../gerado/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const urlBanco = process.env.DATABASE_URL;

    if (!urlBanco) {
      throw new Error('DATABASE_URL deve ser informada.');
    }

    super({ adapter: new PrismaPg({ connectionString: urlBanco }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
