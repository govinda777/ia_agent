import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { db } from '@/lib/db';
import { knowledgeBase } from '@/db/schema';
import { desc, gt, sql, eq, and } from 'drizzle-orm';

/**
 * Formats content into a Markdown structure for organization and search
 */
function formatAsMarkdown(item: {
    topic: string;
    content: string;
    contentType: 'text' | 'faq' | 'file';
    metadata?: Record<string, unknown>;
}): string {
    const timestamp = new Date().toISOString();
    const separator = '---';

    // Frontmatter style metadata
    let markdown = `${separator}\n`;
    markdown += `# ${item.topic}\n\n`;
    markdown += `**Type:** ${item.contentType === 'faq' ? '❓ FAQ' : item.contentType === 'file' ? '📄 File' : '📝 Text'}\n`;
    markdown += `**Created At:** ${timestamp}\n`;

    if (item.metadata) {
        if (item.metadata.source) {
            markdown += `**Source:** ${item.metadata.source}\n`;
        }
        if (item.metadata.tags && Array.isArray(item.metadata.tags)) {
            markdown += `**Tags:** ${item.metadata.tags.join(', ')}\n`;
        }
        if (item.metadata.author) {
            markdown += `**Author:** ${item.metadata.author}\n`;
        }
    }

    markdown += `\n${separator}\n\n`;

    // Content section
    markdown += `## Content\n\n`;
    markdown += item.content;
    markdown += `\n\n${separator}\n`;

    // Reference anchor (for mentions like @topic)
    markdown += `\n<!-- @ref:${item.topic.toLowerCase().replace(/\s+/g, '-')} -->\n`;

    return markdown;
}

/**
 * Extracts keywords from the content for search
 */
function extractKeywords(text: string): string[] {
    // Remove markdown syntax
    const cleanText = text
        .replace(/[#*_`~\[\](){}]/g, ' ')
        .replace(/\s+/g, ' ')
        .toLowerCase();

    // Common English stopwords to filter out
    const stopwords = new Set([
        'a', 'an', 'and', 'the', 'in', 'on', 'of', 'for', 'to', 'with', 'is', 'it'
    ]);

    // Extract words with 3+ characters that aren't stopwords
    const words = cleanText.split(' ')
        .filter(word => word.length >= 3 && !stopwords.has(word));

    // Return unique keywords (up to 20)
    return [...new Set(words)].slice(0, 20);
}

export class BrainService {

    /**
     * Generates an embedding for a text using OpenAI text-embedding-3-small
     */
    async generateEmbedding(text: string): Promise<number[]> {
        const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: text,
        });
        return embedding;
    }

    /**
     * Retrieves relevant contexts from the knowledge base (RAG)
     * Supports @mentions for specific topic search
     */
    async retrieveContext(agentId: string, query: string, limit: number = 3): Promise<string[]> {
        // Check for @mention pattern (e.g., @faq-pricing)
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
     * Adds new knowledge with embedding and Markdown formatting
     */
    async addKnowledge(agentId: string, item: {
        topic: string;
        content: string;
        contentType?: 'text' | 'faq' | 'file';
        metadata?: Record<string, unknown>;
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
     * Lists all knowledge topics for an agent (for reference)
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
