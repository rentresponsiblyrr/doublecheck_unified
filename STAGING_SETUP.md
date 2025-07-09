# 🧪 STR Certified Staging Environment Setup Guide

## **Overview**
This guide walks you through setting up a complete staging environment for STR Certified that mirrors production while safely isolating staging data. The staging environment includes database setup, automated deployments, test data generation, and comprehensive monitoring.

## **🏗️ Architecture Overview**

### **Environment Structure**
- **Production**: `doublecheckverified.com` (Railway + Supabase Production)
- **Staging**: `staging.doublecheckverified.com` (Railway + Supabase Staging)
- **Development**: `localhost:5173` (Local + Supabase Development)

### **Domain Setup**
- **Inspector App**: `app-staging.doublecheckverified.com`
- **Admin Dashboard**: `admin-staging.doublecheckverified.com`
- **Unified Entry**: `staging.doublecheckverified.com`

## **📋 Prerequisites**

### **Required Accounts & Tools**
- [x] Railway account with project access
- [x] Supabase account with project creation permissions
- [x] GitHub repository with Actions enabled
- [x] OpenAI API key (shared with production)
- [x] Node.js 18+ and npm 9+

### **Required Environment Variables**
```bash
# Staging Supabase (NEW PROJECT)
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key
STAGING_SUPABASE_PROJECT_REF=your-staging-ref

# Shared API Keys
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Railway Configuration
RAILWAY_TOKEN=your-railway-token

# Monitoring & Alerts
STAGING_SENTRY_DSN=https://your-staging-sentry-dsn@sentry.io
STAGING_SLACK_WEBHOOK=https://hooks.slack.com/services/your/staging/webhook
```

## **🚀 Step-by-Step Setup**

### **Phase 1: Database Setup (30 minutes)**

#### **1.1 Create Staging Supabase Project**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `str-certified-staging`
4. Choose same region as production
5. Generate strong password and save it securely
6. Wait for project creation (5-10 minutes)

#### **1.2 Enable Required Extensions**
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

#### **1.3 Run Database Migrations**
```bash
# Set staging project reference
export STAGING_PROJECT_REF="your-staging-ref"

# Run all migrations
npm run db:migrate:staging

# Or manually with supabase CLI
supabase db push --project-ref $STAGING_PROJECT_REF
```

#### **1.4 Seed Essential Data**
```bash
# Set environment variables
export STAGING_SUPABASE_URL="https://your-staging-project.supabase.co"
export STAGING_SUPABASE_ANON_KEY="your_staging_anon_key"

# Run seeding script
npm run db:seed:staging
```

### **Phase 2: Railway Deployment (20 minutes)**

#### **2.1 Create Railway Staging Service**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Create new project or add service to existing project
3. Name: `str-certified-staging`
4. Connect to GitHub repository
5. Set branch: `staging`
6. Use configuration: `railway.staging.json`

#### **2.2 Configure Environment Variables**
```bash
# In Railway dashboard, add these variables:
NODE_ENV=staging
VITE_APP_ENV=staging
VITE_LOG_LEVEL=debug

# Database
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key

# APIs
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Monitoring
STAGING_SENTRY_DSN=https://your-staging-sentry-dsn@sentry.io
STAGING_SLACK_WEBHOOK=https://hooks.slack.com/services/your/staging/webhook
```

#### **2.3 Set Up Custom Domains**
1. Add domains in Railway dashboard:
   - `app-staging.doublecheckverified.com`
   - `admin-staging.doublecheckverified.com`
   - `staging.doublecheckverified.com`
2. Configure DNS in your domain provider
3. Wait for SSL certificate provisioning

### **Phase 3: CI/CD Pipeline (15 minutes)**

#### **3.1 Configure GitHub Secrets**
Add these secrets to your GitHub repository:
```bash
# Supabase
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_SUPABASE_PROJECT_REF
SUPABASE_ACCESS_TOKEN

# Railway
RAILWAY_TOKEN

# APIs
OPENAI_API_KEY
GOOGLE_MAPS_API_KEY

# Monitoring
STAGING_SENTRY_DSN
STAGING_SLACK_WEBHOOK

# Test Users
STAGING_TEST_USER_EMAIL
STAGING_TEST_USER_PASSWORD
STAGING_TEST_ADMIN_EMAIL
STAGING_TEST_ADMIN_PASSWORD
```

#### **3.2 Create Staging Branch**
```bash
# Create and push staging branch
git checkout -b staging
git push origin staging
```

#### **3.3 Test Deployment**
The GitHub Actions workflow will automatically:
- Run tests and quality checks
- Build staging application
- Deploy to Railway staging
- Run E2E tests
- Send notifications

### **Phase 4: Test Data Generation (10 minutes)**

#### **4.1 Generate Realistic Test Data**
```bash
# Generate comprehensive test data
npm run generate:test-data

# This creates:
# - 100 realistic properties
# - 30 test users (inspectors/auditors)
# - 150 sample inspections
# - 1000+ checklist items
# - 500 media files
# - 200 audit feedback entries
# - 50 knowledge base entries
```

#### **4.2 Verify Data Generation**
1. Check Supabase staging dashboard
2. Verify data in each table
3. Test login with generated users
4. Confirm AI features work with test data

### **Phase 5: Testing & Validation (20 minutes)**

#### **5.1 Functional Testing**
```bash
# Run staging tests
npm run test:staging

# Run E2E tests
npm run test:e2e:staging
```

#### **5.2 Manual Testing Checklist**
- [ ] Inspector app loads at `app-staging.doublecheckverified.com`
- [ ] Admin dashboard loads at `admin-staging.doublecheckverified.com`
- [ ] User authentication works
- [ ] Property selection functions
- [ ] AI photo analysis works
- [ ] Inspection workflow completes
- [ ] Audit dashboard shows data
- [ ] AI learning dashboard displays metrics

#### **5.3 Performance Validation**
- [ ] Page load times < 3 seconds
- [ ] API responses < 500ms
- [ ] AI photo analysis < 5 seconds
- [ ] Database queries optimized
- [ ] Memory usage stable

## **🔧 Daily Operations**

### **Development Workflow**
1. **Feature Development**: Work on feature branches
2. **Staging Testing**: Merge to `staging` branch for testing
3. **QA Approval**: QA team tests features in staging
4. **Production Deployment**: Merge approved features to `main`

### **Test Data Management**
```bash
# Refresh test data weekly
npm run refresh:test-data

# Cleanup old data
npm run cleanup:test-data

# Full reset (use sparingly)
npm run staging:reset
```

### **Monitoring & Maintenance**
```bash
# Check system health
npm run health:check

# View staging logs
railway logs --service str-certified-staging

# Database maintenance
npm run db:maintenance:staging
```

## **🛡️ Security Considerations**

### **Data Protection**
- **No Production Data**: Never copy real user data to staging
- **Anonymized Testing**: All test data is synthetic
- **Separate Credentials**: Staging uses different API keys where possible
- **Access Control**: Limit staging access to development team

### **Environment Isolation**
- **Separate Databases**: Complete isolation from production
- **Rate Limiting**: AI API usage limits prevent cost overruns
- **Monitoring**: Separate error tracking and alerting
- **Cleanup**: Automatic deletion of old test data

## **💰 Cost Optimization**

### **Resource Management**
- **Smaller Instances**: 0.5 CPU, 512MB RAM for staging
- **Automated Scaling**: Scale down during off-hours
- **Data Retention**: 30-day retention for test data
- **Storage Cleanup**: Regular cleanup of test media files

### **Budget Controls**
- **Usage Alerts**: Monitor API usage and database size
- **Spending Limits**: Set up alerts for unexpected costs
- **Resource Monitoring**: Track Railway and Supabase usage

## **📊 Available Scripts**

### **Development Scripts**
```bash
npm run dev:staging          # Start development server in staging mode
npm run build:staging        # Build for staging deployment
npm run preview:staging      # Preview staging build locally
npm run test:staging         # Run tests in staging mode
```

### **Database Scripts**
```bash
npm run db:migrate:staging   # Run database migrations
npm run db:reset:staging     # Reset staging database
npm run db:seed:staging      # Seed essential data
npm run staging:setup        # Full staging setup
npm run staging:reset        # Complete reset
```

### **Data Management Scripts**
```bash
npm run generate:test-data   # Generate realistic test data
npm run refresh:test-data    # Refresh test data
npm run cleanup:test-data    # Clean up old test data
```

### **Deployment Scripts**
```bash
npm run deploy:staging       # Deploy to staging
npm run start:staging        # Start staging server
npm run health:check         # Check system health
```

## **🔍 Testing Scenarios**

### **Happy Path Testing**
1. **Inspector Workflow**:
   - Login as inspector
   - Select property
   - Generate AI checklist
   - Capture photos with AI analysis
   - Complete inspection
   - Verify data sync

2. **Auditor Workflow**:
   - Login as auditor
   - Review pending inspections
   - Provide feedback
   - Verify AI learning integration
   - Generate reports

### **Edge Case Testing**
- **Offline Mode**: Test offline functionality
- **Network Failures**: Test error handling
- **Large Files**: Test media upload limits
- **Concurrent Users**: Test multi-user scenarios
- **AI Failures**: Test AI service fallbacks

### **Performance Testing**
- **Load Testing**: 50+ concurrent users
- **Stress Testing**: High-volume photo uploads
- **Endurance Testing**: 24-hour continuous operation
- **Resource Usage**: Monitor memory and CPU

## **🚨 Troubleshooting**

### **Common Issues**

#### **Database Connection Errors**
```bash
# Check Supabase project status
# Verify environment variables
# Test connection manually
```

#### **AI Service Failures**
```bash
# Check OpenAI API key
# Verify rate limits
# Test fallback mechanisms
```

#### **Deployment Failures**
```bash
# Check Railway logs
# Verify GitHub secrets
# Test build locally
```

### **Emergency Procedures**

#### **Staging Down**
1. Check Railway service status
2. Review recent deployments
3. Rollback if necessary
4. Notify team via Slack

#### **Database Issues**
1. Check Supabase dashboard
2. Review recent migrations
3. Restore from backup if needed
4. Contact database admin

## **📞 Support & Contacts**

### **Key Personnel**
- **Technical Lead**: [Your Name]
- **DevOps**: [DevOps Contact]
- **QA Lead**: [QA Contact]

### **Service Providers**
- **Railway**: [Railway Support]
- **Supabase**: [Supabase Support]
- **OpenAI**: [OpenAI Support]

## **🎯 Success Metrics**

### **Deployment Success**
- [ ] Zero-downtime deployments
- [ ] <5 minute deployment time
- [ ] Automated health checks pass
- [ ] E2E tests pass rate >95%

### **System Performance**
- [ ] 99.9% uptime
- [ ] <3 second page load times
- [ ] <500ms API response times
- [ ] <5 second AI processing times

### **Developer Experience**
- [ ] Feature testing time <30 minutes
- [ ] Bug reproduction rate >90%
- [ ] Documentation completeness >95%
- [ ] Team satisfaction >4.5/5

---

## **🎉 You're Ready!**

Your staging environment is now fully configured and ready for testing. The system provides:

✅ **Safe Testing Environment**: Test changes without affecting production  
✅ **Automated Deployments**: Seamless CI/CD pipeline  
✅ **Realistic Data**: Comprehensive test data for all scenarios  
✅ **Performance Monitoring**: Complete observability  
✅ **Cost Control**: Optimized resource usage  
✅ **Security**: Isolated and protected environment  

Happy testing! 🚀