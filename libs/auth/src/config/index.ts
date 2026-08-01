import { z } from 'zod';

const authConfigSchema = z.object({
  jwtSecret: z.string().min(32),
  jwtRefreshSecret: z.string().min(32),
  jwtAccessExpiry: z.string().default('15m'),
  jwtRefreshExpiry: z.string().default('30d'),
  jwtAlgorithm: z.enum(['HS256', 'RS256']).default('HS256'),
  issuer: z.string().default('tradenest'),
  audience: z.string().default('tradenest-api'),
  clockTolerance: z.number().default(30),
});

export type AuthConfig = z.infer<typeof authConfigSchema>;

let config: AuthConfig;

export function getAuthConfig(): AuthConfig {
  if (!config) {
    const result = authConfigSchema.safeParse({
      jwtSecret: process.env.JWT_SECRET,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
      jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY,
      jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY,
      jwtAlgorithm: process.env.JWT_ALGORITHM,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
      clockTolerance: process.env.JWT_CLOCK_TOLERANCE ? parseInt(process.env.JWT_CLOCK_TOLERANCE) : undefined,
    });
    
    if (!result.success) {
      throw new Error(`Invalid auth configuration: ${result.error.message}`);
    }
    config = result.data;
  }
  return config;
}

export function setAuthConfig(cfg: AuthConfig): void {
  config = cfg;
}