import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PrismaClient } from '@prisma/client';

describe('Database Integration Tests', () => {
  let container: StartedTestContainer;
  let prisma: PrismaClient;
  let databaseUrl: string;

  beforeAll(async () => {
    container = await new GenericContainer('postgres:15-alpine')
      .withEnvironment({
        POSTGRES_DB: 'tradenest_test',
        POSTGRES_USER: 'tradenest',
        POSTGRES_PASSWORD: 'tradenest_test',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forLogLine('database system is ready to accept connections'))
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);
    databaseUrl = `postgresql://tradenest:tradenest_test@${host}:${port}/tradenest_test`;

    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

    // Run migrations
    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);
  }, 120000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  }, 30000);

  it('should create and query a user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        isVerified: true,
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('CUSTOMER');

    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found).toEqual(user);
  });

  it('should enforce unique email constraint', async () => {
    await prisma.user.create({
      data: {
        email: 'unique@example.com',
        passwordHash: 'hashed',
        firstName: 'Unique',
        lastName: 'User',
        role: 'CUSTOMER',
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email: 'unique@example.com',
          passwordHash: 'hashed',
          firstName: 'Duplicate',
          lastName: 'User',
          role: 'CUSTOMER',
        },
      })
    ).rejects.toThrow();
  });
});