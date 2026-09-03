import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4001),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  BCRYPT_ROUNDS: z.coerce.number().default(12),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@tradenest.local'),

  OTP_EXPIRY_MINUTES: z.coerce.number().default(5),
  OTP_LENGTH: z.coerce.number().default(6),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function getEnv(): Env {
  if (!env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
      process.exit(1);
    }
    env = result.data;
  }
  return env;
}

export const config = getEnv();