const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
    try {
        console.log('Applying migration...');

        // Add new columns for per-agent integrations
        await sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS google_integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL`;
        console.log('✅ Added google_integration_id column');

        await sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS use_main_google_integration BOOLEAN DEFAULT TRUE`;
        console.log('✅ Added use_main_google_integration column');

        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit(0);
}

migrate();
