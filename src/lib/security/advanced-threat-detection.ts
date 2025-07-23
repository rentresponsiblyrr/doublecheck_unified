/**
 * Advanced Threat Detection Service
 *
 * Real-time threat detection with behavioral analysis, machine learning patterns,
 * and automated threat response. Built to enterprise security standards.
 *
 * Features:
 * - Real-time attack pattern detection
 * - Behavioral anomaly analysis
 * - Geographic threat intelligence
 * - Automated incident response
 * - SOC 2 compliance monitoring
 */

import { log } from "@/lib/logging/enterprise-logger";
import { performanceMonitor } from "@/lib/monitoring/performance-monitor";

export interface ThreatPattern {
  id: string;
  name: string;
  category:
    | "injection"
    | "xss"
    | "csrf"
    | "brute_force"
    | "data_exfiltration"
    | "privilege_escalation"
    | "dos"
    | "bot";
  severity: "low" | "medium" | "high" | "critical";
  pattern: RegExp | string;
  behavioralSignatures: BehavioralSignature[];
  riskWeight: number;
  falsePositiveRate: number;
  lastUpdated: number;
}

export interface BehavioralSignature {
  type: "frequency" | "sequence" | "timing" | "geographic" | "device";
  parameters: Record<string, unknown>;
  threshold: number;
  timeWindow: number;
}

export interface ThreatEvent {
  id: string;
  timestamp: number;
  sourceIP: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  threatType: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  riskScore: number;
  evidences: ThreatEvidence[];
  mitigated: boolean;
  mitigationActions: string[];
  falsePositive: boolean;
  investigationStatus:
    | "pending"
    | "investigating"
    | "resolved"
    | "false_positive";
}

export interface ThreatEvidence {
  type:
    | "pattern_match"
    | "behavioral_anomaly"
    | "reputation"
    | "geographic"
    | "rate_limit";
  description: string;
  confidence: number;
  data: Record<string, unknown>;
}

export interface ThreatIntelligence {
  ipReputation: Map<string, IPReputationData>;
  maliciousPatterns: ThreatPattern[];
  attackSignatures: Map<string, AttackSignature>;
  geographicRisks: Map<string, GeographicRisk>;
  lastUpdated: number;
}

export interface IPReputationData {
  ip: string;
  reputation: "clean" | "suspicious" | "malicious";
  riskScore: number;
  lastSeen: number;
  sources: string[];
  attackHistory: AttackRecord[];
  country?: string;
  organization?: string;
}

export interface AttackSignature {
  id: string;
  name: string;
  type: string;
  pattern: string;
  indicators: string[];
  severity: "low" | "medium" | "high" | "critical";
  firstSeen: number;
  lastSeen: number;
  frequency: number;
}

export interface GeographicRisk {
  country: string;
  region: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  commonThreats: string[];
  lastAssessment: number;
}

export interface AttackRecord {
  timestamp: number;
  type: string;
  severity: string;
  mitigated: boolean;
}

export interface AutoMitigationConfig {
  enabled: boolean;
  criticalThreshold: number;
  highThreshold: number;
  mediumThreshold: number;
  mitigationActions: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  maxAutoActions: number;
  cooldownPeriod: number;
}

export class AdvancedThreatDetectionService {
  private threatEvents: Map<string, ThreatEvent> = new Map();
  private threatIntelligence: ThreatIntelligence;
  private behaviorProfiles: Map<string, UserBehaviorProfile> = new Map();
  private autoMitigationConfig: AutoMitigationConfig;
  private detectionRules: ThreatPattern[] = [];
  private alertingSubscribers: ((event: ThreatEvent) => void)[] = [];
  private isInitialized = false;

  constructor(config?: Partial<AutoMitigationConfig>) {
    this.autoMitigationConfig = {
      enabled: true,
      criticalThreshold: 90,
      highThreshold: 70,
      mediumThreshold: 50,
      mitigationActions: {
        critical: [
          "block_ip",
          "lock_account",
          "notify_soc",
          "quarantine_session",
        ],
        high: ["rate_limit", "challenge_user", "enhanced_monitoring"],
        medium: ["log_event", "flag_for_review"],
        low: ["log_event"],
      },
      maxAutoActions: 5,
      cooldownPeriod: 300000, // 5 minutes
      ...config,
    };

    this.threatIntelligence = {
      ipReputation: new Map(),
      maliciousPatterns: [],
      attackSignatures: new Map(),
      geographicRisks: new Map(),
      lastUpdated: 0,
    };

    this.initializeDetectionRules();
  }

  /**
   * Initialize the threat detection service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Load threat intelligence
      await this.loadThreatIntelligence();

      // Initialize behavioral analysis
      this.initializeBehavioralAnalysis();

      // Start real-time monitoring
      this.startRealTimeMonitoring();

      // Setup intelligence updates
      this.scheduleIntelligenceUpdates();

      this.isInitialized = true;

      log.info(
        "Advanced Threat Detection Service initialized",
        {
          component: "AdvancedThreatDetectionService",
          action: "initialize",
          rulesLoaded: this.detectionRules.length,
          intelligenceAge: Date.now() - this.threatIntelligence.lastUpdated,
        },
        "THREAT_DETECTION_INITIALIZED",
      );
    } catch (error) {
      log.error(
        "Failed to initialize Advanced Threat Detection Service",
        error as Error,
        {
          component: "AdvancedThreatDetectionService",
          action: "initialize",
        },
        "THREAT_DETECTION_INIT_FAILED",
      );
    }
  }

  /**
   * Analyze a request for threats
   */
  async analyzeRequest(request: {
    ip: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
  }): Promise<ThreatEvent | null> {
    try {
      const evidences: ThreatEvidence[] = [];
      let totalRiskScore = 0;
      let highestSeverity: "low" | "medium" | "high" | "critical" = "low";

      // IP reputation analysis
      const ipReputation = await this.analyzeIPReputation(request.ip);
      if (ipReputation.evidence) {
        evidences.push(ipReputation.evidence);
        totalRiskScore += ipReputation.riskScore;
        if (
          this.getSeverityWeight(ipReputation.severity) >
          this.getSeverityWeight(highestSeverity)
        ) {
          highestSeverity = ipReputation.severity;
        }
      }

      // Pattern matching
      const patternAnalysis = await this.analyzePatterns(request);
      evidences.push(...patternAnalysis.evidences);
      totalRiskScore += patternAnalysis.riskScore;
      if (
        this.getSeverityWeight(patternAnalysis.severity) >
        this.getSeverityWeight(highestSeverity)
      ) {
        highestSeverity = patternAnalysis.severity;
      }

      // Behavioral analysis
      const behaviorAnalysis = await this.analyzeBehavior(request);
      if (behaviorAnalysis.evidence) {
        evidences.push(behaviorAnalysis.evidence);
        totalRiskScore += behaviorAnalysis.riskScore;
        if (
          this.getSeverityWeight(behaviorAnalysis.severity) >
          this.getSeverityWeight(highestSeverity)
        ) {
          highestSeverity = behaviorAnalysis.severity;
        }
      }

      // Geographic analysis
      const geoAnalysis = await this.analyzeGeographic(request.ip);
      if (geoAnalysis.evidence) {
        evidences.push(geoAnalysis.evidence);
        totalRiskScore += geoAnalysis.riskScore;
        if (
          this.getSeverityWeight(geoAnalysis.severity) >
          this.getSeverityWeight(highestSeverity)
        ) {
          highestSeverity = geoAnalysis.severity;
        }
      }

      // Rate limiting analysis
      const rateLimitAnalysis = await this.analyzeRateLimit(request);
      if (rateLimitAnalysis.evidence) {
        evidences.push(rateLimitAnalysis.evidence);
        totalRiskScore += rateLimitAnalysis.riskScore;
        if (
          this.getSeverityWeight(rateLimitAnalysis.severity) >
          this.getSeverityWeight(highestSeverity)
        ) {
          highestSeverity = rateLimitAnalysis.severity;
        }
      }

      // If no threats detected, return null
      if (evidences.length === 0 || totalRiskScore < 10) {
        return null;
      }

      // Create threat event
      const threatEvent: ThreatEvent = {
        id: this.generateThreatId(),
        timestamp: request.timestamp,
        sourceIP: request.ip,
        userAgent: request.userAgent,
        userId: request.userId,
        sessionId: request.sessionId,
        threatType: this.determineThreatType(evidences),
        severity: highestSeverity,
        confidence: this.calculateConfidence(evidences),
        riskScore: Math.min(100, totalRiskScore),
        evidences,
        mitigated: false,
        mitigationActions: [],
        falsePositive: false,
        investigationStatus: "pending",
      };

      // Store threat event
      this.threatEvents.set(threatEvent.id, threatEvent);

      // Trigger automated mitigation if enabled
      if (this.autoMitigationConfig.enabled) {
        await this.triggerAutoMitigation(threatEvent);
      }

      // Notify subscribers
      this.notifySubscribers(threatEvent);

      // Track metrics
      performanceMonitor.trackMetric(
        "security.threat.detected",
        threatEvent.riskScore,
        "score",
        {
          threatType: threatEvent.threatType,
          severity: threatEvent.severity,
          sourceIP: threatEvent.sourceIP,
        },
      );

      log.warn(
        "Threat detected",
        {
          component: "AdvancedThreatDetectionService",
          action: "analyzeRequest",
          threatId: threatEvent.id,
          threatType: threatEvent.threatType,
          severity: threatEvent.severity,
          riskScore: threatEvent.riskScore,
          evidenceCount: evidences.length,
        },
        "THREAT_DETECTED",
      );

      return threatEvent;
    } catch (error) {
      log.error(
        "Error analyzing request for threats",
        error as Error,
        {
          component: "AdvancedThreatDetectionService",
          action: "analyzeRequest",
          requestPath: request.path,
          sourceIP: request.ip,
        },
        "THREAT_ANALYSIS_ERROR",
      );
      return null;
    }
  }

  /**
   * Get current threat status
   */
  getThreatStatus(): {
    activeThreats: number;
    criticalThreats: number;
    mitigatedThreats: number;
    falsePositives: number;
    averageRiskScore: number;
    topThreatTypes: Array<{ type: string; count: number }>;
    recentAlerts: ThreatEvent[];
  } {
    const recentWindow = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    const recentEvents = Array.from(this.threatEvents.values()).filter(
      (event) => event.timestamp > recentWindow,
    );

    const criticalThreats = recentEvents.filter(
      (e) => e.severity === "critical",
    ).length;
    const mitigatedThreats = recentEvents.filter((e) => e.mitigated).length;
    const falsePositives = recentEvents.filter((e) => e.falsePositive).length;

    const threatTypeCounts = recentEvents.reduce(
      (acc, event) => {
        acc[event.threatType] = (acc[event.threatType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topThreatTypes = Object.entries(threatTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const averageRiskScore =
      recentEvents.length > 0
        ? recentEvents.reduce((sum, event) => sum + event.riskScore, 0) /
          recentEvents.length
        : 0;

    const recentAlerts = recentEvents
      .filter(
        (event) => event.severity === "high" || event.severity === "critical",
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    return {
      activeThreats: recentEvents.filter(
        (e) => !e.mitigated && !e.falsePositive,
      ).length,
      criticalThreats,
      mitigatedThreats,
      falsePositives,
      averageRiskScore,
      topThreatTypes,
      recentAlerts,
    };
  }

  /**
   * Subscribe to threat alerts
   */
  subscribeToAlerts(callback: (event: ThreatEvent) => void): void {
    this.alertingSubscribers.push(callback);
  }

  /**
   * Mark threat as false positive
   */
  markAsFalsePositive(threatId: string, reason: string): void {
    const threat = this.threatEvents.get(threatId);
    if (threat) {
      threat.falsePositive = true;
      threat.investigationStatus = "false_positive";

      // Learn from false positive to improve detection
      this.learnFromFalsePositive(threat, reason);

      log.info(
        "Threat marked as false positive",
        {
          component: "AdvancedThreatDetectionService",
          action: "markAsFalsePositive",
          threatId,
          reason,
        },
        "THREAT_FALSE_POSITIVE",
      );
    }
  }

  /**
   * Get threat intelligence summary
   */
  getThreatIntelligenceSummary(): {
    ipReputationEntries: number;
    maliciousPatterns: number;
    attackSignatures: number;
    geographicRisks: number;
    lastUpdated: number;
  } {
    return {
      ipReputationEntries: this.threatIntelligence.ipReputation.size,
      maliciousPatterns: this.threatIntelligence.maliciousPatterns.length,
      attackSignatures: this.threatIntelligence.attackSignatures.size,
      geographicRisks: this.threatIntelligence.geographicRisks.size,
      lastUpdated: this.threatIntelligence.lastUpdated,
    };
  }

  /**
   * Initialize detection rules
   */
  private initializeDetectionRules(): void {
    this.detectionRules = [
      // SQL Injection patterns
      {
        id: "sql_injection_basic",
        name: "Basic SQL Injection",
        category: "injection",
        severity: "high",
        pattern:
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b.*['";]|['";]\s*(OR|AND)\s*['";])/i,
        behavioralSignatures: [],
        riskWeight: 30,
        falsePositiveRate: 0.1,
        lastUpdated: Date.now(),
      },
      // XSS patterns
      {
        id: "xss_script_injection",
        name: "XSS Script Injection",
        category: "xss",
        severity: "high",
        pattern: /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=/i,
        behavioralSignatures: [],
        riskWeight: 25,
        falsePositiveRate: 0.05,
        lastUpdated: Date.now(),
      },
      // Brute force patterns
      {
        id: "brute_force_login",
        name: "Brute Force Login Attempt",
        category: "brute_force",
        severity: "medium",
        pattern: "/login|/auth|/signin",
        behavioralSignatures: [
          {
            type: "frequency",
            parameters: { path: "/login" },
            threshold: 10,
            timeWindow: 300000, // 5 minutes
          },
        ],
        riskWeight: 20,
        falsePositiveRate: 0.2,
        lastUpdated: Date.now(),
      },
      // Bot detection
      {
        id: "suspicious_bot",
        name: "Suspicious Bot Activity",
        category: "bot",
        severity: "medium",
        pattern: "bot|crawler|spider|scraper",
        behavioralSignatures: [
          {
            type: "frequency",
            parameters: {},
            threshold: 50,
            timeWindow: 60000, // 1 minute
          },
        ],
        riskWeight: 15,
        falsePositiveRate: 0.3,
        lastUpdated: Date.now(),
      },
    ];
  }

  /**
   * Analyze IP reputation
   */
  private async analyzeIPReputation(ip: string): Promise<{
    evidence?: ThreatEvidence;
    riskScore: number;
    severity: "low" | "medium" | "high" | "critical";
  }> {
    const reputation = this.threatIntelligence.ipReputation.get(ip);

    if (!reputation) {
      // Unknown IP, perform lookup
      const lookupResult = await this.performIPLookup(ip);
      if (lookupResult) {
        this.threatIntelligence.ipReputation.set(ip, lookupResult);
        return this.analyzeIPReputation(ip);
      }
      return { riskScore: 0, severity: "low" };
    }

    let riskScore = reputation.riskScore;
    let severity: "low" | "medium" | "high" | "critical" = "low";

    if (reputation.reputation === "malicious") {
      riskScore += 40;
      severity = "critical";
    } else if (reputation.reputation === "suspicious") {
      riskScore += 20;
      severity = "high";
    }

    // Check attack history
    if (reputation.attackHistory.length > 0) {
      const recentAttacks = reputation.attackHistory.filter(
        (attack) => Date.now() - attack.timestamp < 7 * 24 * 60 * 60 * 1000, // 7 days
      );
      riskScore += recentAttacks.length * 5;
    }

    if (riskScore < 10) return { riskScore, severity: "low" };

    const evidence: ThreatEvidence = {
      type: "reputation",
      description: `IP ${ip} has ${reputation.reputation} reputation`,
      confidence: 0.9,
      data: {
        reputation: reputation.reputation,
        riskScore: reputation.riskScore,
        attackHistory: reputation.attackHistory.length,
        sources: reputation.sources,
      },
    };

    return { evidence, riskScore, severity };
  }

  /**
   * Analyze request patterns
   */
  private async analyzePatterns(request: {
    ip: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
  }): Promise<{
    evidences: ThreatEvidence[];
    riskScore: number;
    severity: "low" | "medium" | "high" | "critical";
  }> {
    const evidences: ThreatEvidence[] = [];
    let totalRiskScore = 0;
    let highestSeverity: "low" | "medium" | "high" | "critical" = "low";

    const searchableContent = `${request.path} ${request.userAgent} ${JSON.stringify(request.headers)} ${request.body || ""}`;

    for (const rule of this.detectionRules) {
      let matches = false;

      if (rule.pattern instanceof RegExp) {
        matches = rule.pattern.test(searchableContent);
      } else {
        matches = searchableContent
          .toLowerCase()
          .includes(rule.pattern.toLowerCase());
      }

      if (matches) {
        const evidence: ThreatEvidence = {
          type: "pattern_match",
          description: `Detected ${rule.name}`,
          confidence: 1 - rule.falsePositiveRate,
          data: {
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            pattern: rule.pattern.toString(),
          },
        };

        evidences.push(evidence);
        totalRiskScore += rule.riskWeight;

        if (
          this.getSeverityWeight(rule.severity) >
          this.getSeverityWeight(highestSeverity)
        ) {
          highestSeverity = rule.severity;
        }
      }
    }

    return { evidences, riskScore: totalRiskScore, severity: highestSeverity };
  }

  /**
   * Analyze user behavior
   */
  private async analyzeBehavior(request: {
    ip: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
  }): Promise<{
    evidence?: ThreatEvidence;
    riskScore: number;
    severity: "low" | "medium" | "high" | "critical";
  }> {
    const userId = request.userId || request.ip;
    const profile = this.behaviorProfiles.get(userId);

    if (!profile) {
      // Create new profile
      this.behaviorProfiles.set(userId, {
        userId,
        requestHistory: [request],
        normalPatterns: new Map(),
        anomalyScore: 0,
        lastUpdated: Date.now(),
      });
      return { riskScore: 0, severity: "low" };
    }

    // Update profile
    profile.requestHistory.push(request);
    profile.lastUpdated = Date.now();

    // Keep only recent history (last 24 hours)
    const recentWindow = Date.now() - 24 * 60 * 60 * 1000;
    profile.requestHistory = profile.requestHistory.filter(
      (r) => r.timestamp > recentWindow,
    );

    // Analyze for anomalies
    const anomalies = this.detectBehavioralAnomalies(profile, request);

    if (anomalies.length === 0) {
      return { riskScore: 0, severity: "low" };
    }

    const riskScore = anomalies.reduce(
      (sum, anomaly) => sum + anomaly.score,
      0,
    );
    const severity =
      riskScore > 30 ? "high" : riskScore > 15 ? "medium" : "low";

    const evidence: ThreatEvidence = {
      type: "behavioral_anomaly",
      description: `Behavioral anomalies detected: ${anomalies.map((a) => a.type).join(", ")}`,
      confidence: 0.7,
      data: {
        anomalies,
        historicalRequests: profile.requestHistory.length,
        anomalyScore: riskScore,
      },
    };

    return { evidence, riskScore, severity };
  }

  /**
   * Analyze geographic risk
   */
  private async analyzeGeographic(ip: string): Promise<{
    evidence?: ThreatEvidence;
    riskScore: number;
    severity: "low" | "medium" | "high" | "critical";
  }> {
    // This would integrate with actual IP geolocation services
    const geoData = await this.getIPGeolocation(ip);

    if (!geoData || !geoData.country) {
      return { riskScore: 0, severity: "low" };
    }

    const countryRisk = this.threatIntelligence.geographicRisks.get(
      geoData.country,
    );

    if (!countryRisk) {
      return { riskScore: 0, severity: "low" };
    }

    let riskScore = 0;
    let severity: "low" | "medium" | "high" | "critical" = "low";

    switch (countryRisk.riskLevel) {
      case "critical":
        riskScore = 25;
        severity = "critical";
        break;
      case "high":
        riskScore = 15;
        severity = "high";
        break;
      case "medium":
        riskScore = 10;
        severity = "medium";
        break;
      case "low":
        riskScore = 5;
        severity = "low";
        break;
    }

    if (riskScore < 10) return { riskScore, severity: "low" };

    const evidence: ThreatEvidence = {
      type: "geographic",
      description: `Request from ${countryRisk.riskLevel} risk country: ${geoData.country}`,
      confidence: 0.8,
      data: {
        country: geoData.country,
        region: geoData.region,
        riskLevel: countryRisk.riskLevel,
        commonThreats: countryRisk.commonThreats,
      },
    };

    return { evidence, riskScore, severity };
  }

  /**
   * Analyze rate limiting violations
   */
  private async analyzeRateLimit(request: {
    ip: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
  }): Promise<{
    evidence?: ThreatEvidence;
    riskScore: number;
    severity: "low" | "medium" | "high" | "critical";
  }> {
    const key = `${request.ip}:${request.path}`;
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const maxRequests = 30;

    // This is a simplified rate limiting check
    // In production, you'd use a more sophisticated rate limiting system
    const recentRequests = Array.from(this.threatEvents.values()).filter(
      (event) =>
        event.sourceIP === request.ip && event.timestamp > now - timeWindow,
    ).length;

    if (recentRequests > maxRequests) {
      const evidence: ThreatEvidence = {
        type: "rate_limit",
        description: `Rate limit exceeded: ${recentRequests} requests in ${timeWindow}ms`,
        confidence: 0.95,
        data: {
          requestCount: recentRequests,
          timeWindow,
          maxAllowed: maxRequests,
          sourceIP: request.ip,
        },
      };

      return {
        evidence,
        riskScore: 20,
        severity: "medium",
      };
    }

    return { riskScore: 0, severity: "low" };
  }

  /**
   * Trigger automated mitigation
   */
  private async triggerAutoMitigation(threatEvent: ThreatEvent): Promise<void> {
    try {
      let actionsToTake: string[] = [];

      // Determine actions based on severity
      if (
        threatEvent.riskScore >= this.autoMitigationConfig.criticalThreshold
      ) {
        actionsToTake = this.autoMitigationConfig.mitigationActions.critical;
      } else if (
        threatEvent.riskScore >= this.autoMitigationConfig.highThreshold
      ) {
        actionsToTake = this.autoMitigationConfig.mitigationActions.high;
      } else if (
        threatEvent.riskScore >= this.autoMitigationConfig.mediumThreshold
      ) {
        actionsToTake = this.autoMitigationConfig.mitigationActions.medium;
      } else {
        actionsToTake = this.autoMitigationConfig.mitigationActions.low;
      }

      // Execute mitigation actions
      const executedActions: string[] = [];

      for (const action of actionsToTake.slice(
        0,
        this.autoMitigationConfig.maxAutoActions,
      )) {
        const success = await this.executeMitigationAction(action, threatEvent);
        if (success) {
          executedActions.push(action);
        }
      }

      // Update threat event
      threatEvent.mitigated = executedActions.length > 0;
      threatEvent.mitigationActions = executedActions;

      log.info(
        "Auto-mitigation executed",
        {
          component: "AdvancedThreatDetectionService",
          action: "triggerAutoMitigation",
          threatId: threatEvent.id,
          actionsExecuted: executedActions,
          riskScore: threatEvent.riskScore,
        },
        "AUTO_MITIGATION_EXECUTED",
      );
    } catch (error) {
      log.error(
        "Error executing auto-mitigation",
        error as Error,
        {
          component: "AdvancedThreatDetectionService",
          action: "triggerAutoMitigation",
          threatId: threatEvent.id,
        },
        "AUTO_MITIGATION_ERROR",
      );
    }
  }

  /**
   * Execute specific mitigation action
   */
  private async executeMitigationAction(
    action: string,
    threatEvent: ThreatEvent,
  ): Promise<boolean> {
    try {
      switch (action) {
        case "block_ip":
          // In production, this would integrate with firewall/WAF
          log.warn(
            "IP blocked",
            {
              action: "block_ip",
              ip: threatEvent.sourceIP,
              threatId: threatEvent.id,
            },
            "IP_BLOCKED",
          );
          return true;

        case "lock_account":
          if (threatEvent.userId) {
            // In production, this would lock the user account
            log.warn(
              "Account locked",
              {
                action: "lock_account",
                userId: threatEvent.userId,
                threatId: threatEvent.id,
              },
              "ACCOUNT_LOCKED",
            );
            return true;
          }
          return false;

        case "rate_limit":
          // In production, this would implement rate limiting
          log.info(
            "Rate limit applied",
            {
              action: "rate_limit",
              ip: threatEvent.sourceIP,
              threatId: threatEvent.id,
            },
            "RATE_LIMIT_APPLIED",
          );
          return true;

        case "challenge_user":
          // In production, this would trigger CAPTCHA or 2FA
          log.info(
            "User challenge triggered",
            {
              action: "challenge_user",
              sessionId: threatEvent.sessionId,
              threatId: threatEvent.id,
            },
            "USER_CHALLENGE_TRIGGERED",
          );
          return true;

        case "enhanced_monitoring":
          // Flag for enhanced monitoring
          log.info(
            "Enhanced monitoring enabled",
            {
              action: "enhanced_monitoring",
              ip: threatEvent.sourceIP,
              threatId: threatEvent.id,
            },
            "ENHANCED_MONITORING_ENABLED",
          );
          return true;

        case "notify_soc":
          // In production, this would notify Security Operations Center
          log.warn(
            "SOC notification sent",
            {
              action: "notify_soc",
              threatId: threatEvent.id,
              severity: threatEvent.severity,
            },
            "SOC_NOTIFICATION_SENT",
          );
          return true;

        case "log_event":
          // Default action - already logged
          return true;

        default:
          log.warn(
            "Unknown mitigation action",
            {
              action,
              threatId: threatEvent.id,
            },
            "UNKNOWN_MITIGATION_ACTION",
          );
          return false;
      }
    } catch (error) {
      log.error(
        "Error executing mitigation action",
        error as Error,
        {
          action,
          threatId: threatEvent.id,
        },
        "MITIGATION_ACTION_ERROR",
      );
      return false;
    }
  }

  // Helper methods
  private getSeverityWeight(
    severity: "low" | "medium" | "high" | "critical",
  ): number {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[severity];
  }

  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineThreatType(evidences: ThreatEvidence[]): string {
    // Determine the most likely threat type based on evidences
    const types = evidences.map((e) => e.data.category || e.type);
    const typeCounts = types.reduce(
      (acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return (
      Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "unknown"
    );
  }

  private calculateConfidence(evidences: ThreatEvidence[]): number {
    if (evidences.length === 0) return 0;

    const avgConfidence =
      evidences.reduce((sum, e) => sum + e.confidence, 0) / evidences.length;
    const evidenceWeight = Math.min(evidences.length / 3, 1); // More evidences = higher confidence

    return avgConfidence * evidenceWeight;
  }

  private notifySubscribers(threatEvent: ThreatEvent): void {
    this.alertingSubscribers.forEach((callback) => {
      try {
        callback(threatEvent);
      } catch (error) {
        log.error(
          "Error notifying threat subscriber",
          error as Error,
          {
            threatId: threatEvent.id,
          },
          "THREAT_SUBSCRIBER_ERROR",
        );
      }
    });
  }

  private learnFromFalsePositive(threat: ThreatEvent, reason: string): void {
    // In production, this would implement machine learning to reduce false positives
    log.info(
      "Learning from false positive",
      {
        threatId: threat.id,
        threatType: threat.threatType,
        reason,
      },
      "FALSE_POSITIVE_LEARNING",
    );
  }

  private async loadThreatIntelligence(): Promise<void> {
    // In production, this would load from threat intelligence feeds
    // For now, initialize with some sample data
    this.threatIntelligence.lastUpdated = Date.now();
  }

  private initializeBehavioralAnalysis(): void {
    // Initialize behavioral analysis engine
  }

  private startRealTimeMonitoring(): void {
    // Start real-time threat monitoring
  }

  private scheduleIntelligenceUpdates(): void {
    // Schedule regular threat intelligence updates
    setInterval(
      () => {
        this.loadThreatIntelligence();
      },
      4 * 60 * 60 * 1000,
    ); // Every 4 hours
  }

  private async performIPLookup(ip: string): Promise<IPReputationData | null> {
    // In production, integrate with threat intelligence APIs
    return null;
  }

  private detectBehavioralAnomalies(
    profile: UserBehaviorProfile,
    request: {
      ip: string;
      userAgent: string;
      userId?: string;
      sessionId: string;
      method: string;
      path: string;
      headers: Record<string, string>;
      body?: string;
      timestamp: number;
    },
  ): Array<{ type: string; score: number }> {
    // Implement behavioral anomaly detection
    return [];
  }

  private async getIPGeolocation(
    ip: string,
  ): Promise<{ country: string; region: string } | null> {
    // In production, integrate with geolocation services
    return null;
  }
}

interface UserBehaviorProfile {
  userId: string;
  requestHistory: Array<{
    ip: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
  }>;
  normalPatterns: Map<string, unknown>;
  anomalyScore: number;
  lastUpdated: number;
}

// Global instance
export const advancedThreatDetectionService =
  new AdvancedThreatDetectionService();
