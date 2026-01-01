#!/usr/bin/env node

/**
 * Script de seed para o database
 * Uso: npm run db:seed
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

import * as schema from '../schema.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL não encontrada!');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function seedMinimal() {
  console.log('🌱 Populando dados mínimos...');
  
  try {
    // Verificar se usuário padrão já existe
    const existingUser = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, 'dev@localhost'))
      .limit(1);
    
    if (existingUser.length === 0) {
      // Criar usuário padrão
      const userId = randomUUID();
      await db.insert(schema.users).values({
        id: userId,
        email: 'dev@localhost',
        name: 'Developer',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Usuário padrão criado');
      
      // Criar agente padrão
      await db.insert(schema.agents).values({
        id: randomUUID(),
        name: 'Assistant',
        description: 'Agente de IA assistente',
        systemPrompt: 'Você é um assistente útil e amigável.',
        userId: userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Agente padrão criado');
    } else {
      console.log('ℹ️  Usuário padrão já existe');
    }
    
    console.log('✅ Seed mínimo concluído');
    
  } catch (error) {
    console.error('❌ Erro no seed mínimo:', error);
    throw error;
  }
}

async function seedFull() {
  console.log('🌱 Populando dados completos...');
  
  try {
    await seedMinimal();
    
    // Criar thread de exemplo
    const threadId = randomUUID();
    await db.insert(schema.threads).values({
      id: threadId,
      userId: 'dev-user-id', // Substituir pelo ID real
      title: 'Conversa de Exemplo',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Criar mensagens de exemplo
    await db.insert(schema.messages).values([
      {
        id: randomUUID(),
        threadId: threadId,
        role: 'user',
        content: 'Olá, como você está?',
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        threadId: threadId,
        role: 'assistant',
        content: 'Olá! Estou bem, obrigado por perguntar. Como posso ajudar você hoje?',
        createdAt: new Date(),
      }
    ]);
    
    console.log('✅ Seed completo concluído');
    
  } catch (error) {
    console.error('❌ Erro no seed completo:', error);
    throw error;
  }
}

async function seedReset() {
  console.log('🗑️  Limpando e repopulando dados...');
  
  try {
    // Limpar em ordem de dependência
    await db.delete(schema.messages);
    await db.delete(schema.threads);
    await db.delete(schema.agents);
    await db.delete(schema.users);
    
    console.log('✅ Dados limpos');
    
    // Repopular
    await seedFull();
    
    console.log('✅ Reset e seed concluídos');
    
  } catch (error) {
    console.error('❌ Erro no seed reset:', error);
    throw error;
  }
}

async function main() {
  const command = process.argv[2] || 'minimal';
  
  console.log(`🚀 Iniciando seed: ${command}\n`);
  
  try {
    switch (command) {
      case 'minimal':
        await seedMinimal();
        break;
      case 'full':
        await seedFull();
        break;
      case 'reset':
        await seedReset();
        break;
      default:
        console.error('Comando inválido! Use: minimal, full, ou reset');
        process.exit(1);
    }
    
    console.log('\n🎉 Seed concluído com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante seed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
