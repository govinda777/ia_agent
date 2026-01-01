import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Carregar variáveis de ambiente do .env.local
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function createDefaultUser() {
    try {
        const result = await sql`
            INSERT INTO users (name, email, created_at, updated_at) 
            VALUES ('Admin', 'admin@ia-agent.com', NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
            RETURNING id
        `;

        console.log('Usuário criado/encontrado!');
        console.log('');
        console.log('ADICIONE ESTA VARIAVEL NO .env.local:');
        console.log(`DEFAULT_USER_ID=${result[0].id}`);
        console.log('');
        console.log('1. Edite o arquivo .env.local');
        console.log('2. Adicione a variavel acima');
        console.log('3. Execute: npm run dev');
    } catch (error) {
        console.error('Erro:', error);
    }
}

createDefaultUser();
