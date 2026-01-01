/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DATABASE CLIENT - Drizzle + PostgreSQL
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Este arquivo exporta a instância do cliente Drizzle configurada para PostgreSQL.
 * 
 * USO:
 * import { db } from '@/lib/db';
 * const users = await db.select().from(users);
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Validação de variável de ambiente
if (!process.env.DATABASE_URL) {
    throw new Error(
        '❌ DATABASE_URL is not defined. Please add it to your .env.local file.\n' +
        'Get your connection string from: https://console.neon.tech'
    );
}

// Detectar se é banco local
const isLocalDB = process.env.DATABASE_URL.includes('localhost') || 
                  process.env.DATABASE_URL.includes('127.0.0.1');

// Cliente PostgreSQL
let connectionString = process.env.DATABASE_URL;
let client;

if (isLocalDB) {
    // Para PostgreSQL local, usar postgres-js
    client = postgres(connectionString);
} else {
    // Para Neon, manter o neon
    const { neon } = require('@neondatabase/serverless');
    client = neon(connectionString);
}

// Instância do Drizzle com schema tipado
export const db = drizzle(client, { schema });

// Re-exportar schema para conveniência
export * from '@/db/schema';
