// Knowledge Base for STR Certified AI Learning System
// Manages external knowledge sources for RAG (Retrieval Augmented Generation)

import type { KnowledgeEntry, KnowledgeCategory } from "@/types/learning";

export class KnowledgeBase {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private vectorIndex: VectorIndex;
  private embeddingModel: EmbeddingModel;

  constructor(
    embeddingModel: string = "text-embedding-ada-002",
    vectorDimension: number = 1536,
  ) {
    this.embeddingModel = new EmbeddingModel(embeddingModel);
    this.vectorIndex = new VectorIndex(vectorDimension);
    this.initializeKnowledgeBase();
  }

  /**
   * Adds a new knowledge entry to the base
   */
  async addEntry(
    entry: Omit<KnowledgeEntry, "id" | "embeddings" | "usage" | "lastUpdated">,
  ): Promise<KnowledgeEntry> {
    // Generate ID
    const id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate embeddings
    const embeddings = await this.embeddingModel.embed(entry.content);

    // Create full entry
    const knowledgeEntry: KnowledgeEntry = {
      ...entry,
      id,
      embeddings: {
        vector: embeddings,
        model: this.embeddingModel.modelName,
        dimension: embeddings.length,
      },
      usage: {
        queryCount: 0,
        relevanceScore: 1.0,
        citationCount: 0,
      },
      lastUpdated: new Date(),
    };

    // Store entry
    this.entries.set(id, knowledgeEntry);

    // Index vector
    await this.vectorIndex.add(id, embeddings, {
      category: entry.category,
      tags: entry.metadata.tags,
    });

    return knowledgeEntry;
  }

  /**
   * Updates an existing knowledge entry
   */
  async updateEntry(
    id: string,
    updates: Partial<Omit<KnowledgeEntry, "id" | "embeddings">>,
  ): Promise<KnowledgeEntry | null> {
    const existing = this.entries.get(id);
    if (!existing) return null;

    // Update content and regenerate embeddings if content changed
    let embeddings = existing.embeddings;
    if (updates.content && updates.content !== existing.content) {
      const newEmbeddings = await this.embeddingModel.embed(updates.content);
      embeddings = {
        vector: newEmbeddings,
        model: this.embeddingModel.modelName,
        dimension: newEmbeddings.length,
      };

      // Update vector index
      await this.vectorIndex.update(id, newEmbeddings);
    }

    // Create updated entry
    const updated: KnowledgeEntry = {
      ...existing,
      ...updates,
      embeddings,
      lastUpdated: new Date(),
    };

    this.entries.set(id, updated);
    return updated;
  }

  /**
   * Searches the knowledge base using semantic similarity
   */
  async search(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      categories?: KnowledgeCategory[];
      tags?: string[];
      jurisdiction?: string;
    } = {},
  ): Promise<SearchResult[]> {
    const {
      limit = 5,
      threshold = 0.7,
      categories,
      tags,
      jurisdiction,
    } = options;

    // Generate query embeddings
    const queryEmbeddings = await this.embeddingModel.embed(query);

    // Search vector index
    const similarVectors = await this.vectorIndex.search(
      queryEmbeddings,
      limit * 2,
    );

    // Filter and rank results
    const results: SearchResult[] = [];

    for (const match of similarVectors) {
      const entry = this.entries.get(match.id);
      if (!entry) continue;

      // Apply filters
      if (categories && !categories.includes(entry.category)) continue;
      if (tags && !tags.some((tag) => entry.metadata.tags.includes(tag)))
        continue;
      if (jurisdiction && entry.metadata.jurisdiction !== jurisdiction)
        continue;
      if (match.similarity < threshold) continue;

      // Check if entry is still valid
      if (entry.status !== "active") continue;
      if (
        entry.metadata.expirationDate &&
        entry.metadata.expirationDate < new Date()
      )
        continue;

      results.push({
        entry,
        similarity: match.similarity,
        relevance: this.calculateRelevance(entry, query, match.similarity),
      });
    }

    // Sort by relevance and limit
    results.sort((a, b) => b.relevance - a.relevance);
    const finalResults = results.slice(0, limit);

    // Update usage statistics
    for (const result of finalResults) {
      result.entry.usage.queryCount++;
      result.entry.usage.lastQueried = new Date();
    }

    return finalResults;
  }

  /**
   * Gets entries by category
   */
  getByCategory(category: KnowledgeCategory): KnowledgeEntry[] {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.category === category && entry.status === "active",
    );
  }

  /**
   * Gets entries by regulation type
   */
  getByRegulationType(
    regulationType: string,
    jurisdiction?: string,
  ): KnowledgeEntry[] {
    return Array.from(this.entries.values()).filter(
      (entry) =>
        entry.metadata.regulationType === regulationType &&
        (!jurisdiction || entry.metadata.jurisdiction === jurisdiction) &&
        entry.status === "active",
    );
  }

  /**
   * Validates knowledge base consistency
   */
  async validate(): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    let validEntries = 0;
    let expiredEntries = 0;
    let deprecatedEntries = 0;

    for (const [id, entry] of this.entries) {
      // Check expiration
      if (
        entry.metadata.expirationDate &&
        entry.metadata.expirationDate < new Date()
      ) {
        expiredEntries++;
        issues.push({
          entryId: id,
          type: "expired",
          message: `Entry expired on ${entry.metadata.expirationDate.toISOString()}`,
        });
      }

      // Check deprecation
      if (entry.status === "deprecated") {
        deprecatedEntries++;
      }

      // Check embedding consistency
      if (entry.embeddings.dimension !== this.vectorIndex.dimension) {
        issues.push({
          entryId: id,
          type: "dimension_mismatch",
          message: `Embedding dimension ${entry.embeddings.dimension} doesn't match index dimension ${this.vectorIndex.dimension}`,
        });
      }

      // Check content length
      if (entry.content.length < 50) {
        issues.push({
          entryId: id,
          type: "content_too_short",
          message: "Content is too short to be useful",
        });
      }

      if (entry.status === "active" && !issues.some((i) => i.entryId === id)) {
        validEntries++;
      }
    }

    return {
      totalEntries: this.entries.size,
      validEntries,
      expiredEntries,
      deprecatedEntries,
      issues,
      lastValidated: new Date(),
    };
  }

  /**
   * Exports knowledge base to JSON
   */
  exportToJSON(): string {
    const data = {
      version: "1.0",
      exported: new Date().toISOString(),
      entries: Array.from(this.entries.values()).map((entry) => ({
        ...entry,
        embeddings: {
          ...entry.embeddings,
          vector: undefined, // Exclude vectors from export
        },
      })),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Imports knowledge base from JSON
   */
  async importFromJSON(json: string): Promise<ImportResult> {
    const data = JSON.parse(json);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of data.entries) {
      try {
        // Skip if already exists
        if (this.entries.has(entry.id)) {
          skipped++;
          continue;
        }

        // Re-generate embeddings
        const embeddings = await this.embeddingModel.embed(entry.content);

        const knowledgeEntry: KnowledgeEntry = {
          ...entry,
          embeddings: {
            vector: embeddings,
            model: this.embeddingModel.modelName,
            dimension: embeddings.length,
          },
          lastUpdated: new Date(entry.lastUpdated),
        };

        this.entries.set(entry.id, knowledgeEntry);
        await this.vectorIndex.add(entry.id, embeddings, {
          category: entry.category,
          tags: entry.metadata.tags,
        });

        imported++;
      } catch (error) {
        errors.push(`Failed to import ${entry.id}: ${error}`);
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Gets popular/frequently used entries
   */
  getPopularEntries(limit: number = 10): KnowledgeEntry[] {
    return Array.from(this.entries.values())
      .filter((entry) => entry.status === "active")
      .sort((a, b) => b.usage.queryCount - a.usage.queryCount)
      .slice(0, limit);
  }

  /**
   * Gets recently updated entries
   */
  getRecentlyUpdated(limit: number = 10): KnowledgeEntry[] {
    return Array.from(this.entries.values())
      .filter((entry) => entry.status === "active")
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
      .slice(0, limit);
  }

  /**
   * Cleans up expired and deprecated entries
   */
  async cleanup(): Promise<CleanupResult> {
    let removed = 0;
    const toRemove: string[] = [];

    for (const [id, entry] of this.entries) {
      // Remove expired entries older than 30 days
      if (entry.metadata.expirationDate) {
        const daysSinceExpiration =
          (Date.now() - entry.metadata.expirationDate.getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSinceExpiration > 30) {
          toRemove.push(id);
        }
      }

      // Remove deprecated entries with no recent usage
      if (entry.status === "deprecated" && entry.usage.queryCount === 0) {
        toRemove.push(id);
      }
    }

    // Remove entries
    for (const id of toRemove) {
      this.entries.delete(id);
      await this.vectorIndex.remove(id);
      removed++;
    }

    return {
      removed,
      remaining: this.entries.size,
    };
  }

  // Private helper methods

  private initializeKnowledgeBase(): void {
    // Initialize with some default knowledge entries
    const defaultEntries = [
      {
        category: "building_codes" as KnowledgeCategory,
        title: "Minimum Room Dimensions",
        content:
          "According to International Residential Code (IRC), habitable rooms must have a floor area of not less than 70 square feet. Habitable rooms, other than kitchens, must be at least 7 feet in any horizontal dimension.",
        source: "IRC Section R304.1",
        metadata: {
          regulationType: "building_code" as const,
          jurisdiction: "International",
          tags: ["room-size", "dimensions", "habitable-space"],
          version: "2021",
          effectiveDate: new Date("2021-01-01"),
        },
        status: "active" as const,
      },
      {
        category: "fire_safety" as KnowledgeCategory,
        title: "Smoke Detector Requirements",
        content:
          "Smoke alarms shall be installed in each sleeping room, outside each separate sleeping area in the immediate vicinity of the bedrooms, and on each additional story of the dwelling, including basements and habitable attics.",
        source: "IRC Section R314.3",
        metadata: {
          regulationType: "fire" as const,
          jurisdiction: "International",
          tags: ["smoke-detector", "fire-safety", "bedroom"],
          version: "2021",
          effectiveDate: new Date("2021-01-01"),
        },
        status: "active" as const,
      },
      {
        category: "ada_compliance" as KnowledgeCategory,
        title: "Accessible Route Width",
        content:
          "An accessible route must have a clear width of 36 inches minimum. The clear width of walking surfaces shall be 36 inches minimum, except at doors and doorways.",
        source: "ADA Standards Section 403.5",
        metadata: {
          regulationType: "ada" as const,
          jurisdiction: "United States",
          tags: ["accessibility", "route-width", "ada"],
          version: "2010",
          effectiveDate: new Date("2010-09-15"),
        },
        status: "active" as const,
      },
    ];

    // Add default entries
    defaultEntries.forEach((entry) => {});
  }

  private calculateRelevance(
    entry: KnowledgeEntry,
    query: string,
    similarity: number,
  ): number {
    let relevance = similarity * 100;

    // Boost for recent entries
    const daysSinceUpdate =
      (Date.now() - entry.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) {
      relevance += 5;
    }

    // Boost for frequently used entries
    if (entry.usage.queryCount > 10) {
      relevance += Math.min(10, entry.usage.queryCount / 10);
    }

    // Boost for high relevance score
    relevance += entry.usage.relevanceScore * 5;

    // Penalty for deprecated entries
    if (entry.status === "deprecated") {
      relevance -= 20;
    }

    return Math.min(100, relevance);
  }
}

// Supporting classes

class EmbeddingModel {
  constructor(public modelName: string) {}

  async embed(text: string): Promise<number[]> {
    // Mock embedding generation
    // In production, would call OpenAI API
    const hash = this.hashString(text);
    const embedding = new Array(1536).fill(0);

    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = Math.sin(hash * (i + 1)) * Math.cos(hash / (i + 1));
    }

    return embedding;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

class VectorIndex {
  private vectors: Map<string, Vector> = new Map();

  constructor(public dimension: number) {}

  async add(
    id: string,
    vector: number[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    this.vectors.set(id, { id, vector, metadata });
  }

  async update(id: string, vector: number[]): Promise<void> {
    const existing = this.vectors.get(id);
    if (existing) {
      existing.vector = vector;
    }
  }

  async remove(id: string): Promise<void> {
    this.vectors.delete(id);
  }

  async search(query: number[], limit: number): Promise<VectorMatch[]> {
    const matches: VectorMatch[] = [];

    for (const [id, vector] of this.vectors) {
      const similarity = this.cosineSimilarity(query, vector.vector);
      matches.push({ id, similarity, metadata: vector.metadata });
    }

    // Sort by similarity and return top matches
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }
}

// Types

interface Vector {
  id: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

interface VectorMatch {
  id: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  entry: KnowledgeEntry;
  similarity: number;
  relevance: number;
}

interface ValidationIssue {
  entryId: string;
  type: "expired" | "deprecated" | "dimension_mismatch" | "content_too_short";
  message: string;
}

interface ValidationReport {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  deprecatedEntries: number;
  issues: ValidationIssue[];
  lastValidated: Date;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface CleanupResult {
  removed: number;
  remaining: number;
}

// Export factory function
export const createKnowledgeBase = (
  embeddingModel?: string,
  vectorDimension?: number,
): KnowledgeBase => {
  return new KnowledgeBase(embeddingModel, vectorDimension);
};
