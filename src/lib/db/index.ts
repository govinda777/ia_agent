/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DATABASE CLIENT - Drizzle + Neon
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Este arquivo exporta a instância do cliente Drizzle configurada para Neon.
 * 
 * USO:
 * import { db } from '@/lib/db';
 * const users = await db.select().from(users);
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

// Validação de variável de ambiente
if (!process.env.DATABASE_URL) {
    throw new Error(
        '❌ DATABASE_URL is not defined. Please add it to your .env.local file.\n' +
        'Get your connection string from: https://console.neon.tech'
    );
}

// Cliente SQL do Neon
const sql = neon(process.env.DATABASE_URL);

// Instância do Drizzle com schema tipado
export const db = drizzle(sql, { schema });

// Re-exportar schema para conveniência
export * from '@/db/schema';
