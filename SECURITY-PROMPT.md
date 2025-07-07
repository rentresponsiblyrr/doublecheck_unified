# 🛡️ SECURITY-FIRST DEVELOPMENT PROMPT

## **🚨 CRITICAL SECURITY MANDATE**

You are implementing a security-critical application handling sensitive property data, personal information, and financial transactions. Every line of code you write must assume adversarial conditions and implement defense-in-depth strategies.

## **🎯 SECURITY MINDSET**

### **Assume Breach Mentality**
- Every input is potentially malicious
- Every user could be an attacker
- Every external service could be compromised
- Every piece of data needs protection

### **Zero Trust Architecture**
- Verify every request, regardless of source
- Authenticate and authorize every operation
- Encrypt everything, everywhere, always
- Log and monitor all security-relevant events

## **🔐 SECURITY IMPLEMENTATION CHECKLIST**

### **S1: INPUT VALIDATION & SANITIZATION**

#### **Every User Input Must Be Validated**
```typescript
// ✅ SECURE: Comprehensive input validation
import { z } from 'zod'

const PropertyFormSchema = z.object({
  name: z.string()
    .min(1, "Property name is required")
    .max(100, "Property name too long")
    .regex(/^[a-zA-Z0-9\s\-\.]+$/, "Invalid characters in property name"),
  vrbo_url: z.string()
    .url("Invalid VRBO URL")
    .refine(url => url.includes('vrbo.com'), "Must be a VRBO URL")
    .optional(),
  description: z.string()
    .max(2000, "Description too long")
    .transform(str => str.trim())
})

// Apply validation to ALL form inputs
const validatePropertyForm = (input: unknown) => {
  try {
    return PropertyFormSchema.parse(input)
  } catch (error) {
    throw new ValidationError("Invalid property data", error.issues)
  }
}
```

#### **File Upload Security**
```typescript
// ✅ SECURE: Comprehensive file validation
export const validateUploadedFile = (file: File): FileValidationResult => {
  // File type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
  if (!allowedTypes.includes(file.type)) {
    throw new SecurityError(`File type ${file.type} not allowed`)
  }
  
  // File size limits
  const maxSizes = {
    'image/jpeg': 10 * 1024 * 1024, // 10MB
    'image/png': 10 * 1024 * 1024,  // 10MB
    'video/mp4': 500 * 1024 * 1024  // 500MB
  }
  
  if (file.size > maxSizes[file.type]) {
    throw new SecurityError(`File too large: ${file.size} bytes`)
  }
  
  // File name sanitization
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9\.\-_]/g, '')
    .substring(0, 100)
  
  return {
    isValid: true,
    sanitizedName,
    secureMetadata: {
      originalSize: file.size,
      mimeType: file.type,
      uploadTimestamp: Date.now()
    }
  }
}
```

### **S2: AUTHENTICATION & AUTHORIZATION**

#### **Secure Authentication Implementation**
```typescript
// ✅ SECURE: Multi-factor authentication with session management
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  
  useEffect(() => {
    // Validate session on app start
    const validateSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session validation error:', error)
          await signOut() // Clear potentially compromised session
          return
        }
        
        if (session) {
          // Additional validation: check if token is still valid
          const tokenValid = await validateTokenWithServer(session.access_token)
          if (!tokenValid) {
            await signOut()
            return
          }
          
          setSession(session)
          setUser(session.user)
        }
      } catch (error) {
        console.error('Authentication error:', error)
        await signOut()
      }
    }
    
    validateSession()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setSession(null)
          // Clear all local storage and caches
          localStorage.clear()
          sessionStorage.clear()
        } else if (session) {
          setSession(session)
          setUser(session.user)
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // Additional cleanup
      localStorage.clear()
      sessionStorage.clear()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
      // Force cleanup even if server call fails
      setUser(null)
      setSession(null)
    }
  }
  
  return (
    <AuthContext.Provider value={{ user, session, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### **Role-Based Access Control**
```typescript
// ✅ SECURE: Strict role-based access with audit logging
export const ProtectedRoute: React.FC<{
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermissions?: Permission[]
}> = ({ children, requiredRole, requiredPermissions = [] }) => {
  const { user, session } = useAuth()
  const location = useLocation()
  
  useEffect(() => {
    // Log all access attempts for security monitoring
    logSecurityEvent({
      type: 'route_access_attempt',
      user_id: user?.id,
      route: location.pathname,
      required_role: requiredRole,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      ip_address: 'client_side' // Server will add real IP
    })
  }, [location.pathname, user?.id, requiredRole])
  
  if (!session || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  
  // Validate user role
  if (requiredRole && !hasRole(user, requiredRole)) {
    logSecurityEvent({
      type: 'unauthorized_access_attempt',
      user_id: user.id,
      route: location.pathname,
      required_role: requiredRole,
      user_role: user.role,
      severity: 'high'
    })
    
    return <UnauthorizedAccess />
  }
  
  // Validate specific permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(user, permission)
    )
    
    if (!hasAllPermissions) {
      logSecurityEvent({
        type: 'insufficient_permissions',
        user_id: user.id,
        route: location.pathname,
        required_permissions: requiredPermissions,
        user_permissions: user.permissions,
        severity: 'medium'
      })
      
      return <InsufficientPermissions />
    }
  }
  
  return <>{children}</>
}
```

### **S3: DATA PROTECTION & ENCRYPTION**

#### **Sensitive Data Handling**
```typescript
// ✅ SECURE: Client-side encryption for sensitive data
import CryptoJS from 'crypto-js'

export class SecureDataHandler {
  private static readonly ENCRYPTION_KEY = process.env.VITE_CLIENT_ENCRYPTION_KEY
  
  static encryptSensitive(data: string): string {
    if (!this.ENCRYPTION_KEY) {
      throw new SecurityError('Encryption key not configured')
    }
    
    try {
      return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString()
    } catch (error) {
      throw new SecurityError('Encryption failed')
    }
  }
  
  static decryptSensitive(encryptedData: string): string {
    if (!this.ENCRYPTION_KEY) {
      throw new SecurityError('Encryption key not configured')
    }
    
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY)
      return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      throw new SecurityError('Decryption failed')
    }
  }
  
  // Secure local storage with encryption
  static setSecureItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value)
      const encrypted = this.encryptSensitive(serialized)
      localStorage.setItem(key, encrypted)
    } catch (error) {
      console.error('Secure storage failed:', error)
      throw new SecurityError('Failed to store sensitive data')
    }
  }
  
  static getSecureItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) return null
      
      const decrypted = this.decryptSensitive(encrypted)
      return JSON.parse(decrypted) as T
    } catch (error) {
      console.error('Secure retrieval failed:', error)
      // Remove corrupted data
      localStorage.removeItem(key)
      return null
    }
  }
}
```

### **S4: API SECURITY**

#### **Secure API Communication**
```typescript
// ✅ SECURE: API client with comprehensive security measures
export class SecureAPIClient {
  private static readonly MAX_RETRIES = 3
  private static readonly TIMEOUT = 30000 // 30 seconds
  private static rateLimiter = new Map<string, number[]>()
  
  static async secureRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Rate limiting check
    await this.checkRateLimit()
    
    // Add security headers
    const secureHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': process.env.VITE_APP_VERSION || 'unknown',
      ...options.headers
    }
    
    // Add authentication if available
    const session = await supabase.auth.getSession()
    if (session.data.session) {
      secureHeaders['Authorization'] = `Bearer ${session.data.session.access_token}`
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT)
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: secureHeaders,
        signal: controller.signal,
        credentials: 'same-origin', // Prevent CSRF
      })
      
      clearTimeout(timeoutId)
      
      // Validate response
      if (!response.ok) {
        await this.handleAPIError(response)
      }
      
      // Validate content type
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new SecurityError('Invalid response content type')
      }
      
      const data = await response.json()
      
      // Basic response validation
      if (typeof data !== 'object' || data === null) {
        throw new SecurityError('Invalid response format')
      }
      
      return data as T
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout')
      }
      
      throw error
    }
  }
  
  private static async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowMs = 60000 // 1 minute
    const maxRequests = 100
    
    const requests = this.rateLimiter.get('global') || []
    const recentRequests = requests.filter(time => now - time < windowMs)
    
    if (recentRequests.length >= maxRequests) {
      throw new SecurityError('Rate limit exceeded')
    }
    
    recentRequests.push(now)
    this.rateLimiter.set('global', recentRequests)
  }
}
```

### **S5: XSS & INJECTION PREVENTION**

#### **Safe Content Rendering**
```typescript
// ✅ SECURE: XSS prevention with content sanitization
import DOMPurify from 'dompurify'

export const SafeHTML: React.FC<{
  content: string
  allowedTags?: string[]
}> = ({ content, allowedTags = ['p', 'br', 'strong', 'em'] }) => {
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true,
      RETURN_DOM_FRAGMENT: false
    })
  }, [content, allowedTags])
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      className="safe-content"
    />
  )
}

// Safe URL handling
export const SafeLink: React.FC<{
  href: string
  children: React.ReactNode
  className?: string
}> = ({ href, children, className }) => {
  const safeHref = useMemo(() => {
    try {
      const url = new URL(href)
      
      // Only allow specific protocols
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
        return '#'
      }
      
      // Prevent javascript: URLs
      if (url.protocol === 'javascript:') {
        return '#'
      }
      
      return url.toString()
    } catch {
      return '#'
    }
  }, [href])
  
  return (
    <a 
      href={safeHref}
      className={className}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  )
}
```

### **S6: SECURITY MONITORING & LOGGING**

#### **Security Event Logging**
```typescript
// ✅ SECURE: Comprehensive security monitoring
interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'data_access' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  timestamp: string
  details: Record<string, any>
}

export class SecurityMonitor {
  private static events: SecurityEvent[] = []
  private static readonly MAX_EVENTS = 1000
  
  static logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }
    
    // Add to local buffer
    this.events.push(fullEvent)
    
    // Maintain buffer size
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }
    
    // Send critical events immediately
    if (event.severity === 'critical') {
      this.sendEventToServer(fullEvent)
    }
    
    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', fullEvent)
    }
  }
  
  private static async sendEventToServer(event: SecurityEvent): Promise<void> {
    try {
      await SecureAPIClient.secureRequest('/api/security/events', {
        method: 'POST',
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to send security event:', error)
      // Store for retry
      this.storeFailedEvent(event)
    }
  }
  
  // Monitor for suspicious patterns
  static detectSuspiciousActivity(): void {
    const recentEvents = this.events.filter(
      event => Date.now() - new Date(event.timestamp).getTime() < 300000 // 5 minutes
    )
    
    // Check for rapid authentication failures
    const authFailures = recentEvents.filter(
      event => event.type === 'authentication' && event.details.success === false
    )
    
    if (authFailures.length > 5) {
      this.logEvent({
        type: 'suspicious_activity',
        severity: 'high',
        details: {
          pattern: 'rapid_auth_failures',
          count: authFailures.length,
          timeframe: '5_minutes'
        }
      })
    }
    
    // Check for unusual data access patterns
    const dataAccess = recentEvents.filter(
      event => event.type === 'data_access'
    )
    
    if (dataAccess.length > 100) {
      this.logEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        details: {
          pattern: 'high_data_access',
          count: dataAccess.length,
          timeframe: '5_minutes'
        }
      })
    }
  }
}
```

## **🚨 SECURITY IMPLEMENTATION REQUIREMENTS**

### **For Every Component You Create:**
- Validate all props - Use TypeScript interfaces and runtime validation
- Sanitize all outputs - Escape user content, validate URLs
- Handle errors securely - Don't leak sensitive information
- Log security events - Track access patterns and failures
- Implement CSP - Content Security Policy headers

### **For Every API Call:**
- Authenticate requests - Include valid session tokens
- Validate responses - Check content type and structure
- Handle failures - Graceful degradation without data leaks
- Rate limit - Prevent abuse and DoS attacks
- Encrypt sensitive data - Protect data in transit and at rest

### **For Every User Input:**
- Validate format - Use schemas and type checking
- Sanitize content - Remove dangerous characters
- Limit size - Prevent DoS through large inputs
- Log attempts - Track suspicious input patterns
- Provide feedback - Clear error messages without information leakage

### **For Every File Operation:**
- Validate file types - Only allow expected formats
- Check file size - Prevent storage exhaustion
- Scan content - Validate file headers and structure
- Isolate storage - Separate user content from application files
- Monitor access - Log all file operations

## **🔍 SECURITY TESTING CHECKLIST**

Before considering any implementation complete:

- [ ] Input Validation: All user inputs validated and sanitized
- [ ] Authentication: Proper session management and token validation
- [ ] Authorization: Role-based access control enforced
- [ ] Data Protection: Sensitive data encrypted and access logged
- [ ] XSS Prevention: All dynamic content properly escaped
- [ ] CSRF Protection: State-changing operations protected
- [ ] File Security: Upload validation and safe storage
- [ ] API Security: Rate limiting and secure communication
- [ ] Error Handling: No sensitive information in error messages
- [ ] Logging: Security events properly logged and monitored

Remember: Security is not optional. Every shortcut in security is a potential breach. When in doubt, choose the more secure option.