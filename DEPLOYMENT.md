# 🚀 STR Certified Dual-Domain Deployment Guide

## Overview

This guide covers deploying STR Certified as two separate Railway services with domain-specific optimizations:

- **Inspector App** → `app.doublecheckverified.com` (Mobile-optimized)
- **Admin/Audit App** → `admin.doublecheckverified.com` (Desktop-optimized)

## Prerequisites

- Railway CLI installed: `npm install -g @railway/cli`
- Railway account with appropriate permissions
- Access to `doublecheckverified.com` DNS management
- GitHub repository with STR Certified codebase

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    STR Certified Platform                       │
├─────────────────────────────────────────────────────────────────┤
│  app.doublecheckverified.com    │  admin.doublecheckverified.com │
│  ┌─────────────────────────────┐ │  ┌─────────────────────────────┐ │
│  │     Inspector App           │ │  │      Admin App              │ │
│  │  • Mobile-optimized         │ │  │  • Desktop-optimized        │ │
│  │  • PWA enabled              │ │  │  • Analytics enabled        │ │
│  │  • Offline support          │ │  │  • Debug tools              │ │
│  │  • Camera/video features    │ │  │  • Performance monitoring   │ │
│  │  • 500KB bundle target      │ │  │  • 1.5MB bundle target      │ │
│  └─────────────────────────────┘ │  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Railway Project Setup

### 1.1 Create Railway Projects

```bash
# Create inspector project
railway login
railway new str-certified-inspector
cd str-certified-inspector

# Create admin project (in separate terminal/directory)
railway new str-certified-admin
cd str-certified-admin
```

### 1.2 Link Projects to GitHub Repository

```bash
# For inspector project
railway link str-certified-inspector
railway connect [your-github-repo]

# For admin project
railway link str-certified-admin
railway connect [your-github-repo]
```

## Step 2: Environment Variables Configuration

### 2.1 Shared Environment Variables

Both projects need these base variables:

```bash
# Database & API
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
ALERT_WEBHOOK_URL=your_alert_webhook_url

# General
APP_ENV=production
LOG_LEVEL=info
```

### 2.2 Inspector-Specific Variables

```bash
# Set in inspector project
railway variables set VITE_APP_TYPE=inspector
railway variables set VITE_ENABLE_ANALYTICS=false
railway variables set VITE_ENABLE_PWA=true
railway variables set VITE_ENABLE_OFFLINE_MODE=true
railway variables set VITE_ENABLE_VIDEO_RECORDING=true
```

### 2.3 Admin-Specific Variables

```bash
# Set in admin project
railway variables set VITE_APP_TYPE=admin
railway variables set VITE_ENABLE_ANALYTICS=true
railway variables set VITE_ENABLE_PWA=false
railway variables set VITE_ENABLE_OFFLINE_MODE=false
railway variables set VITE_ENABLE_VIDEO_RECORDING=false
railway variables set GA_TRACKING_ID=your_ga_tracking_id
railway variables set MIXPANEL_TOKEN=your_mixpanel_token
```

## Step 3: Railway Configuration Files

### 3.1 Inspector Service Configuration

Copy `railway.inspector.json` to your inspector project:

```bash
# In inspector project directory
cp railway.inspector.json railway.json
```

### 3.2 Admin Service Configuration

Copy `railway.admin.json` to your admin project:

```bash
# In admin project directory
cp railway.admin.json railway.json
```

## Step 4: Domain Configuration

### 4.1 Custom Domains Setup

```bash
# Inspector domain
railway domain add app.doublecheckverified.com

# Admin domain
railway domain add admin.doublecheckverified.com
```

### 4.2 DNS Configuration

Add these DNS records to your domain provider:

```
Type: CNAME
Name: app
Value: str-certified-inspector.up.railway.app

Type: CNAME
Name: admin
Value: str-certified-admin.up.railway.app
```

## Step 5: Deployment Commands

### 5.1 Local Testing

```bash
# Test inspector build
npm run build:inspector
npm run preview:inspector

# Test admin build
npm run build:admin
npm run preview:admin
```

### 5.2 Deploy to Railway

```bash
# Deploy inspector
railway deploy --config railway.inspector.json

# Deploy admin
railway deploy --config railway.admin.json
```

## Step 6: Post-Deployment Verification

### 6.1 Health Check Verification

```bash
# Check inspector health
curl https://app.doublecheckverified.com/health

# Check admin health
curl https://admin.doublecheckverified.com/health
```

### 6.2 Bundle Size Analysis

```bash
# Analyze inspector bundle
npm run build:inspector:analyze

# Analyze admin bundle
npm run build:admin:analyze
```

## Step 7: Monitoring & Maintenance

### 7.1 Performance Monitoring

**Inspector App Metrics:**
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Mobile Performance**: 60fps animations, <200ms touch response
- **PWA Metrics**: Cache hit rate, offline functionality
- **Bundle Size**: <500KB initial, <50KB per route

**Admin App Metrics:**
- **Dashboard Performance**: <1s load time, smooth data visualization
- **Analytics Accuracy**: Real-time data processing
- **User Experience**: Task completion rates, error rates
- **Bundle Size**: <1.5MB initial, <200KB per route

### 7.2 Scaling Configuration

**Inspector Service:**
```yaml
scaling:
  min_instances: 1
  max_instances: 5
  cpu_threshold: 70%
  memory_threshold: 80%
  resources:
    cpu: 0.5
    memory: 512Mi
  regions:
    - us-west-2
    - us-east-1
```

**Admin Service:**
```yaml
scaling:
  min_instances: 1
  max_instances: 3
  cpu_threshold: 75%
  memory_threshold: 85%
  resources:
    cpu: 1
    memory: 1Gi
  regions:
    - us-west-2
```

### 7.3 Health Checks & Monitoring

**Health Check Endpoints:**
```bash
# Inspector health check
GET https://app.doublecheckverified.com/health
Response: {
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "healthy",
    "ai_service": "healthy",
    "storage": "healthy"
  }
}

# Admin health check
GET https://admin.doublecheckverified.com/health
Response: {
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "healthy",
    "analytics": "healthy",
    "monitoring": "healthy"
  }
}
```

### 7.4 Backup & Recovery

**Inspector Service:**
- **PWA Cache**: 7-day retention for offline data
- **User Data**: Real-time sync with conflict resolution
- **Media Files**: Automatic backup to cloud storage
- **Configuration**: Environment-specific backups

**Admin Service:**
- **Database**: Daily automated backups with point-in-time recovery
- **Analytics Data**: Weekly incremental backups
- **Configuration**: Version-controlled infrastructure as code
- **Monitoring**: 30-day retention for logs and metrics

### 7.5 Disaster Recovery

**Recovery Time Objectives (RTO):**
- Inspector Service: <30 minutes
- Admin Service: <60 minutes

**Recovery Point Objectives (RPO):**
- User Data: <5 minutes
- Analytics Data: <1 hour
- Configuration: <1 minute

**Disaster Recovery Plan:**
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Determine impact and scope
3. **Recovery**: Restore from backups or failover
4. **Validation**: Verify system functionality
5. **Communication**: Update stakeholders

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   railway logs --tail
   
   # Verify environment variables
   railway variables
   
   # Check build configuration
   railway run npm run build:inspector
   railway run npm run build:admin
   
   # Verify dependencies
   railway run npm audit
   ```

2. **Domain Issues**
   ```bash
   # Check domain status
   railway status
   
   # Verify DNS propagation
   dig app.doublecheckverified.com
   dig admin.doublecheckverified.com
   
   # Test SSL certificates
   openssl s_client -connect app.doublecheckverified.com:443
   openssl s_client -connect admin.doublecheckverified.com:443
   
   # Check Railway domain configuration
   railway domain list
   ```

3. **Performance Issues**
   ```bash
   # Monitor resource usage
   railway metrics
   
   # Check scaling settings
   railway info
   
   # Analyze bundle sizes
   npm run build:inspector:analyze
   npm run build:admin:analyze
   
   # Check memory usage
   railway logs --filter="memory"
   ```

4. **Database Connection Issues**
   ```bash
   # Test database connectivity
   railway run npm run db:test
   
   # Check connection pool
   railway logs --filter="database"
   
   # Verify Supabase status
   curl -I https://[your-supabase-url].supabase.co/rest/v1/
   ```

5. **AI Service Issues**
   ```bash
   # Check OpenAI API status
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   
   # Monitor AI service logs
   railway logs --filter="openai"
   
   # Check rate limits
   railway run npm run ai:test
   ```

### Debug Commands

```bash
# General debugging
railway logs --tail --service=inspector
railway logs --tail --service=admin

# Environment debugging
railway variables --service=inspector
railway variables --service=admin

# Build debugging
railway run --service=inspector npm run build:debug
railway run --service=admin npm run build:debug

# Health check debugging
curl -v https://app.doublecheckverified.com/health
curl -v https://admin.doublecheckverified.com/health

# Performance debugging
railway metrics --service=inspector
railway metrics --service=admin
```

## Best Practices

### Security

**Environment Security:**
- Keep API keys in Railway environment variables
- Use different Sentry projects for each service
- Enable appropriate CSP headers for each domain
- Regular security audits and dependency updates
- Implement rate limiting and DDoS protection
- Use HTTPS-only with HSTS headers

**Access Control:**
- Implement proper RBAC for Railway projects
- Use service-specific API keys
- Enable audit logging for all deployments
- Regular access review and key rotation

**Data Protection:**
- Encrypt sensitive data at rest
- Use secure communication protocols
- Implement proper input validation
- Regular vulnerability scanning

### Performance

**Monitoring:**
- Monitor bundle sizes regularly
- Use Railway's built-in metrics
- Set up alerts for performance degradation
- Regular performance testing on mobile devices

**Optimization:**
- Implement code splitting and lazy loading
- Use CDN for static assets
- Optimize images and media files
- Monitor Core Web Vitals

**Scaling:**
- Set appropriate resource limits
- Use auto-scaling based on metrics
- Monitor resource utilization
- Plan for traffic spikes

### Maintenance

**Deployment:**
- Deploy during low-traffic periods
- Test in staging environment first
- Monitor logs during deployment
- Have rollback plan ready

**Monitoring:**
- Set up comprehensive logging
- Implement health checks
- Monitor error rates and response times
- Set up alerting for critical issues

**Documentation:**
- Keep deployment documentation updated
- Document configuration changes
- Maintain runbook for common issues
- Regular review and updates

### Development Workflow

**CI/CD Pipeline:**
- Automated testing before deployment
- Security scanning in pipeline
- Performance testing integration
- Automated rollback on failure

**Quality Gates:**
- Code review requirements
- Security checklist compliance
- Performance benchmarks
- Documentation updates

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy STR Certified

on:
  push:
    branches: [main]

jobs:
  deploy-inspector:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway/cli@v3
        with:
          command: deploy --config railway.inspector.json
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_INSPECTOR }}

  deploy-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway/cli@v3
        with:
          command: deploy --config railway.admin.json
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN_ADMIN }}
```

## Support

For deployment issues:
1. Check Railway logs: `railway logs --tail`
2. Verify environment variables: `railway variables`
3. Review build output: `railway build logs`
4. Contact team via internal channels

## Security Considerations

### Environment-Specific Security

**Production Environment:**
- All secrets stored in Railway environment variables
- HTTPS enforced with HSTS headers
- CSP headers configured for each domain
- Rate limiting enabled on all endpoints
- DDoS protection through Railway

**Development Environment:**
- Separate API keys for development
- Local environment variables for testing
- Development-specific logging levels
- Test data isolation

### Compliance

**Data Protection:**
- GDPR compliance for EU users
- CCPA compliance for California users
- SOC 2 Type II certification
- Regular security audits

**Industry Standards:**
- OWASP Top 10 compliance
- ISO 27001 security standards
- PCI DSS for payment processing
- HIPAA considerations for sensitive data

## Performance Optimization

### Bundle Optimization

**Inspector App:**
```javascript
// Vite configuration for inspector build
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'camera-vendor': ['camera-lib'],
          'offline-vendor': ['service-worker-lib'],
          'ui-vendor': ['react', 'react-dom']
        }
      }
    },
    target: ['es2019', 'safari12'],
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

**Admin App:**
```javascript
// Vite configuration for admin build
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'analytics-vendor': ['analytics-lib'],
          'charts-vendor': ['chart-lib'],
          'ui-vendor': ['react', 'react-dom']
        }
      }
    },
    target: ['es2020', 'chrome80'],
    cssCodeSplit: true,
    minify: 'terser'
  }
});
```

### CDN Configuration

**Static Assets:**
- Images: WebP format with fallbacks
- Fonts: Preload critical fonts
- Scripts: Async/defer loading
- CSS: Critical CSS inlining

**Cache Strategy:**
- Static assets: 1 year cache
- API responses: 5 minutes cache
- HTML: No cache
- Service worker: Update on deployment

## Monitoring & Alerting

### Key Metrics to Monitor

**Inspector App:**
- Page load time < 2.5s
- Time to interactive < 3s
- First contentful paint < 1.5s
- Cumulative layout shift < 0.1
- Error rate < 0.1%

**Admin App:**
- Dashboard load time < 1s
- API response time < 500ms
- Data visualization render time < 2s
- Error rate < 0.05%

### Alerting Configuration

```yaml
# Railway monitoring configuration
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 1%"
    notification: "slack-webhook"
    
  - name: "High Response Time"
    condition: "response_time > 2s"
    notification: "email"
    
  - name: "Low Memory"
    condition: "memory_usage > 90%"
    notification: "pagerduty"
    
  - name: "High CPU"
    condition: "cpu_usage > 80%"
    notification: "slack-webhook"
```

## Changelog

- **v1.0.0**: Initial dual-domain deployment setup
- **v1.1.0**: Added PWA support for inspector app
- **v1.2.0**: Enhanced monitoring and alerting
- **v1.3.0**: Added performance optimization configurations
- **v1.4.0**: Enhanced security and compliance features
- **v1.5.0**: Added comprehensive troubleshooting guide
- **v1.6.0**: Improved CI/CD integration and automation