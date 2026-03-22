import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MONGODB: z.string().default('mongodb://localhost:27017/forms'),
  NODE_ENV: z.enum(['development', 'homologation', 'test', 'production']).default('development'),
  ADMIN_FORM_SECRET: z.string().default('dev-secret'),
});

export type Env = z.infer<typeof envSchema>;
