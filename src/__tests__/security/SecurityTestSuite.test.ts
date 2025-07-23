/**
 * Enterprise-Grade Security Test Suite
 * Comprehensive security testing for STR Certified platform
 *
 * SECURITY TESTING AREAS:
 * - Input validation and sanitization
 * - File upload security
 * - Authentication and authorization
 * - Rate limiting and abuse prevention
 * - XSS and injection attack prevention
 * - PII protection and data scrubbing
 * - Worker security and integrity
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { InputValidator } from "../../lib/security/input-validation";
import { SecureFileHandler } from "../../lib/security/secure-file-handler";
import { SecureAuthManager } from "../../lib/security/secure-authentication";
import { PIIProtectionService } from "../../lib/security/pii-protection";
import {
  SecurityEvents,
  securityLogger,
} from "../../lib/security/security-audit-logger";
import { RateLimiter } from "../../lib/resilience/rate-limiter";
import { SecureWorkerManager } from "../../lib/workers/secure-worker-manager";

describe("Security Test Suite", () => {
  describe("Input Validation Security", () => {
    it("should block XSS attempts in property URLs", async () => {
      const maliciousUrl = 'javascript:alert("XSS")';

      expect(() => {
        InputValidator.validatePropertyUrl(maliciousUrl);
      }).toThrow("Invalid URL format");
    });

    it("should sanitize HTML content in user inputs", () => {
      const maliciousHTML = '<script>alert("XSS")</script><p>Safe content</p>';
      const sanitized = InputValidator.sanitizeHTML(maliciousHTML);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("<p>Safe content</p>");
    });

    it("should reject SQL injection attempts", () => {
      const sqlInjection = "'; DROP TABLE users; --";

      expect(() => {
        InputValidator.validateSearchQuery(sqlInjection);
      }).toThrow("Invalid characters detected");
    });

    it("should validate property URLs against allowlist", () => {
      const validUrl = "https://www.airbnb.com/rooms/12345";
      const invalidUrl = "https://malicious-site.com/fake-listing";

      expect(() => {
        InputValidator.validatePropertyUrl(validUrl);
      }).not.toThrow();

      expect(() => {
        InputValidator.validatePropertyUrl(invalidUrl);
      }).toThrow("Domain not allowed");
    });

    it("should enforce maximum input lengths", () => {
      const longInput = "a".repeat(10001);

      expect(() => {
        InputValidator.validateTextInput(longInput, { maxLength: 1000 });
      }).toThrow("Input too long");
    });
  });

  describe("File Upload Security", () => {
    it("should reject files with malicious extensions", async () => {
      const maliciousFile = new File(["malicious content"], "virus.exe", {
        type: "application/x-msdownload",
      });

      await expect(
        SecureFileHandler.validateFile(maliciousFile),
      ).rejects.toThrow("File type not allowed");
    });

    it("should detect file signature mismatches", async () => {
      // Create a file claiming to be JPEG but with PNG signature
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const fakeJpeg = new File([pngBytes], "fake.jpg", { type: "image/jpeg" });

      await expect(SecureFileHandler.validateFile(fakeJpeg)).rejects.toThrow(
        "File signature mismatch",
      );
    });

    it("should detect embedded malicious scripts in images", async () => {
      // Create file with embedded script tags
      const maliciousBytes = new Uint8Array([
        0xff,
        0xd8,
        0xff, // JPEG header
        ...Array.from('<script>alert("XSS")</script>').map((c) =>
          c.charCodeAt(0),
        ),
      ]);
      const maliciousImage = new File([maliciousBytes], "image.jpg", {
        type: "image/jpeg",
      });

      const result = await SecureFileHandler.validateFile(maliciousImage);
      expect(result.threats).toContain("MALICIOUS_PATTERN_DETECTED");
    });

    it("should enforce file size limits", async () => {
      const largeFile = new File(["x".repeat(100 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });

      await expect(SecureFileHandler.validateFile(largeFile)).rejects.toThrow(
        "File too large",
      );
    });

    it("should sanitize EXIF data from images", async () => {
      // Mock canvas and image for EXIF stripping test
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
        toBlob: vi.fn((callback) => {
          callback(new Blob(["sanitized"], { type: "image/jpeg" }));
        }),
      };

      global.document = {
        createElement: vi.fn(() => mockCanvas),
      } as any;

      const imageWithExif = new File(["fake jpeg"], "photo.jpg", {
        type: "image/jpeg",
      });
      const result = await SecureFileHandler.validateFile(imageWithExif);

      expect(result.sanitized).toBeDefined();
    });
  });

  describe("Authentication Security", () => {
    let authManager: SecureAuthManager;

    beforeEach(() => {
      authManager = new SecureAuthManager();
    });

    it("should detect and block brute force attacks", async () => {
      const userId = "test-user-123";

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        try {
          await authManager.validateSession({ id: userId });
        } catch (error) {
          // Expected to fail
        }
      }

      // Account should now be locked
      await expect(authManager.validateSession({ id: userId })).rejects.toThrow(
        "Account locked",
      );
    });

    it("should validate session token integrity", async () => {
      const invalidUser = {
        id: "user-123",
        session: { access_token: "invalid-token" },
      };

      await expect(authManager.validateSession(invalidUser)).rejects.toThrow(
        "Invalid session",
      );
    });

    it("should implement exponential backoff for failed attempts", async () => {
      const userId = "backoff-test-user";
      const startTime = Date.now();

      // Record multiple failures
      for (let i = 0; i < 3; i++) {
        try {
          await authManager.validateSession({ id: userId });
        } catch (error) {
          // Expected
        }
      }

      // Next attempt should have longer delay
      const lockoutInfo = authManager.getLockoutInfo(userId);
      expect(lockoutInfo.nextAttemptDelay).toBeGreaterThan(1000); // At least 1 second
    });
  });

  describe("Rate Limiting Security", () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowSizeMs: 60000, // 1 minute
        maxRequests: 5,
        blockDurationMs: 30000, // 30 seconds
        enableExponentialBackoff: true,
        enableSecurityLogging: true,
      });
    });

    afterEach(() => {
      rateLimiter.destroy();
    });

    it("should enforce rate limits per identifier", async () => {
      const identifier = "test-user";

      // Make maximum allowed requests
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.checkLimit(identifier);
        expect(result.allowed).toBe(true);
      }

      // Next request should be blocked
      const result = await rateLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
    });

    it("should implement exponential backoff for repeated violations", async () => {
      const identifier = "violator-user";

      // First violation
      for (let i = 0; i <= 5; i++) {
        await rateLimiter.checkLimit(identifier);
      }

      let result = await rateLimiter.checkLimit(identifier);
      const firstBlockTime = result.retryAfter!;

      // Wait for block to expire and violate again
      rateLimiter.reset(identifier);

      for (let i = 0; i <= 5; i++) {
        await rateLimiter.checkLimit(identifier);
      }

      result = await rateLimiter.checkLimit(identifier);
      const secondBlockTime = result.retryAfter!;

      expect(secondBlockTime).toBeGreaterThan(firstBlockTime);
    });
  });

  describe("PII Protection", () => {
    it("should scrub email addresses from data", () => {
      const dataWithEmail = {
        message: "Contact user@example.com for details",
        metadata: { email: "sensitive@company.com" },
      };

      const scrubbed = PIIProtectionService.scrubPII(dataWithEmail);

      expect(scrubbed.message).not.toContain("user@example.com");
      expect(scrubbed.message).toContain("***@***.com");
      expect(scrubbed.metadata.email).toBe("***@***.com");
    });

    it("should scrub phone numbers and SSNs", () => {
      const sensitiveData = {
        phone: "555-123-4567",
        ssn: "123-45-6789",
        text: "Call me at 555-987-6543 or reference SSN 987-65-4321",
      };

      const scrubbed = PIIProtectionService.scrubPII(sensitiveData);

      expect(scrubbed.phone).toBe("***-***-****");
      expect(scrubbed.ssn).toBe("***-**-****");
      expect(scrubbed.text).not.toContain("555-987-6543");
      expect(scrubbed.text).not.toContain("987-65-4321");
    });

    it("should handle nested objects and arrays", () => {
      const complexData = {
        users: [
          { email: "user1@test.com", phone: "123-456-7890" },
          { email: "user2@test.com", phone: "098-765-4321" },
        ],
        metadata: {
          contact: { email: "admin@company.com" },
        },
      };

      const scrubbed = PIIProtectionService.scrubPII(complexData);

      expect(scrubbed.users[0].email).toBe("***@***.com");
      expect(scrubbed.users[1].phone).toBe("***-***-****");
      expect(scrubbed.metadata.contact.email).toBe("***@***.com");
    });
  });

  describe("Worker Security", () => {
    let workerManager: SecureWorkerManager;

    beforeEach(() => {
      // Mock worker for testing
      global.Worker = vi.fn().mockImplementation(() => ({
        postMessage: vi.fn(),
        terminate: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      workerManager = new SecureWorkerManager("/test-worker.js");
    });

    afterEach(() => {
      workerManager.cleanup();
    });

    it("should validate message integrity", async () => {
      const mockWorker = {
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null,
        onerror: null,
        onmessageerror: null,
      };

      global.Worker = vi.fn(() => mockWorker);

      const manager = new SecureWorkerManager("/test-worker.js");

      // Send message and verify integrity checks
      const messagePromise = manager.sendMessage("COMPRESS_MEDIA", {
        test: "data",
      });

      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          type: "COMPRESS_MEDIA",
          timestamp: expect.any(Number),
          checksum: expect.any(String),
        }),
      );

      manager.cleanup();
    });

    it("should enforce message timeouts", async () => {
      const mockWorker = {
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null,
        onerror: null,
        onmessageerror: null,
      };

      global.Worker = vi.fn(() => mockWorker);

      const manager = new SecureWorkerManager("/test-worker.js");

      // Send message with short timeout
      const messagePromise = manager.sendMessage(
        "COMPRESS_MEDIA",
        { test: "data" },
        { timeout: 100 },
      );

      await expect(messagePromise).rejects.toThrow("Worker message timeout");

      manager.cleanup();
    });

    it("should limit concurrent messages", async () => {
      const mockWorker = {
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null,
        onerror: null,
        onmessageerror: null,
      };

      global.Worker = vi.fn(() => mockWorker);

      const manager = new SecureWorkerManager("/test-worker.js");

      // Try to send too many concurrent messages
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          manager.sendMessage("COMPRESS_MEDIA", { test: i }).catch((e) => e),
        );
      }

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r instanceof Error);

      expect(
        errors.some((e) => e.message.includes("Too many concurrent")),
      ).toBe(true);

      manager.cleanup();
    });
  });

  describe("Security Event Logging", () => {
    beforeEach(() => {
      // Clear any existing events
      securityLogger["events"] = [];
    });

    it("should log security events with proper metadata", () => {
      SecurityEvents.authFailure("TestComponent", "Invalid credentials");

      const events = securityLogger.getRecentEvents(1);
      expect(events).toHaveLength(1);

      const event = events[0];
      expect(event.type).toBe("AUTH_LOGIN_FAILURE");
      expect(event.component).toBe("TestComponent");
      expect(event.details.reason).toBe("Invalid credentials");
      expect(event.riskLevel).toBe("medium");
    });

    it("should scrub PII from logged events", () => {
      SecurityEvents.inputValidationFailure(
        "FormComponent",
        "email",
        "user@example.com",
        "Invalid format",
      );

      const events = securityLogger.getRecentEvents(1);
      const event = events[0];

      expect(event.details.value).toBe("***@***.com");
    });

    it("should trigger alerts for critical events", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      SecurityEvents.malwareDetected("FileUpload", "virus.exe", [
        "MALICIOUS_PATTERN",
      ]);

      const alerts = securityLogger.getUnacknowledgedAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].riskLevel).toBe("critical");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("SECURITY ALERT"),
        expect.any(Object),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Integration Security Tests", () => {
    it("should handle coordinated attack simulation", async () => {
      const attacker = "attacker-ip-123";

      // Simulate rapid-fire requests from same IP
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          Promise.resolve().then(() => {
            // Simulate various attack vectors
            try {
              InputValidator.validatePropertyUrl("javascript:void(0)");
            } catch (e) {
              SecurityEvents.xssAttemptBlocked(
                "PropertyValidator",
                "javascript:void(0)",
              );
            }

            return rateLimiter.checkLimit(attacker);
          }),
        );
      }

      await Promise.all(promises);

      // Should have security events logged
      const events = securityLogger.getRecentEvents(1);
      const xssEvents = events.filter((e) => e.type === "XSS_ATTEMPT_BLOCKED");
      const rateLimitEvents = events.filter(
        (e) => e.type === "RATE_LIMIT_EXCEEDED",
      );

      expect(xssEvents.length).toBeGreaterThan(0);
      expect(rateLimitEvents.length).toBeGreaterThan(0);

      // Should have triggered security alerts
      const alerts = securityLogger.getUnacknowledgedAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    it("should maintain security under load", async () => {
      const startTime = Date.now();
      const iterations = 1000;

      const promises = [];
      for (let i = 0; i < iterations; i++) {
        promises.push(
          Promise.resolve().then(() => {
            // Test multiple security components under load
            const data = {
              email: "test@example.com",
              input: '<script>alert("test")</script>',
            };

            const scrubbed = PIIProtectionService.scrubPII(data);
            const sanitized = InputValidator.sanitizeHTML(data.input);

            return { scrubbed, sanitized };
          }),
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All results should be properly processed
      expect(results).toHaveLength(iterations);
      results.forEach((result) => {
        expect(result.scrubbed.email).toBe("***@***.com");
        expect(result.sanitized).not.toContain("<script>");
      });

      // Performance should be reasonable (< 5 seconds for 1000 operations)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
