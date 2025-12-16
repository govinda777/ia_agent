import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { db } from '@/lib/db';
import { knowledgeBase } from '@/db/schema';
import { cosineDistance, desc, gt, sql, eq, and } from 'drizzle-orm';

/**
 * Formata conteúdo em estrutura Markdown para organização e busca
 */
function formatAsMarkdown(item: {
    topic: string;
    content: string;
    contentType: 'text' | 'faq' | 'file';
    metadata?: Record<string, any>;
}): string {
    const timestamp = new Date().toISOString();
    const separator = '---';

    // Frontmatter style metadata
    let markdown = `${separator}\n`;
    markdown += `# ${item.topic}\n\n`;
    markdown += `**Tipo:** ${item.contentType === 'faq' ? '❓ FAQ' : item.contentType === 'file' ? '📄 Arquivo' : '📝 Texto'}\n`;
    markdown += `**Criado em:** ${timestamp}\n`;

    if (item.metadata) {
        if (item.metadata.source) {
            markdown += `**Fonte:** ${item.metadata.source}\n`;
        }
        if (item.metadata.tags && Array.isArray(item.metadata.tags)) {
            markdown += `**Tags:** ${item.metadata.tags.join(', ')}\n`;
        }
        if (item.metadata.author) {
            markdown += `**Autor:** ${item.metadata.author}\n`;
        }
    }

    markdown += `\n${separator}\n\n`;

    // Content section
    markdown += `## Conteúdo\n\n`;
    markdown += item.content;
    markdown += `\n\n${separator}\n`;

    // Reference anchor (for mentions like @topic)
    markdown += `\n<!-- @ref:${item.topic.toLowerCase().replace(/\s+/g, '-')} -->\n`;

    return markdown;
}

/**
 * Extrai keywords do conteúdo para busca
 */
function extractKeywords(text: string): string[] {
    // Remove markdown syntax
    const cleanText = text
        .replace(/[#*_`~\[\](){}]/g, ' ')
        .replace(/\s+/g, ' ')
        .toLowerCase();

    // Common Portuguese stopwords to filter out
    const stopwords = new Set([
        'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é',
        'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as',
        'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu',
        'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está',
        'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre'
    ]);

    // Extract words with 3+ characters that aren't stopwords
    const words = cleanText.split(' ')
        .filter(word => word.length >= 3 && !stopwords.has(word));

    // Return unique keywords (up to 20)
    return [...new Set(words)].slice(0, 20);
}

export class BrainService {

    /**
     * Gera embedding para um texto usando OpenAI text-embedding-3-small
     */
    async generateEmbedding(text: string): Promise<number[]> {
        const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: text,
        });
        return embedding;
    }

    /**
     * Busca contextos relevantes na base de conhecimento (RAG)
     * Suporta menções com @ para busca específica por tópico
     */
    async retrieveContext(agentId: string, query: string, limit: number = 3): Promise<string[]> {
        // Check for @mention pattern (e.g., @faq-precos)
        const mentionMatch = query.match(/@([\w-]+)/);

        if (mentionMatch) {
            // Direct topic lookup
            const topicRef = mentionMatch[1].replace(/-/g, ' ');
            const directResults = await db
                .select({ content: knowledgeBase.content })
                .from(knowledgeBase)
                .where(and(
                    eq(knowledgeBase.agentId, agentId),
                    eq(knowledgeBase.isActive, true),
                    sql`LOWER(${knowledgeBase.topic}) LIKE ${`%${topicRef}%`}`
                ))
                .limit(limit);

            if (directResults.length > 0) {
                return directResults.map(r => r.content);
            }
        }

        // Semantic search with embeddings
        const queryEmbedding = await this.generateEmbedding(query);
        const similarity = sql<number>`1 - (${knowledgeBase.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

        const results = await db
            .select({
                content: knowledgeBase.content,
                topic: knowledgeBase.topic,
                similarity: similarity,
            })
            .from(knowledgeBase)
            .where(and(
                eq(knowledgeBase.agentId, agentId),
                eq(knowledgeBase.isActive, true),
                gt(similarity, 0.7)
            ))
            .orderBy(desc(similarity))
            .limit(limit);

        // Return content with topic header for context
        return results.map(r => `### ${r.topic}\n\n${r.content}`);
    }

    /**
     * Adiciona novo conhecimento com embedding e formatação Markdown
     */
    async addKnowledge(agentId: string, item: {
        topic: string;
        content: string;
        contentType?: 'text' | 'faq' | 'file';
        metadata?: Record<string, any>;
    }) {
        const contentType = item.contentType || 'text';

        // Format content as structured Markdown
        const formattedContent = formatAsMarkdown({
            topic: item.topic,
            content: item.content,
            contentType,
            metadata: item.metadata,
        });

        // Generate embedding for the ORIGINAL content (not formatted)
        // This preserves semantic meaning without markdown noise
        const embedding = await this.generateEmbedding(item.content);

        // Extract keywords for additional search capability
        const keywords = extractKeywords(item.content);

        await db.insert(knowledgeBase).values({
            agentId,
            topic: item.topic,
            content: formattedContent,
            contentType,
            embedding,
            keywords,
            metadata: {
                ...item.metadata,
                originalLength: item.content.length,
                formattedAt: new Date().toISOString(),
            },
        });
    }

    /**
     * Lista todos os tópicos de conhecimento de um agente (para referência)
     */
    async listTopics(agentId: string): Promise<{ id: string; topic: string; contentType: string }[]> {
        const results = await db
            .select({
                id: knowledgeBase.id,
                topic: knowledgeBase.topic,
                contentType: knowledgeBase.contentType,
            })
            .from(knowledgeBase)
            .where(and(
                eq(knowledgeBase.agentId, agentId),
                eq(knowledgeBase.isActive, true)
            ))
            .orderBy(knowledgeBase.topic);

        return results.map(r => ({
            id: r.id,
            topic: r.topic,
            contentType: r.contentType || 'text',
        }));
    }
}
