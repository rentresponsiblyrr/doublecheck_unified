// Browser Manager for VRBO Dynamic Content Scraping
// Handles Puppeteer browser lifecycle and stealth mode

import puppeteer, { Browser, Page, LaunchOptions } from 'puppeteer';
import { logger } from '../../utils/logger';
import { errorReporter } from '../monitoring/error-reporter';

export interface BrowserConfig {
  headless: boolean;
  timeout: number;
  viewportWidth: number;
  viewportHeight: number;
  userAgent: string;
  enableStealth: boolean;
  blockImages: boolean;
  blockCSS: boolean;
  proxy?: string;
}

export interface BrowserSession {
  browser: Browser;
  page: Page;
  sessionId: string;
  startTime: number;
  isActive: boolean;
}

export class BrowserManager {
  private static instance: BrowserManager;
  private activeSessions: Map<string, BrowserSession> = new Map();
  private config: BrowserConfig;
  
  private defaultConfig: BrowserConfig = {
    headless: true,
    timeout: 60000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    enableStealth: true,
    blockImages: false, // We need images for VRBO
    blockCSS: true, // Block CSS to speed up loading
    proxy: undefined
  };

  constructor(config: Partial<BrowserConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  public static getInstance(config?: Partial<BrowserConfig>): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager(config);
    }
    return BrowserManager.instance;
  }

  /**
   * Creates a new browser session for scraping
   * @param sessionId - Unique identifier for this session
   * @returns Promise<BrowserSession>
   */
  async createSession(sessionId?: string): Promise<BrowserSession> {
    const id = sessionId || this.generateSessionId();
    
    try {
      logger.info('Creating new browser session', { sessionId: id }, 'BROWSER_MANAGER');
      
      const launchOptions: LaunchOptions = {
        headless: this.config.headless,
        timeout: this.config.timeout,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--window-size=1920,1080',
          ...(this.config.proxy ? [`--proxy-server=${this.config.proxy}`] : [])
        ],
        defaultViewport: {
          width: this.config.viewportWidth,
          height: this.config.viewportHeight,
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          isLandscape: true
        }
      };

      const browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();

      // Configure page settings
      await this.configurePage(page);

      const session: BrowserSession = {
        browser,
        page,
        sessionId: id,
        startTime: Date.now(),
        isActive: true
      };

      this.activeSessions.set(id, session);

      logger.info('Browser session created successfully', { 
        sessionId: id,
        activeSessionsCount: this.activeSessions.size 
      }, 'BROWSER_MANAGER');

      return session;

    } catch (error) {
      logger.error('Failed to create browser session', error, 'BROWSER_MANAGER');
      errorReporter.reportError(error as Error, {
        context: 'BROWSER_MANAGER',
        operation: 'createSession',
        sessionId: id
      });
      throw error;
    }
  }

  /**
   * Configures page settings for optimal VRBO scraping
   * @param page - Puppeteer page instance
   */
  private async configurePage(page: Page): Promise<void> {
    // Set user agent for stealth
    await page.setUserAgent(this.config.userAgent);

    // Set extra HTTP headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Upgrade-Insecure-Requests': '1'
    });

    // Block unnecessary resources for faster loading
    if (this.config.blockCSS || this.config.blockImages) {
      await page.setRequestInterception(true);
      
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        
        if (this.config.blockCSS && resourceType === 'stylesheet') {
          request.abort();
          return;
        }
        
        if (this.config.blockImages && resourceType === 'image') {
          request.abort();
          return;
        }

        // Block other unnecessary resources
        if (['font', 'media'].includes(resourceType)) {
          request.abort();
          return;
        }

        request.continue();
      });
    }

    // Enable stealth mode
    if (this.config.enableStealth) {
      await this.enableStealthMode(page);
    }

    // Set page timeout
    page.setDefaultTimeout(this.config.timeout);
    page.setDefaultNavigationTimeout(this.config.timeout);
  }

  /**
   * Enables stealth mode to avoid bot detection
   * @param page - Puppeteer page instance
   */
  private async enableStealthMode(page: Page): Promise<void> {
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Mock plugins
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Mock languages
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    // Mock permissions
    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // Mock chrome runtime
    await page.evaluateOnNewDocument(() => {
      (window as any).chrome = {
        runtime: {}
      };
    });
  }

  /**
   * Closes a browser session and cleans up resources
   * @param sessionId - Session ID to close
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      logger.warn('Attempted to close non-existent session', { sessionId }, 'BROWSER_MANAGER');
      return;
    }

    try {
      session.isActive = false;
      
      if (session.page && !session.page.isClosed()) {
        await session.page.close();
      }
      
      if (session.browser && session.browser.connected()) {
        await session.browser.close();
      }

      this.activeSessions.delete(sessionId);

      const sessionDuration = Date.now() - session.startTime;
      logger.info('Browser session closed', { 
        sessionId,
        duration: sessionDuration,
        activeSessionsCount: this.activeSessions.size 
      }, 'BROWSER_MANAGER');

    } catch (error) {
      logger.error('Error closing browser session', error, 'BROWSER_MANAGER');
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Closes all active sessions
   */
  async closeAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.activeSessions.keys());
    
    await Promise.allSettled(
      sessionIds.map(sessionId => this.closeSession(sessionId))
    );

    logger.info('All browser sessions closed', { 
      closedCount: sessionIds.length 
    }, 'BROWSER_MANAGER');
  }

  /**
   * Gets an active session by ID
   * @param sessionId - Session ID
   * @returns BrowserSession or undefined
   */
  getSession(sessionId: string): BrowserSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Gets count of active sessions
   * @returns number
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Checks if a session is still active and healthy
   * @param sessionId - Session ID to check
   * @returns boolean
   */
  async isSessionHealthy(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return false;
    }

    try {
      // Check if browser is still connected
      if (!session.browser.connected()) {
        return false;
      }

      // Check if page is still accessible
      if (session.page.isClosed()) {
        return false;
      }

      // Try to evaluate a simple expression
      await session.page.evaluate(() => true);
      return true;

    } catch (error) {
      logger.warn('Session health check failed', { sessionId, error }, 'BROWSER_MANAGER');
      return false;
    }
  }

  /**
   * Creates a random delay to mimic human behavior
   * @param min - Minimum delay in milliseconds
   * @param max - Maximum delay in milliseconds
   * @returns Promise<void>
   */
  async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Simulates human-like mouse movement
   * @param page - Puppeteer page
   * @param x - Target X coordinate
   * @param y - Target Y coordinate
   */
  async humanMouseMove(page: Page, x: number, y: number): Promise<void> {
    const currentPos = await page.evaluate(() => ({ x: 0, y: 0 }));
    const steps = 10;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentX = currentPos.x + (x - currentPos.x) * progress;
      const currentY = currentPos.y + (y - currentPos.y) * progress;
      
      await page.mouse.move(currentX, currentY);
      await this.randomDelay(10, 30);
    }
  }

  /**
   * Simulates human-like scrolling
   * @param page - Puppeteer page
   * @param direction - 'up' or 'down'
   * @param distance - Scroll distance in pixels
   */
  async humanScroll(page: Page, direction: 'up' | 'down' = 'down', distance: number = 300): Promise<void> {
    const scrollDelta = direction === 'down' ? distance : -distance;
    const steps = 5;
    const stepDistance = scrollDelta / steps;
    
    for (let i = 0; i < steps; i++) {
      await page.evaluate((delta) => {
        window.scrollBy(0, delta);
      }, stepDistance);
      
      await this.randomDelay(100, 200);
    }
  }

  /**
   * Generates a unique session ID
   * @returns string
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `vrbo_${timestamp}_${random}`;
  }

  /**
   * Cleanup on process exit
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up browser manager', {}, 'BROWSER_MANAGER');
    await this.closeAllSessions();
  }
}

// Export singleton instance
export const browserManager = BrowserManager.getInstance();

// Cleanup on process exit
process.on('exit', () => {
  browserManager.cleanup();
});

process.on('SIGINT', async () => {
  await browserManager.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await browserManager.cleanup();
  process.exit(0);
});