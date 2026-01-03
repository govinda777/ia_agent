import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Connection for testing
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

// Create postgres client
const client = postgres(connectionString, { 
    prepare: false,
    max: 1 // Limit connections for tests
});

// Create drizzle instance
export const db = drizzle(client);

// Export for testing
export { client };
