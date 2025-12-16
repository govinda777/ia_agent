import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

export default defineConfig({
    // Schema location
    schema: './src/db/schema.ts',

    // Output directory for migrations
    out: './drizzle',

    // Database driver
    dialect: 'postgresql',

    // Database connection
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },

    // Verbose logging
    verbose: true,

    // Strict mode
    strict: true,
});
