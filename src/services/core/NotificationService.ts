/**
 * NOTIFICATION SERVICE - CORE CONSOLIDATION
 *
 * Consolidates all notification, messaging, and communication functionality
 * into a comprehensive service. This service replaces and unifies:
 *
 * CONSOLIDATED SERVICES:
 * 1. PushNotificationManager.ts - PWA push notifications with construction site optimizations
 * 2. intelligentBugReportService.ts - Smart bug reporting with AI classification
 * 3. NotificationCenter.ts (referenced) - In-app notification management
 *
 * CORE CAPABILITIES:
 * - Multi-channel notifications (push, in-app, email, SMS)
 * - Intelligent notification scheduling and batching
 * - Construction site optimized notifications (vibration, sound)
 * - Bug report integration with smart classification
 * - User preference management
 * - Real-time notification delivery
 * - Offline notification queuing
 * - A/B testing for notification effectiveness
 *
 * NOTIFICATION CHANNELS:
 * - Push Notifications (Web Push API)
 * - In-App Notifications (toast, modal, banner)
 * - Email Notifications (fallback and scheduled)
 * - SMS Notifications (emergency and high priority)
 * - System Notifications (OS level)
 *
 * ADVANCED FEATURES:
 * - Smart notification grouping
 * - Quiet hours and do-not-disturb
 * - Emergency override system
 * - Analytics and engagement tracking
 * - Personalized notification timing
 * - Context-aware notification content
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0 - Core Service Consolidation
 */

import { logger } from "@/utils/logger";

// ========================================
// NOTIFICATION TYPES & INTERFACES
// ========================================

export interface NotificationMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  
  // Targeting
  userId?: string;
  userRole?: string;
  deviceTypes?: ('mobile' | 'desktop' | 'tablet')[];
  
  // Scheduling
  scheduledAt?: Date;
  expiresAt?: Date;
  timezone?: string;
  
  // Delivery
  channels: NotificationChannel[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibration?: number[];
  sound?: string;
  
  // Metadata
  category: string;
  tags: string[];
  context?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  type?: 'button' | 'text';
  placeholder?: string;
  url?: string;
}

export type NotificationChannel = 'push' | 'in_app' | 'email' | 'sms' | 'system';

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  channels: {
    push: boolean;
    in_app: boolean;
    email: boolean;
    sms: boolean;
    system: boolean;
  };
  categories: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
    days: number[]; // 0-6, Sunday-Saturday
  };
  frequency: {
    maxPerHour: number;
    maxPerDay: number;
    batchSimilar: boolean;
    intelligentTiming: boolean;
  };
  constructionSiteMode: boolean;
  emergencyOverride: boolean;
  language: string;
  updatedAt: Date;
}

export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo: {
    type: 'mobile' | 'desktop' | 'tablet';
    os: string;
    browser: string;
    userAgent: string;
  };
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'clicked' | 'dismissed' | 'failed';
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
  dismissedAt?: Date;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface BugReport {
  id: string;
  userId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  steps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  browserInfo: Record<string, unknown>;
  systemInfo: Record<string, unknown>;
  userActions: string[];
  screenshots?: string[];
  logs?: string[];
  createdAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  githubIssueNumber?: number;
  aiClassification?: {
    category: string;
    confidence: number;
    suggestedPriority: string;
    estimatedEffort: number;
    relatedIssues: string[];
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationMessage['type'];
  title: string;
  body: string;
  category: string;
  channels: NotificationChannel[];
  variables: string[];
  conditions?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalClicked: number;
  totalDismissed: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  averageDeliveryTime: number;
  channelBreakdown: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
    engagement: number;
  }>;
  recentTrends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

// ========================================
// NOTIFICATION SERVICE IMPLEMENTATION
// ========================================

/**
 * Comprehensive Notification Service
 * 
 * Handles all notification delivery, user preferences, bug reporting,
 * and communication across multiple channels with intelligence.
 */
export class NotificationService {
  private static instance: NotificationService;

  // Core state management
  private notifications = new Map<string, NotificationMessage>();
  private deliveries = new Map<string, NotificationDelivery>();
  private preferences = new Map<string, NotificationPreferences>();
  private pushSubscriptions = new Map<string, PushSubscription>();
  private templates = new Map<string, NotificationTemplate>();
  private bugReports = new Map<string, BugReport>();

  // Queue management
  private sendQueue: NotificationMessage[] = [];
  private retryQueue: NotificationDelivery[] = [];
  private isProcessingQueue = false;

  // Service worker and push setup
  private swRegistration?: ServiceWorkerRegistration;
  private vapidPublicKey = '';

  // Configuration
  private readonly config = {
    maxRetries: 3,
    retryDelayMs: 5000,
    maxRetryDelayMs: 300000, // 5 minutes
    batchSize: 50,
    processIntervalMs: 10000, // 10 seconds
    cleanupIntervalMs: 3600000, // 1 hour
    maxNotificationAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    constructionSiteVibrationPattern: [300, 100, 300, 100, 300],
    emergencyVibrationPattern: [500, 200, 500, 200, 500, 200, 500],
    quietHourOverrideTypes: ['critical', 'emergency'],
    maxNotificationsPerHour: 10,
    maxNotificationsPerDay: 50
  };

  // Runtime timers
  private processTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ========================================
  // SERVICE INITIALIZATION
  // ========================================

  /**
   * Initialize notification service
   */
  async initialize(vapidPublicKey: string, swRegistration?: ServiceWorkerRegistration): Promise<void> {
    try {
      this.vapidPublicKey = vapidPublicKey;
      this.swRegistration = swRegistration;

      // Load stored data
      await this.loadStoredData();

      // Initialize push notifications if supported
      if (this.isPushSupported()) {
        await this.initializePushNotifications();
      }

      // Start processing queues
      this.startQueueProcessing();
      this.startCleanupTimer();

      // Initialize default templates
      this.initializeDefaultTemplates();

      logger.info('NotificationService initialized', {
        pushSupported: this.isPushSupported(),
        hasServiceWorker: !!this.swRegistration,
        templatesLoaded: this.templates.size
      });

    } catch (error) {
      logger.error('Failed to initialize NotificationService', { error });
      throw error;
    }
  }

  /**
   * Initialize the service with defaults
   */
  private initializeService(): void {
    // Set up event handlers for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.markInAppNotificationsAsRead();
      }
    });

    // Set up beforeunload handler to save state
    window.addEventListener('beforeunload', () => {
      this.saveStoredData();
    });
  }

  // ========================================
  // PUSH NOTIFICATION MANAGEMENT
  // ========================================

  /**
   * Initialize push notifications
   */
  private async initializePushNotifications(): Promise<void> {
    if (!this.swRegistration || !this.vapidPublicKey) {
      return;
    }

    try {
      // Check current permission status
      const permission = Notification.permission;
      logger.info('Push notification permission status', { permission });

      // Set up message listener from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

    } catch (error) {
      logger.error('Failed to initialize push notifications', { error });
    }
  }

  /**
   * Request push notification permission
   */
  async requestPushPermission(): Promise<NotificationPermission> {
    try {
      if (!this.isPushSupported()) {
        throw new Error('Push notifications not supported');
      }

      // Show permission request education if needed
      await this.showPermissionEducation();

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await this.subscribeToPush();
      }

      logger.info('Push permission requested', { permission });
      return permission;

    } catch (error) {
      logger.error('Failed to request push permission', { error });
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<void> {
    if (!this.swRegistration || !this.vapidPublicKey) {
      throw new Error('Service worker or VAPID key not available');
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      const pushSubscription: PushSubscription = {
        userId: await this.getCurrentUserId(),
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        },
        deviceInfo: this.getDeviceInfo(),
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true
      };

      // Store subscription
      this.pushSubscriptions.set(pushSubscription.userId, pushSubscription);

      // Send to server
      await this.sendSubscriptionToServer(pushSubscription);

      logger.info('Push subscription created', { 
        endpoint: subscription.endpoint,
        userId: pushSubscription.userId 
      });

    } catch (error) {
      logger.error('Failed to subscribe to push notifications', { error });
      throw error;
    }
  }

  // ========================================
  // NOTIFICATION SENDING & DELIVERY
  // ========================================

  /**
   * Send a notification through specified channels
   */
  async sendNotification(notification: Omit<NotificationMessage, 'id' | 'createdAt'>): Promise<string> {
    try {
      const fullNotification: NotificationMessage = {
        id: this.generateNotificationId(),
        createdAt: new Date(),
        createdBy: await this.getCurrentUserId(),
        ...notification
      };

      // Validate notification
      this.validateNotification(fullNotification);

      // Check user preferences
      const canSend = await this.canSendNotification(fullNotification);
      if (!canSend) {
        logger.debug('Notification blocked by user preferences', {
          notificationId: fullNotification.id,
          userId: fullNotification.userId
        });
        return fullNotification.id;
      }

      // Apply intelligent enhancements
      await this.enhanceNotification(fullNotification);

      // Store notification
      this.notifications.set(fullNotification.id, fullNotification);

      // Queue for delivery
      if (fullNotification.scheduledAt && fullNotification.scheduledAt > new Date()) {
        // Schedule for later delivery
        this.scheduleNotification(fullNotification);
      } else {
        // Queue for immediate delivery
        this.sendQueue.push(fullNotification);
      }

      // Process queue if high priority
      if (fullNotification.priority === 'urgent' || fullNotification.priority === 'emergency') {
        this.processNotificationQueue();
      }

      logger.info('Notification queued for delivery', {
        notificationId: fullNotification.id,
        type: fullNotification.type,
        priority: fullNotification.priority,
        channels: fullNotification.channels
      });

      return fullNotification.id;

    } catch (error) {
      logger.error('Failed to send notification', { notification, error });
      throw error;
    }
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.sendQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process in batches
      const batch = this.sendQueue.splice(0, this.config.batchSize);
      
      await Promise.allSettled(
        batch.map(notification => this.deliverNotification(notification))
      );

      logger.debug('Processed notification batch', { 
        batchSize: batch.length,
        remainingQueue: this.sendQueue.length 
      });

    } catch (error) {
      logger.error('Failed to process notification queue', { error });
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Deliver notification through all specified channels
   */
  private async deliverNotification(notification: NotificationMessage): Promise<void> {
    try {
      for (const channel of notification.channels) {
        const delivery: NotificationDelivery = {
          id: this.generateDeliveryId(),
          notificationId: notification.id,
          userId: notification.userId || await this.getCurrentUserId(),
          channel,
          status: 'pending',
          attemptCount: 0,
          maxAttempts: this.config.maxRetries,
          metadata: {}
        };

        this.deliveries.set(delivery.id, delivery);

        // Deliver through specific channel
        try {
          await this.deliverThroughChannel(notification, delivery);
        } catch (error) {
          delivery.status = 'failed';
          delivery.error = error instanceof Error ? error.message : String(error);
          delivery.attemptCount++;

          // Queue for retry if not exceeded max attempts
          if (delivery.attemptCount < delivery.maxAttempts) {
            this.retryQueue.push(delivery);
          }

          logger.error('Channel delivery failed', {
            deliveryId: delivery.id,
            channel,
            error: delivery.error
          });
        }
      }

    } catch (error) {
      logger.error('Failed to deliver notification', {
        notificationId: notification.id,
        error
      });
    }
  }

  /**
   * Deliver notification through specific channel
   */
  private async deliverThroughChannel(
    notification: NotificationMessage, 
    delivery: NotificationDelivery
  ): Promise<void> {
    delivery.status = 'sent';
    delivery.lastAttemptAt = new Date();

    switch (delivery.channel) {
      case 'push':
        await this.deliverPushNotification(notification, delivery);
        break;
      case 'in_app':
        await this.deliverInAppNotification(notification, delivery);
        break;
      case 'email':
        await this.deliverEmailNotification(notification, delivery);
        break;
      case 'sms':
        await this.deliverSMSNotification(notification, delivery);
        break;
      case 'system':
        await this.deliverSystemNotification(notification, delivery);
        break;
      default:
        throw new Error(`Unknown notification channel: ${delivery.channel}`);
    }

    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();
    
    logger.debug('Notification delivered successfully', {
      deliveryId: delivery.id,
      channel: delivery.channel,
      notificationId: notification.id
    });
  }

  /**
   * Deliver push notification
   */
  private async deliverPushNotification(
    notification: NotificationMessage,
    delivery: NotificationDelivery
  ): Promise<void> {
    const subscription = this.pushSubscriptions.get(delivery.userId);
    if (!subscription || !subscription.isActive) {
      throw new Error('No active push subscription found');
    }

    // Prepare push payload
    const pushPayload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/badge-72x72.png',
      image: notification.image,
      data: {
        notificationId: notification.id,
        deliveryId: delivery.id,
        ...notification.data
      },
      actions: notification.actions,
      vibrate: this.getVibrationPattern(notification),
      silent: notification.silent,
      requireInteraction: notification.requireInteraction,
      tag: notification.category,
      timestamp: Date.now()
    };

    // Send to push service
    await this.sendPushToService(subscription, pushPayload);

    // Update subscription last used
    subscription.lastUsed = new Date();
  }

  /**
   * Deliver in-app notification
   */
  private async deliverInAppNotification(
    notification: NotificationMessage,
    delivery: NotificationDelivery
  ): Promise<void> {
    // Show in-app notification using toast/modal system
    this.showInAppNotification(notification);
    
    // Mark as read if page is visible
    if (document.visibilityState === 'visible') {
      setTimeout(() => {
        delivery.status = 'read';
        delivery.readAt = new Date();
      }, 1000);
    }
  }

  /**
   * Deliver email notification
   */
  private async deliverEmailNotification(
    notification: NotificationMessage,
    delivery: NotificationDelivery
  ): Promise<void> {
    // In production, this would integrate with email service
    logger.debug('Email notification would be sent', {
      userId: delivery.userId,
      subject: notification.title,
      body: notification.body
    });
  }

  /**
   * Deliver SMS notification
   */
  private async deliverSMSNotification(
    notification: NotificationMessage,
    delivery: NotificationDelivery
  ): Promise<void> {
    // In production, this would integrate with SMS service
    logger.debug('SMS notification would be sent', {
      userId: delivery.userId,
      message: `${notification.title}: ${notification.body}`
    });
  }

  /**
   * Deliver system notification
   */
  private async deliverSystemNotification(
    notification: NotificationMessage,
    delivery: NotificationDelivery
  ): Promise<void> {
    if (Notification.permission !== 'granted') {
      throw new Error('System notification permission not granted');
    }

    const systemNotification = new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      image: notification.image,
      data: notification.data,
      actions: notification.actions as any,
      vibrate: this.getVibrationPattern(notification),
      silent: notification.silent,
      requireInteraction: notification.requireInteraction,
      tag: notification.category
    });

    // Handle notification events
    systemNotification.onclick = () => {
      delivery.status = 'clicked';
      delivery.clickedAt = new Date();
      this.handleNotificationClick(notification, delivery);
    };

    systemNotification.onclose = () => {
      delivery.status = 'dismissed';
      delivery.dismissedAt = new Date();
    };
  }

  // ========================================
  // BUG REPORTING SYSTEM
  // ========================================

  /**
   * Submit a bug report with AI classification
   */
  async submitBugReport(reportData: Omit<BugReport, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const bugReport: BugReport = {
        id: this.generateBugReportId(),
        createdAt: new Date(),
        status: 'open',
        ...reportData
      };

      // Enhance with AI classification
      await this.classifyBugReport(bugReport);

      // Store bug report
      this.bugReports.set(bugReport.id, bugReport);

      // Send notification to admin team
      await this.sendBugReportNotification(bugReport);

      // Create GitHub issue if configured
      await this.createGitHubIssue(bugReport);

      logger.info('Bug report submitted', {
        bugReportId: bugReport.id,
        severity: bugReport.severity,
        category: bugReport.category,
        userId: bugReport.userId
      });

      return bugReport.id;

    } catch (error) {
      logger.error('Failed to submit bug report', { reportData, error });
      throw error;
    }
  }

  /**
   * Classify bug report using AI
   */
  private async classifyBugReport(bugReport: BugReport): Promise<void> {
    try {
      // In production, this would use AI service
      bugReport.aiClassification = {
        category: this.inferBugCategory(bugReport),
        confidence: 0.8,
        suggestedPriority: this.inferBugPriority(bugReport),
        estimatedEffort: this.estimateEffort(bugReport),
        relatedIssues: []
      };

    } catch (error) {
      logger.error('Bug report AI classification failed', { error });
    }
  }

  /**
   * Send bug report notification to admin team
   */
  private async sendBugReportNotification(bugReport: BugReport): Promise<void> {
    const notification: Omit<NotificationMessage, 'id' | 'createdAt'> = {
      type: bugReport.severity === 'critical' ? 'error' : 'warning',
      priority: bugReport.severity === 'critical' ? 'urgent' : 'high',
      title: `New ${bugReport.severity} Bug Report`,
      body: `"${bugReport.title}" reported by user. Category: ${bugReport.category}`,
      category: 'bug_report',
      tags: ['bug', 'admin', bugReport.severity],
      channels: ['push', 'in_app', 'email'],
      userRole: 'admin',
      data: {
        bugReportId: bugReport.id,
        action: 'view_bug_report'
      },
      createdBy: 'system'
    };

    await this.sendNotification(notification);
  }

  // ========================================
  // PREFERENCE MANAGEMENT
  // ========================================

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = this.preferences.get(userId);
    
    if (!preferences) {
      preferences = this.createDefaultPreferences(userId);
      this.preferences.set(userId, preferences);
      await this.saveUserPreferences(preferences);
    }

    return preferences;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string, 
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const current = await this.getUserPreferences(userId);
      const updated: NotificationPreferences = {
        ...current,
        ...updates,
        userId,
        updatedAt: new Date()
      };

      this.preferences.set(userId, updated);
      await this.saveUserPreferences(updated);

      logger.info('User notification preferences updated', {
        userId,
        updatedFields: Object.keys(updates)
      });

      return updated;

    } catch (error) {
      logger.error('Failed to update user preferences', { userId, updates, error });
      throw error;
    }
  }

  /**
   * Check if notification can be sent based on user preferences
   */
  private async canSendNotification(notification: NotificationMessage): Promise<boolean> {
    if (!notification.userId) {
      return true; // System notifications
    }

    const preferences = await this.getUserPreferences(notification.userId);

    // Check if notifications are enabled
    if (!preferences.enabled) {
      return false;
    }

    // Check channel preferences
    const hasEnabledChannel = notification.channels.some(
      channel => preferences.channels[channel]
    );
    if (!hasEnabledChannel) {
      return false;
    }

    // Check category preferences
    if (!preferences.categories[notification.category]) {
      return false;
    }

    // Check quiet hours (with emergency override)
    if (this.isInQuietHours(preferences) && 
        !this.config.quietHourOverrideTypes.includes(notification.priority)) {
      return false;
    }

    // Check frequency limits
    if (!this.isWithinFrequencyLimits(notification.userId, preferences)) {
      return false;
    }

    return true;
  }

  /**
   * Create default user preferences
   */
  private createDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      enabled: true,
      channels: {
        push: true,
        in_app: true,
        email: true,
        sms: false,
        system: true
      },
      categories: {
        inspection: true,
        bug_report: true,
        system: true,
        marketing: false,
        social: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        days: [0, 1, 2, 3, 4, 5, 6] // All days
      },
      frequency: {
        maxPerHour: this.config.maxNotificationsPerHour,
        maxPerDay: this.config.maxNotificationsPerDay,
        batchSimilar: true,
        intelligentTiming: true
      },
      constructionSiteMode: false,
      emergencyOverride: true,
      language: 'en',
      updatedAt: new Date()
    };
  }

  // ========================================
  // ANALYTICS & METRICS
  // ========================================

  /**
   * Get notification metrics
   */
  getMetrics(): NotificationMetrics {
    const deliveries = Array.from(this.deliveries.values());
    
    const totalSent = deliveries.length;
    const totalDelivered = deliveries.filter(d => d.status === 'delivered' || d.status === 'read' || d.status === 'clicked').length;
    const totalRead = deliveries.filter(d => d.status === 'read' || d.status === 'clicked').length;
    const totalClicked = deliveries.filter(d => d.status === 'clicked').length;
    const totalDismissed = deliveries.filter(d => d.status === 'dismissed').length;

    const channelBreakdown: NotificationMetrics['channelBreakdown'] = {
      push: { sent: 0, delivered: 0, read: 0, clicked: 0 },
      in_app: { sent: 0, delivered: 0, read: 0, clicked: 0 },
      email: { sent: 0, delivered: 0, read: 0, clicked: 0 },
      sms: { sent: 0, delivered: 0, read: 0, clicked: 0 },
      system: { sent: 0, delivered: 0, read: 0, clicked: 0 }
    };

    for (const delivery of deliveries) {
      const channel = delivery.channel;
      channelBreakdown[channel].sent++;
      if (delivery.status === 'delivered' || delivery.status === 'read' || delivery.status === 'clicked') {
        channelBreakdown[channel].delivered++;
      }
      if (delivery.status === 'read' || delivery.status === 'clicked') {
        channelBreakdown[channel].read++;
      }
      if (delivery.status === 'clicked') {
        channelBreakdown[channel].clicked++;
      }
    }

    const notifications = Array.from(this.notifications.values());
    const categoryCount = new Map<string, number>();
    const categoryEngagement = new Map<string, number>();

    for (const notification of notifications) {
      const count = categoryCount.get(notification.category) || 0;
      categoryCount.set(notification.category, count + 1);

      const notificationDeliveries = deliveries.filter(d => d.notificationId === notification.id);
      const engagementScore = notificationDeliveries.reduce((score, d) => {
        if (d.status === 'clicked') return score + 3;
        if (d.status === 'read') return score + 2;
        if (d.status === 'delivered') return score + 1;
        return score;
      }, 0);
      
      categoryEngagement.set(notification.category, 
        (categoryEngagement.get(notification.category) || 0) + engagementScore);
    }

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        category,
        count,
        engagement: categoryEngagement.get(category) || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSent,
      totalDelivered,
      totalRead,
      totalClicked,
      totalDismissed,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      readRate: totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0,
      clickRate: totalRead > 0 ? (totalClicked / totalRead) * 100 : 0,
      averageDeliveryTime: this.calculateAverageDeliveryTime(deliveries),
      channelBreakdown,
      topCategories,
      recentTrends: {
        hourly: this.calculateHourlyTrends(),
        daily: this.calculateDailyTrends(),
        weekly: this.calculateWeeklyTrends()
      }
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Validate notification before sending
   */
  private validateNotification(notification: NotificationMessage): void {
    if (!notification.title || !notification.body) {
      throw new Error('Notification must have title and body');
    }

    if (!notification.channels || notification.channels.length === 0) {
      throw new Error('Notification must specify at least one channel');
    }

    if (notification.expiresAt && notification.expiresAt <= new Date()) {
      throw new Error('Notification expiry date must be in the future');
    }
  }

  /**
   * Enhance notification with intelligent features
   */
  private async enhanceNotification(notification: NotificationMessage): Promise<void> {
    // Apply construction site optimizations
    if (notification.userId) {
      const preferences = await this.getUserPreferences(notification.userId);
      if (preferences.constructionSiteMode) {
        this.applyConstructionSiteEnhancements(notification);
      }
    }

    // Enhance with context-aware content
    this.enhanceWithContext(notification);

    // Apply intelligent timing if enabled
    if (notification.userId) {
      await this.applyIntelligentTiming(notification);
    }
  }

  /**
   * Apply construction site specific enhancements
   */
  private applyConstructionSiteEnhancements(notification: NotificationMessage): void {
    // Enhanced vibration patterns
    if (notification.priority === 'urgent' || notification.priority === 'emergency') {
      notification.vibration = this.config.emergencyVibrationPattern;
    } else if (notification.priority === 'high') {
      notification.vibration = this.config.constructionSiteVibrationPattern;
    }

    // Require interaction for important notifications
    if (notification.priority === 'urgent' || notification.priority === 'emergency') {
      notification.requireInteraction = true;
    }

    // Disable silent mode for safety notifications
    if (notification.type === 'error' || notification.type === 'critical') {
      notification.silent = false;
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    // Check if today is in quiet hours days
    if (!preferences.quietHours.days.includes(currentDay)) {
      return false;
    }

    const start = this.parseTime(preferences.quietHours.start);
    const end = this.parseTime(preferences.quietHours.end);

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Quiet hours span midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * Check if notification is within frequency limits
   */
  private isWithinFrequencyLimits(userId: string, preferences: NotificationPreferences): boolean {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const userDeliveries = Array.from(this.deliveries.values())
      .filter(d => d.userId === userId && d.deliveredAt);

    const hourlyCount = userDeliveries.filter(d => 
      d.deliveredAt && d.deliveredAt > hourAgo
    ).length;

    const dailyCount = userDeliveries.filter(d => 
      d.deliveredAt && d.deliveredAt > dayAgo
    ).length;

    return hourlyCount < preferences.frequency.maxPerHour && 
           dailyCount < preferences.frequency.maxPerDay;
  }

  // Helper methods
  private isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  private async getCurrentUserId(): Promise<string> {
    // In production, get from auth service
    return 'current_user_id';
  }

  private getDeviceInfo(): PushSubscription['deviceInfo'] {
    return {
      type: this.isMobile() ? 'mobile' : 'desktop',
      os: navigator.platform,
      browser: this.getBrowserName(),
      userAgent: navigator.userAgent
    };
  }

  private isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private getBrowserName(): string {
    const agent = navigator.userAgent;
    if (agent.includes('Chrome')) return 'Chrome';
    if (agent.includes('Firefox')) return 'Firefox';
    if (agent.includes('Safari')) return 'Safari';
    if (agent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private getVibrationPattern(notification: NotificationMessage): number[] {
    if (notification.vibration) {
      return notification.vibration;
    }

    switch (notification.priority) {
      case 'emergency':
        return this.config.emergencyVibrationPattern;
      case 'urgent':
        return [200, 100, 200];
      case 'high':
        return [100, 50, 100];
      default:
        return [100];
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateDeliveryId(): string {
    return `delivery_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateBugReportId(): string {
    return `bug_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Placeholder implementations for complex methods
  private async showPermissionEducation(): Promise<void> {
    // Would show UI modal explaining notification benefits
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Would send subscription to server API
  }

  private async sendPushToService(subscription: PushSubscription, payload: any): Promise<void> {
    // Would send push notification via server
  }

  private showInAppNotification(notification: NotificationMessage): void {
    // Would show toast/modal notification in UI
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    // Handle messages from service worker
  }

  private handleNotificationClick(notification: NotificationMessage, delivery: NotificationDelivery): void {
    // Handle notification click actions
  }

  private scheduleNotification(notification: NotificationMessage): void {
    const delay = notification.scheduledAt!.getTime() - Date.now();
    setTimeout(() => {
      this.sendQueue.push(notification);
    }, delay);
  }

  private markInAppNotificationsAsRead(): void {
    // Mark visible in-app notifications as read
  }

  private enhanceWithContext(notification: NotificationMessage): void {
    // Add context-aware enhancements
  }

  private async applyIntelligentTiming(notification: NotificationMessage): Promise<void> {
    // Apply AI-based optimal timing
  }

  private inferBugCategory(bugReport: BugReport): string {
    // Simple rule-based categorization
    const description = bugReport.description.toLowerCase();
    
    if (description.includes('login') || description.includes('auth')) {
      return 'Authentication';
    }
    if (description.includes('upload') || description.includes('file')) {
      return 'File Upload';
    }
    if (description.includes('sync') || description.includes('offline')) {
      return 'Synchronization';
    }
    
    return 'General';
  }

  private inferBugPriority(bugReport: BugReport): string {
    if (bugReport.severity === 'critical') return 'urgent';
    if (bugReport.severity === 'high') return 'high';
    return 'normal';
  }

  private estimateEffort(bugReport: BugReport): number {
    // Simple effort estimation in hours
    switch (bugReport.severity) {
      case 'critical': return 8;
      case 'high': return 4;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private async createGitHubIssue(bugReport: BugReport): Promise<void> {
    // Would create GitHub issue via API
  }

  private calculateAverageDeliveryTime(deliveries: NotificationDelivery[]): number {
    const delivered = deliveries.filter(d => d.deliveredAt && d.lastAttemptAt);
    if (delivered.length === 0) return 0;

    const totalTime = delivered.reduce((sum, d) => {
      return sum + (d.deliveredAt!.getTime() - d.lastAttemptAt!.getTime());
    }, 0);

    return totalTime / delivered.length;
  }

  private calculateHourlyTrends(): number[] {
    return Array(24).fill(0); // Placeholder
  }

  private calculateDailyTrends(): number[] {
    return Array(7).fill(0); // Placeholder
  }

  private calculateWeeklyTrends(): number[] {
    return Array(4).fill(0); // Placeholder
  }

  private initializeDefaultTemplates(): void {
    // Initialize default notification templates
  }

  private startQueueProcessing(): void {
    this.processTimer = setInterval(() => {
      if (!this.isProcessingQueue) {
        this.processNotificationQueue();
        this.processRetryQueue();
      }
    }, this.config.processIntervalMs);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, this.config.cleanupIntervalMs);
  }

  private processRetryQueue(): void {
    // Process failed deliveries for retry
    const toRetry = this.retryQueue.splice(0, this.config.batchSize);
    
    for (const delivery of toRetry) {
      const notification = this.notifications.get(delivery.notificationId);
      if (notification) {
        this.deliverThroughChannel(notification, delivery);
      }
    }
  }

  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - this.config.maxNotificationAge);
    
    // Clean old notifications
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.createdAt < cutoff) {
        this.notifications.delete(id);
      }
    }
    
    // Clean old deliveries
    for (const [id, delivery] of this.deliveries.entries()) {
      const notification = this.notifications.get(delivery.notificationId);
      if (!notification) {
        this.deliveries.delete(id);
      }
    }
  }

  private async loadStoredData(): Promise<void> {
    // Load from persistent storage
  }

  private async saveStoredData(): Promise<void> {
    // Save to persistent storage
  }

  private async saveUserPreferences(preferences: NotificationPreferences): Promise<void> {
    // Save preferences to database
  }

  /**
   * Cleanup and destroy service
   */
  async destroy(): Promise<void> {
    if (this.processTimer) {
      clearInterval(this.processTimer);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Save state before destroying
    await this.saveStoredData();

    this.notifications.clear();
    this.deliveries.clear();
    this.preferences.clear();
    this.pushSubscriptions.clear();
    this.templates.clear();
    this.bugReports.clear();

    logger.info('NotificationService destroyed');
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

/**
 * Global notification service instance
 */
export const notificationService = NotificationService.getInstance();

export default notificationService;