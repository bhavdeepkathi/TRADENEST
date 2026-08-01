import { z } from 'zod';

const gatewayConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Service URLs
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:4001'),
  CATALOG_SERVICE_URL: z.string().url().default('http://localhost:4002'),
  ORDER_SERVICE_URL: z.string().url().default('http://localhost:4003'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://localhost:4004'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:4005'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:4006'),
  
  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
});

export type GatewayConfig = z.infer<typeof gatewayConfigSchema>;

let config: GatewayConfig;

export function getGatewayConfig(): GatewayConfig {
  if (!config) {
    const result = gatewayConfigSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid gateway configuration:', result.error.flatten().fieldErrors);
      process.exit(1);
    }
    config = result.data;
  }
  return config;
}

export const gatewayConfig = getGatewayConfig();