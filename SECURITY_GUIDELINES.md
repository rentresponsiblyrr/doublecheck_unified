# 🔒 SECURITY GUIDELINES FOR STR CERTIFIED

*Comprehensive security best practices for building secure, production-ready applications*

## **🎯 SECURITY PHILOSOPHY**

Security is not an afterthought—it's built into every aspect of our development process. Our security approach follows these core principles:

- **Defense in Depth** - Multiple layers of security controls
- **Principle of Least Privilege** - Minimum necessary access rights
- **Fail Securely** - System fails to a secure state
- **Security by Design** - Security considerations from the start
- **Continuous Monitoring** - Ongoing security assessment and improvement

## **🏛️ SECURITY ARCHITECTURE**

### **Security Layers**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Edge Security                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   CloudFlare    │  │   Rate Limiting │  │   DDoS Protection│  │
│  │   WAF & CDN     │  │   & Throttling  │  │   & Monitoring  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Security                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Authentication  │  │  Authorization  │  │ Input Validation│  │
│  │ & Session Mgmt  │  │  & Access Ctrl  │  │ & Sanitization  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Security                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Encryption    │  │   Data Privacy  │  │   Backup &      │  │
│  │   at Rest &     │  │   & Compliance  │  │   Recovery      │  │
│  │   in Transit    │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## **🔐 AUTHENTICATION & AUTHORIZATION**

### **Authentication Implementation**

```typescript
/**
 * Secure authentication service with multi-factor support
 */
interface AuthenticationService {
  login(credentials: LoginCredentials): Promise<Result<AuthToken, AuthError>>;
  logout(token: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<Result<AuthToken, AuthError>>;
  validateToken(token: string): Promise<Result<User, AuthError>>;
  enableTwoFactor(userId: string): Promise<Result<TwoFactorSetup, AuthError>>;
}

class SecureAuthenticationService implements AuthenticationService {
  private readonly tokenService: TokenService;
  private readonly userService: UserService;
  private readonly auditLogger: AuditLogger;
  private readonly rateLimiter: RateLimiter;

  constructor(
    tokenService: TokenService,
    userService: UserService,
    auditLogger: AuditLogger,
    rateLimiter: RateLimiter
  ) {
    this.tokenService = tokenService;
    this.userService = userService;
    this.auditLogger = auditLogger;
    this.rateLimiter = rateLimiter;
  }

  async login(credentials: LoginCredentials): Promise<Result<AuthToken, AuthError>> {
    try {
      // Rate limiting
      const rateLimitResult = await this.rateLimiter.checkLimit(
        `login:${credentials.email}`,
        5, // 5 attempts
        15 * 60 * 1000 // 15 minutes
      );

      if (!rateLimitResult.allowed) {
        await this.auditLogger.logSecurityEvent({
          type: 'LOGIN_RATE_LIMITED',
          email: credentials.email,
          ip: credentials.ip,
          userAgent: credentials.userAgent,
          timestamp: new Date()
        });
        return Result.failure(new AuthError('Rate limit exceeded'));
      }

      // Input validation
      const validationResult = this.validateCredentials(credentials);
      if (!validationResult.success) {
        return Result.failure(validationResult.error);
      }

      // Credential verification
      const user = await this.userService.findByEmail(credentials.email);
      if (!user) {
        await this.auditLogger.logSecurityEvent({
          type: 'LOGIN_FAILED_USER_NOT_FOUND',
          email: credentials.email,
          ip: credentials.ip,
          timestamp: new Date()
        });
        return Result.failure(new AuthError('Invalid credentials'));
      }

      // Password verification with timing attack protection
      const isPasswordValid = await this.verifyPassword(
        credentials.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        await this.auditLogger.logSecurityEvent({
          type: 'LOGIN_FAILED_INVALID_PASSWORD',
          userId: user.id,
          email: credentials.email,
          ip: credentials.ip,
          timestamp: new Date()
        });
        return Result.failure(new AuthError('Invalid credentials'));
      }

      // Account status checks
      if (user.isLocked) {
        await this.auditLogger.logSecurityEvent({
          type: 'LOGIN_FAILED_ACCOUNT_LOCKED',
          userId: user.id,
          email: credentials.email,
          ip: credentials.ip,
          timestamp: new Date()
        });
        return Result.failure(new AuthError('Account is locked'));
      }

      if (!user.isEmailVerified) {
        return Result.failure(new AuthError('Email not verified'));
      }

      // Two-factor authentication check
      if (user.twoFactorEnabled) {
        if (!credentials.twoFactorCode) {
          return Result.failure(new AuthError('Two-factor code required'));
        }

        const isTwoFactorValid = await this.verifyTwoFactor(
          user.id,
          credentials.twoFactorCode
        );

        if (!isTwoFactorValid) {
          await this.auditLogger.logSecurityEvent({
            type: 'LOGIN_FAILED_INVALID_2FA',
            userId: user.id,
            email: credentials.email,
            ip: credentials.ip,
            timestamp: new Date()
          });
          return Result.failure(new AuthError('Invalid two-factor code'));
        }
      }

      // Generate secure tokens
      const accessToken = await this.tokenService.generateAccessToken(user);
      const refreshToken = await this.tokenService.generateRefreshToken(user);

      // Update user session info
      await this.userService.updateLastLogin(user.id, {
        timestamp: new Date(),
        ip: credentials.ip,
        userAgent: credentials.userAgent
      });

      // Log successful login
      await this.auditLogger.logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        userId: user.id,
        email: credentials.email,
        ip: credentials.ip,
        userAgent: credentials.userAgent,
        timestamp: new Date()
      });

      return Result.success({
        accessToken,
        refreshToken,
        user: this.sanitizeUser(user),
        expiresIn: this.tokenService.getAccessTokenExpiration()
      });

    } catch (error) {
      await this.auditLogger.logSecurityEvent({
        type: 'LOGIN_ERROR',
        email: credentials.email,
        error: error.message,
        timestamp: new Date()
      });
      return Result.failure(new AuthError('Login failed'));
    }
  }

  private validateCredentials(credentials: LoginCredentials): Result<void, AuthError> {
    const schema = z.object({
      email: z.string().email().max(254),
      password: z.string().min(8).max(128),
      twoFactorCode: z.string().length(6).optional(),
      ip: z.string().ip(),
      userAgent: z.string().max(512)
    });

    try {
      schema.parse(credentials);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(new AuthError('Invalid input format'));
    }
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Use bcrypt for password verification with timing attack protection
    const startTime = Date.now();
    
    try {
      const isValid = await bcrypt.compare(password, hash);
      
      // Ensure minimum processing time to prevent timing attacks
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 100) {
        await new Promise(resolve => setTimeout(resolve, 100 - elapsedTime));
      }
      
      return isValid;
    } catch (error) {
      // Ensure consistent timing even on error
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 100) {
        await new Promise(resolve => setTimeout(resolve, 100 - elapsedTime));
      }
      return false;
    }
  }

  private sanitizeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      profilePicture: user.profilePicture,
      lastLogin: user.lastLogin,
      // Remove sensitive fields
      // passwordHash: EXCLUDED
      // twoFactorSecret: EXCLUDED
    };
  }
}
```

### **Authorization Patterns**

```typescript
/**
 * Role-based access control with fine-grained permissions
 */
enum Permission {
  // Inspection permissions
  INSPECTION_CREATE = 'inspection:create',
  INSPECTION_READ = 'inspection:read',
  INSPECTION_UPDATE = 'inspection:update',
  INSPECTION_DELETE = 'inspection:delete',
  INSPECTION_COMPLETE = 'inspection:complete',

  // Property permissions
  PROPERTY_CREATE = 'property:create',
  PROPERTY_READ = 'property:read',
  PROPERTY_UPDATE = 'property:update',
  PROPERTY_DELETE = 'property:delete',

  // Audit permissions
  AUDIT_CREATE = 'audit:create',
  AUDIT_READ = 'audit:read',
  AUDIT_COMPLETE = 'audit:complete',
  AUDIT_REVIEW = 'audit:review',

  // Admin permissions
  USER_MANAGE = 'user:manage',
  SYSTEM_CONFIGURE = 'system:configure',
  REPORTS_ACCESS = 'reports:access',
  SECURITY_AUDIT = 'security:audit'
}

enum Role {
  ADMIN = 'admin',
  AUDITOR = 'auditor',
  INSPECTOR = 'inspector',
  VIEWER = 'viewer'
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_READ,
    Permission.INSPECTION_UPDATE,
    Permission.INSPECTION_DELETE,
    Permission.INSPECTION_COMPLETE,
    Permission.PROPERTY_CREATE,
    Permission.PROPERTY_READ,
    Permission.PROPERTY_UPDATE,
    Permission.PROPERTY_DELETE,
    Permission.AUDIT_CREATE,
    Permission.AUDIT_READ,
    Permission.AUDIT_COMPLETE,
    Permission.AUDIT_REVIEW,
    Permission.USER_MANAGE,
    Permission.SYSTEM_CONFIGURE,
    Permission.REPORTS_ACCESS,
    Permission.SECURITY_AUDIT
  ],
  [Role.AUDITOR]: [
    Permission.INSPECTION_READ,
    Permission.PROPERTY_READ,
    Permission.AUDIT_CREATE,
    Permission.AUDIT_READ,
    Permission.AUDIT_COMPLETE,
    Permission.AUDIT_REVIEW,
    Permission.REPORTS_ACCESS
  ],
  [Role.INSPECTOR]: [
    Permission.INSPECTION_CREATE,
    Permission.INSPECTION_READ,
    Permission.INSPECTION_UPDATE,
    Permission.INSPECTION_COMPLETE,
    Permission.PROPERTY_READ
  ],
  [Role.VIEWER]: [
    Permission.INSPECTION_READ,
    Permission.PROPERTY_READ,
    Permission.AUDIT_READ
  ]
};

/**
 * Authorization middleware for API endpoints
 */
export const requirePermission = (requiredPermission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7);
      const tokenValidation = await tokenService.validateToken(token);
      
      if (!tokenValidation.success) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const user = tokenValidation.data;
      const userPermissions = ROLE_PERMISSIONS[user.role] || [];

      if (!userPermissions.includes(requiredPermission)) {
        await auditLogger.logSecurityEvent({
          type: 'AUTHORIZATION_DENIED',
          userId: user.id,
          permission: requiredPermission,
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          timestamp: new Date()
        });

        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = user;
      next();
    } catch (error) {
      await auditLogger.logSecurityEvent({
        type: 'AUTHORIZATION_ERROR',
        error: error.message,
        endpoint: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date()
      });

      return res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

/**
 * React authorization hook
 */
export const usePermission = (requiredPermission: Permission): boolean => {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(requiredPermission);
  }, [user, requiredPermission]);
};

/**
 * Component-level authorization
 */
export const RequirePermission: React.FC<{
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback = null }) => {
  const hasPermission = usePermission(permission);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

## **🛡️ INPUT VALIDATION & SANITIZATION**

### **Comprehensive Input Validation**

```typescript
/**
 * Input validation service with XSS and injection protection
 */
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

class InputValidationService {
  private readonly window: Window;
  private readonly domPurify: DOMPurify.DOMPurifyI;

  constructor() {
    const window = new JSDOM('').window;
    this.window = window as unknown as Window;
    this.domPurify = DOMPurify(this.window);
  }

  /**
   * Validate and sanitize inspection creation data
   */
  validateCreateInspection(data: unknown): Result<CreateInspectionRequest, ValidationError> {
    const schema = z.object({
      propertyId: z.string()
        .uuid('Invalid property ID format')
        .refine(this.isValidUuid, 'Invalid UUID format'),
      
      scheduledDate: z.date()
        .min(new Date(), 'Scheduled date must be in the future')
        .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'Scheduled date too far in future'),
      
      notes: z.string()
        .max(1000, 'Notes too long')
        .optional()
        .transform(this.sanitizeText),
      
      checklistItems: z.array(z.object({
        title: z.string()
          .min(1, 'Title is required')
          .max(200, 'Title too long')
          .transform(this.sanitizeText),
        
        description: z.string()
          .max(500, 'Description too long')
          .optional()
          .transform(this.sanitizeText),
        
        category: z.enum(['safety', 'cleanliness', 'amenities', 'maintenance']),
        
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        
        required: z.boolean().default(false)
      }))
      .min(1, 'At least one checklist item is required')
      .max(50, 'Too many checklist items'),
      
      metadata: z.object({
        source: z.string().max(100).optional(),
        version: z.string().max(20).optional()
      }).optional()
    });

    try {
      const validatedData = schema.parse(data);
      return Result.success(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Result.failure(new ValidationError(error.errors));
      }
      return Result.failure(new ValidationError('Validation failed'));
    }
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File, options: FileUploadOptions): Result<ValidatedFile, ValidationError> {
    const errors: string[] = [];

    // File size validation
    if (file.size > options.maxSize) {
      errors.push(`File size exceeds ${options.maxSize} bytes`);
    }

    // File type validation
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed`);
    }

    // File name validation
    if (!this.isValidFileName(file.name)) {
      errors.push('Invalid file name');
    }

    // File extension validation
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !options.allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} not allowed`);
    }

    if (errors.length > 0) {
      return Result.failure(new ValidationError(errors));
    }

    return Result.success({
      file,
      sanitizedName: this.sanitizeFileName(file.name),
      size: file.size,
      type: file.type,
      extension
    });
  }

  /**
   * Sanitize text input to prevent XSS
   */
  private sanitizeText = (text: string): string => {
    if (!text) return '';
    
    // Remove any HTML tags and encode special characters
    return this.domPurify.sanitize(text, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
  };

  /**
   * Sanitize HTML content (for rich text)
   */
  sanitizeHtml(html: string): string {
    return this.domPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style'],
      FORBID_ATTR: ['onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
    });
  }

  /**
   * Validate UUID format
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate file name
   */
  private isValidFileName(fileName: string): boolean {
    // Prevent path traversal and dangerous characters
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    
    return !dangerousChars.test(fileName) && 
           !reservedNames.test(fileName) && 
           fileName.length > 0 && 
           fileName.length <= 255;
  }

  /**
   * Sanitize file name
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/^\.+/, '')
      .substring(0, 255);
  }
}

/**
 * SQL injection prevention with parameterized queries
 */
class SecureQueryBuilder {
  /**
   * Build parameterized query for inspection search
   */
  static buildInspectionSearchQuery(filters: InspectionFilters): QueryResult {
    const conditions: string[] = [];
    const parameters: any[] = [];
    let paramIndex = 1;

    let query = `
      SELECT i.*, p.name as name, u.name as inspector_name
      FROM inspections i
      JOIN properties p ON i.property_id = p.id
      JOIN users u ON i.inspector_id = u.id
      WHERE 1=1
    `;

    // Status filter
    if (filters.status) {
      conditions.push(`i.status = $${paramIndex}`);
      parameters.push(filters.status);
      paramIndex++;
    }

    // Date range filter
    if (filters.startDate) {
      conditions.push(`i.scheduled_date >= $${paramIndex}`);
      parameters.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      conditions.push(`i.scheduled_date <= $${paramIndex}`);
      parameters.push(filters.endDate);
      paramIndex++;
    }

    // Property filter
    if (filters.propertyId) {
      conditions.push(`i.property_id = $${paramIndex}`);
      parameters.push(filters.propertyId);
      paramIndex++;
    }

    // Inspector filter
    if (filters.inspectorId) {
      conditions.push(`i.inspector_id = $${paramIndex}`);
      parameters.push(filters.inspectorId);
      paramIndex++;
    }

    // Text search (using full-text search to prevent injection)
    if (filters.searchText) {
      conditions.push(`(
        to_tsvector('english', p.name || ' ' || i.notes) @@ plainto_tsquery('english', $${paramIndex})
      )`);
      parameters.push(filters.searchText);
      paramIndex++;
    }

    // Add conditions to query
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // Add ordering and pagination
    query += `
      ORDER BY i.scheduled_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    parameters.push(filters.limit || 50, filters.offset || 0);

    return { query, parameters };
  }
}
```

## **🔒 DATA ENCRYPTION & PROTECTION**

### **Encryption Service**

```typescript
/**
 * Encryption service for sensitive data protection
 */
import crypto from 'crypto';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 64;

  /**
   * Encrypt sensitive data
   */
  async encrypt(plaintext: string, key?: string): Promise<EncryptedData> {
    try {
      const encryptionKey = key ? Buffer.from(key, 'hex') : await this.generateKey();
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipher(this.algorithm, encryptionKey);
      cipher.setAAD(Buffer.from('STR_CERTIFIED_V1'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      throw new EncryptionError('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(encryptedData: EncryptedData, key: string): Promise<string> {
    try {
      const encryptionKey = Buffer.from(key, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, encryptionKey);
      decipher.setAAD(Buffer.from('STR_CERTIFIED_V1'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new EncryptionError('Failed to decrypt data');
    }
  }

  /**
   * Hash password with salt
   */
  async hashPassword(password: string): Promise<PasswordHash> {
    const salt = crypto.randomBytes(this.saltLength);
    const hash = await bcrypt.hash(password, 12);
    
    return {
      hash,
      salt: salt.toString('hex'),
      algorithm: 'bcrypt',
      rounds: 12
    };
  }

  /**
   * Generate secure random key
   */
  private async generateKey(): Promise<Buffer> {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

/**
 * Secure storage for sensitive configuration
 */
class SecureConfigService {
  private readonly encryption: EncryptionService;
  private readonly masterKey: string;

  constructor(encryption: EncryptionService) {
    this.encryption = encryption;
    this.masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    
    if (!this.masterKey) {
      throw new Error('Master encryption key not found');
    }
  }

  /**
   * Store encrypted configuration
   */
  async storeConfig(key: string, value: string): Promise<void> {
    const encrypted = await this.encryption.encrypt(value, this.masterKey);
    
    await this.configRepository.store(key, {
      ...encrypted,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Retrieve and decrypt configuration
   */
  async getConfig(key: string): Promise<string | null> {
    const stored = await this.configRepository.get(key);
    if (!stored) return null;
    
    return await this.encryption.decrypt(stored, this.masterKey);
  }
}
```

## **🚨 SECURITY MONITORING & INCIDENT RESPONSE**

### **Security Event Logging**

```typescript
/**
 * Comprehensive security event logging and monitoring
 */
enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_RATE_LIMITED = 'LOGIN_RATE_LIMITED',
  LOGOUT = 'LOGOUT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authorization events
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  PRIVILEGE_ESCALATION_ATTEMPT = 'PRIVILEGE_ESCALATION_ATTEMPT',
  
  // Input validation events
  INVALID_INPUT_DETECTED = 'INVALID_INPUT_DETECTED',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  
  // File upload events
  MALICIOUS_FILE_UPLOAD = 'MALICIOUS_FILE_UPLOAD',
  SUSPICIOUS_FILE_ACCESS = 'SUSPICIOUS_FILE_ACCESS',
  
  // API security events
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  SUSPICIOUS_API_USAGE = 'SUSPICIOUS_API_USAGE',
  
  // System events
  SECURITY_CONFIG_CHANGED = 'SECURITY_CONFIG_CHANGED',
  ENCRYPTION_KEY_ROTATED = 'ENCRYPTION_KEY_ROTATED',
  
  // Incident response
  SECURITY_INCIDENT_DETECTED = 'SECURITY_INCIDENT_DETECTED',
  INCIDENT_RESPONSE_TRIGGERED = 'INCIDENT_RESPONSE_TRIGGERED'
}

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  payload?: any;
  metadata?: Record<string, any>;
  timestamp: Date;
  resolved?: boolean;
  responseAction?: string;
}

class SecurityMonitoringService {
  private readonly logger: Logger;
  private readonly alertService: AlertService;
  private readonly incidentResponse: IncidentResponseService;

  constructor(
    logger: Logger,
    alertService: AlertService,
    incidentResponse: IncidentResponseService
  ) {
    this.logger = logger;
    this.alertService = alertService;
    this.incidentResponse = incidentResponse;
  }

  /**
   * Log security event and trigger appropriate response
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...event
    };

    // Log to security audit trail
    await this.logger.security(securityEvent);

    // Check for incident patterns
    await this.detectIncidentPatterns(securityEvent);

    // Trigger immediate response for critical events
    if (securityEvent.severity === 'critical') {
      await this.triggerIncidentResponse(securityEvent);
    }

    // Send alerts for high-severity events
    if (securityEvent.severity === 'high' || securityEvent.severity === 'critical') {
      await this.alertService.sendSecurityAlert(securityEvent);
    }
  }

  /**
   * Detect security incident patterns
   */
  private async detectIncidentPatterns(event: SecurityEvent): Promise<void> {
    const patterns = [
      {
        name: 'Brute Force Attack',
        check: () => this.detectBruteForce(event),
        severity: 'high'
      },
      {
        name: 'Account Enumeration',
        check: () => this.detectAccountEnumeration(event),
        severity: 'medium'
      },
      {
        name: 'Privilege Escalation',
        check: () => this.detectPrivilegeEscalation(event),
        severity: 'critical'
      },
      {
        name: 'Data Exfiltration',
        check: () => this.detectDataExfiltration(event),
        severity: 'critical'
      }
    ];

    for (const pattern of patterns) {
      const detected = await pattern.check();
      if (detected) {
        await this.logSecurityEvent({
          type: SecurityEventType.SECURITY_INCIDENT_DETECTED,
          severity: pattern.severity as any,
          ip: event.ip,
          metadata: {
            pattern: pattern.name,
            originalEvent: event
          }
        });
      }
    }
  }

  /**
   * Detect brute force attack pattern
   */
  private async detectBruteForce(event: SecurityEvent): Promise<boolean> {
    if (event.type !== SecurityEventType.LOGIN_FAILED) {
      return false;
    }

    const recentFailures = await this.getRecentEvents(
      event.ip,
      SecurityEventType.LOGIN_FAILED,
      5 * 60 * 1000 // 5 minutes
    );

    return recentFailures.length >= 10;
  }

  /**
   * Detect account enumeration attempt
   */
  private async detectAccountEnumeration(event: SecurityEvent): Promise<boolean> {
    if (event.type !== SecurityEventType.LOGIN_FAILED) {
      return false;
    }

    const recentAttempts = await this.getRecentEvents(
      event.ip,
      SecurityEventType.LOGIN_FAILED,
      10 * 60 * 1000 // 10 minutes
    );

    // Check for attempts on multiple different accounts
    const uniqueEmails = new Set(recentAttempts.map(e => e.metadata?.email));
    return uniqueEmails.size >= 5;
  }

  /**
   * Trigger incident response
   */
  private async triggerIncidentResponse(event: SecurityEvent): Promise<void> {
    await this.incidentResponse.createIncident({
      type: event.type,
      severity: event.severity,
      description: `Security incident detected: ${event.type}`,
      affectedSystems: ['authentication', 'authorization'],
      evidence: [event],
      status: 'open',
      assignedTo: 'security-team',
      createdAt: new Date()
    });

    // Immediate protective actions
    switch (event.type) {
      case SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT:
        await this.incidentResponse.lockUserAccount(event.userId!);
        break;
      
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
        await this.incidentResponse.blockIP(event.ip);
        break;
      
      case SecurityEventType.MALICIOUS_FILE_UPLOAD:
        await this.incidentResponse.quarantineFile(event.metadata?.fileId);
        break;
    }
  }

  /**
   * Get recent security events
   */
  private async getRecentEvents(
    ip: string,
    type: SecurityEventType,
    timeWindow: number
  ): Promise<SecurityEvent[]> {
    const since = new Date(Date.now() - timeWindow);
    return await this.securityEventRepository.findByIpAndType(ip, type, since);
  }
}
```

## **🔐 SECURE COMMUNICATION**

### **API Security**

```typescript
/**
 * Secure API implementation with comprehensive protection
 */
class SecureAPIService {
  private readonly rateLimiter: RateLimiter;
  private readonly validator: InputValidationService;
  private readonly logger: SecurityMonitoringService;

  /**
   * Secure API endpoint wrapper
   */
  secureEndpoint<T, R>(
    handler: (req: AuthenticatedRequest<T>, res: Response) => Promise<R>,
    options: SecureEndpointOptions = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Rate limiting
        if (options.rateLimit) {
          const rateLimitKey = `${req.ip}:${req.path}`;
          const isAllowed = await this.rateLimiter.checkLimit(
            rateLimitKey,
            options.rateLimit.requests,
            options.rateLimit.window
          );

          if (!isAllowed) {
            await this.logger.logSecurityEvent({
              type: SecurityEventType.API_RATE_LIMITED,
              severity: 'medium',
              ip: req.ip,
              endpoint: req.path,
              method: req.method
            });

            return res.status(429).json({
              error: 'Rate limit exceeded',
              retryAfter: options.rateLimit.window
            });
          }
        }

        // Input validation
        if (options.validation) {
          const validationResult = await this.validator.validate(req.body, options.validation);
          if (!validationResult.success) {
            await this.logger.logSecurityEvent({
              type: SecurityEventType.INVALID_INPUT_DETECTED,
              severity: 'low',
              ip: req.ip,
              endpoint: req.path,
              method: req.method,
              payload: req.body
            });

            return res.status(400).json({
              error: 'Invalid input',
              details: validationResult.errors
            });
          }
        }

        // Authentication
        if (options.requireAuth !== false) {
          const authResult = await this.authenticateRequest(req);
          if (!authResult.success) {
            return res.status(401).json({ error: 'Authentication required' });
          }
          req.user = authResult.user;
        }

        // Authorization
        if (options.requiredPermission) {
          const hasPermission = await this.checkPermission(req.user, options.requiredPermission);
          if (!hasPermission) {
            await this.logger.logSecurityEvent({
              type: SecurityEventType.AUTHORIZATION_DENIED,
              severity: 'medium',
              userId: req.user?.id,
              ip: req.ip,
              endpoint: req.path,
              method: req.method
            });

            return res.status(403).json({ error: 'Insufficient permissions' });
          }
        }

        // Execute handler
        const result = await handler(req as AuthenticatedRequest<T>, res);
        
        // Log successful API call
        await this.logger.logSecurityEvent({
          type: SecurityEventType.API_ACCESS_SUCCESS,
          severity: 'low',
          userId: req.user?.id,
          ip: req.ip,
          endpoint: req.path,
          method: req.method
        });

        return result;

      } catch (error) {
        await this.logger.logSecurityEvent({
          type: SecurityEventType.API_ERROR,
          severity: 'medium',
          userId: req.user?.id,
          ip: req.ip,
          endpoint: req.path,
          method: req.method,
          metadata: { error: error.message }
        });

        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  /**
   * Secure file upload endpoint
   */
  secureFileUpload(options: FileUploadOptions) {
    return this.secureEndpoint(async (req, res) => {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Validate file
      const validationResult = await this.validator.validateFileUpload(file, options);
      if (!validationResult.success) {
        await this.logger.logSecurityEvent({
          type: SecurityEventType.MALICIOUS_FILE_UPLOAD,
          severity: 'high',
          userId: req.user.id,
          ip: req.ip,
          metadata: {
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            errors: validationResult.errors
          }
        });

        return res.status(400).json({
          error: 'Invalid file',
          details: validationResult.errors
        });
      }

      // Virus scan
      const scanResult = await this.virusScanner.scan(file);
      if (!scanResult.clean) {
        await this.logger.logSecurityEvent({
          type: SecurityEventType.MALICIOUS_FILE_UPLOAD,
          severity: 'critical',
          userId: req.user.id,
          ip: req.ip,
          metadata: {
            fileName: file.originalname,
            threats: scanResult.threats
          }
        });

        return res.status(400).json({ error: 'File contains malware' });
      }

      // Upload to secure storage
      const uploadResult = await this.fileStorage.upload(file, {
        encryption: true,
        userId: req.user.id,
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date(),
          checksum: await this.calculateChecksum(file)
        }
      });

      return res.json({
        success: true,
        fileId: uploadResult.id,
        url: uploadResult.url
      });
    }, {
      rateLimit: { requests: 10, window: 60000 }, // 10 uploads per minute
      requiredPermission: Permission.FILE_UPLOAD
    });
  }
}
```

## **🔒 SECURITY CONFIGURATION**

### **Security Headers**

```typescript
/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.doublecheckverified.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content Type Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Frame Options
  res.setHeader('X-Frame-Options', 'DENY');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Permissions Policy
  res.setHeader('Permissions-Policy', [
    'camera=(self)',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()'
  ].join(', '));

  next();
};
```

### **Environment Configuration**

```typescript
/**
 * Secure environment configuration
 */
interface SecurityConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  encryption: {
    masterKey: string;
    algorithm: string;
    keyRotationInterval: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    trustProxy: boolean;
  };
  cors: {
    origin: string[];
    credentials: boolean;
    methods: string[];
  };
  session: {
    secret: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
}

class SecurityConfigService {
  private static instance: SecurityConfigService;
  private config: SecurityConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  static getInstance(): SecurityConfigService {
    if (!SecurityConfigService.instance) {
      SecurityConfigService.instance = new SecurityConfigService();
    }
    return SecurityConfigService.instance;
  }

  private loadConfig(): SecurityConfig {
    return {
      jwt: {
        secret: this.getRequiredEnv('JWT_SECRET'),
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'str-certified',
        audience: process.env.JWT_AUDIENCE || 'str-certified-users'
      },
      encryption: {
        masterKey: this.getRequiredEnv('MASTER_ENCRYPTION_KEY'),
        algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
        keyRotationInterval: parseInt(process.env.KEY_ROTATION_INTERVAL || '86400000') // 24 hours
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        trustProxy: process.env.TRUST_PROXY === 'true'
      },
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: process.env.CORS_CREDENTIALS === 'true',
        methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE']
      },
      session: {
        secret: this.getRequiredEnv('SESSION_SECRET'),
        maxAge: parseInt(process.env.SESSION_MAX_AGE || '3600000'), // 1 hour
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict'
      }
    };
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }

  private validateConfig(): void {
    // Validate JWT secret strength
    if (this.config.jwt.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }

    // Validate encryption key
    if (this.config.encryption.masterKey.length < 64) {
      throw new Error('Master encryption key must be at least 64 characters long');
    }

    // Validate session secret
    if (this.config.session.secret.length < 32) {
      throw new Error('Session secret must be at least 32 characters long');
    }
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}
```

---

## **🎯 SECURITY CHECKLIST**

### **Development Security Checklist**
- [ ] All inputs are validated and sanitized
- [ ] Authentication is properly implemented
- [ ] Authorization checks are in place
- [ ] Sensitive data is encrypted
- [ ] Security headers are configured
- [ ] Rate limiting is implemented
- [ ] Logging captures security events
- [ ] Error messages don't leak information
- [ ] Dependencies are up to date
- [ ] Security tests are written

### **Deployment Security Checklist**
- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] Environment variables are secure
- [ ] Database access is restricted
- [ ] API keys are properly managed
- [ ] Monitoring is configured
- [ ] Backup encryption is enabled
- [ ] Access logs are collected
- [ ] Security scanning is automated
- [ ] Incident response plan is ready

---

## **🎯 CONCLUSION**

Security is everyone's responsibility and must be built into every aspect of our application. Remember:

1. **Defense in depth** - Multiple layers of security
2. **Principle of least privilege** - Minimum necessary access
3. **Fail securely** - System fails to a secure state
4. **Continuous monitoring** - Always watch for threats
5. **Regular updates** - Keep dependencies current
6. **Security testing** - Test for vulnerabilities
7. **Incident response** - Be prepared for breaches

**Security is not a feature—it's a foundation!** 🛡️

---

*This guide is living documentation. Please update it as threats evolve and new security measures are implemented.*