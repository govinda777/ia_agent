#!/usr/bin/env node

/**
 * Setup script for test database
 * Creates necessary tables and seeds basic data for testing
 */

import { db } from '../src/db/index.js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';

async function setupTestDb() {
    try {
        console.log('🔧 Setting up test database...');
        
        // Create tables if they don't exist
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log('✅ Test database setup complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up test database:', error);
        process.exit(1);
    }
}

setupTestDb();
