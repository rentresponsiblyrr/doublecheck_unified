/**
 * Queue Processor
 * Handles atomic processing of sync queue items to prevent race conditions
 */

export class QueueProcessor<T> {
  private processing = new Set<string>();
  private processingPromises = new Map<string, Promise<void>>();

  /**
   * Process an item atomically, preventing duplicate processing
   */
  async processItem(
    itemId: string,
    processor: () => Promise<T>,
  ): Promise<{
    success: boolean;
    result?: T;
    error?: string;
    wasAlreadyProcessing?: boolean;
  }> {
    // Check if item is already being processed
    if (this.processing.has(itemId)) {
      // Wait for the existing processing to complete
      const existingPromise = this.processingPromises.get(itemId);
      if (existingPromise) {
        await existingPromise;
      }
      return { success: false, wasAlreadyProcessing: true };
    }

    // Mark item as being processed
    this.processing.add(itemId);

    // Create processing promise
    const processingPromise = this.executeProcessor(itemId, processor);
    this.processingPromises.set(itemId, processingPromise);

    try {
      const result = await processingPromise;
      return { success: true, result };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      // Clean up processing state
      this.processing.delete(itemId);
      this.processingPromises.delete(itemId);
    }
  }

  private async executeProcessor<T>(
    itemId: string,
    processor: () => Promise<T>,
  ): Promise<T> {
    try {
      return await processor();
    } catch (error) {
      // Ensure cleanup happens even if processor throws
      this.processing.delete(itemId);
      this.processingPromises.delete(itemId);
      throw error;
    }
  }

  /**
   * Process multiple items in batches with concurrency control
   */
  async processBatch<T>(
    items: Array<{ id: string; processor: () => Promise<T> }>,
    concurrencyLimit: number = 3,
  ): Promise<
    Array<{ id: string; success: boolean; result?: T; error?: string }>
  > {
    const results: Array<{
      id: string;
      success: boolean;
      result?: T;
      error?: string;
    }> = [];

    // Process items in chunks to respect concurrency limit
    for (let i = 0; i < items.length; i += concurrencyLimit) {
      const chunk = items.slice(i, i + concurrencyLimit);

      const chunkPromises = chunk.map(async (item) => {
        const result = await this.processItem(item.id, item.processor);
        return {
          id: item.id,
          success: result.success,
          result: result.result,
          error: result.error,
        };
      });

      const chunkResults = await Promise.allSettled(chunkPromises);

      // Extract results from settled promises
      chunkResults.forEach((settled, index) => {
        if (settled.status === "fulfilled") {
          results.push(settled.value);
        } else {
          results.push({
            id: chunk[index].id,
            success: false,
            error: settled.reason?.message || "Unknown error",
          });
        }
      });
    }

    return results;
  }

  /**
   * Get currently processing items
   */
  getProcessingItems(): string[] {
    return Array.from(this.processing);
  }

  /**
   * Check if an item is currently being processed
   */
  isProcessing(itemId: string): boolean {
    return this.processing.has(itemId);
  }

  /**
   * Wait for all current processing to complete
   */
  async waitForAll(): Promise<void> {
    const promises = Array.from(this.processingPromises.values());
    await Promise.allSettled(promises);
  }

  /**
   * Clear all processing state (use with caution)
   */
  clear(): void {
    this.processing.clear();
    this.processingPromises.clear();
  }
}
