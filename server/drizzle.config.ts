import type { Config } from 'drizzle-kit';

export default {
  schema: './src/v1/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', 
} satisfies Config;
