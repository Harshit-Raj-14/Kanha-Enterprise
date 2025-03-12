import type { Config } from 'drizzle-kit';

export default {
  schema: './src/v1/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', 
} satisfies Config;
