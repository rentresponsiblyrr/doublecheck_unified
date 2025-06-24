
export class InspectionRetryService {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Executing operation attempt ${attempts}/${maxAttempts}`);

      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Attempt ${attempts} failed:`, lastError);
        
        if (attempts === maxAttempts) {
          break;
        }
        
        // Wait before retry with exponential backoff
        const delay = baseDelay * attempts;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Failed to execute operation after multiple attempts');
  }
}
