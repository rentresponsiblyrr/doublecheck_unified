# 🏡 STR Certified - AI-Powered Vacation Rental Inspection Platform

*Revolutionizing vacation rental quality assurance through intelligent automation and mobile-first design.*

## 🌟 **Project Overview**

STR Certified is an enterprise-grade AI-powered inspection platform that transforms how vacation rental properties are evaluated for quality and compliance. Built for inspectors, auditors, and property managers, it combines cutting-edge artificial intelligence with mobile-optimized workflows to deliver accurate, efficient, and comprehensive property assessments.

### **🎯 Core Value Proposition**

- **🚀 3x Faster Inspections** - Complete comprehensive inspections in under 45 minutes
- **🎯 90%+ AI Accuracy** - Machine learning that matches expert auditor assessments  
- **📱 Mobile-First Design** - Optimized for field workers using smartphones and tablets
- **🧠 Continuous Learning** - AI that improves with every inspection and auditor feedback
- **🔒 Enterprise Security** - Bank-grade security protecting sensitive property data

## 🏗️ **System Architecture**

### **Technology Stack**
```
📱 Frontend    React 18 + TypeScript + Vite + Tailwind CSS
🗄️ Backend     Supabase (PostgreSQL + Real-time + Auth + Storage)
🤖 AI Engine   OpenAI GPT-4V + Custom Learning Models + RAG System
📡 Real-time   WebSocket connections for live collaboration
🚀 Deployment  Railway with Docker containerization
📊 Analytics   Performance monitoring and business intelligence
```

### **Core Components**

#### **🔍 Intelligent Inspection Engine**
- **Dynamic Checklist Generation** - AI creates property-specific inspection items based on scraped amenities
- **Photo Analysis & Comparison** - Compare inspector photos to listing photos for discrepancy detection
- **Real-time Quality Assessment** - Instant feedback on photo quality and compliance
- **Video Walkthrough Processing** - AI-enhanced video analysis with scene detection

#### **📱 Mobile-Optimized Interface**
- **Offline-First Architecture** - Complete inspections without internet connectivity
- **Touch-Friendly Controls** - Designed for one-handed operation during inspections
- **Camera Integration** - Professional photo capture with guidance and validation
- **Progressive Web App** - Native app experience without app store deployment

#### **🧠 Learning & Analytics System**
- **Auditor Feedback Loop** - Continuous AI improvement from expert corrections
- **Performance Analytics** - Track accuracy trends and system performance
- **Knowledge Base Integration** - Building codes and safety regulations embedded
- **Predictive Insights** - Identify patterns and optimize inspection processes

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ with npm or yarn
- Modern web browser (Chrome 90+, Safari 14+, Firefox 88+)
- Supabase account for backend services
- OpenAI API access for AI features

### **Quick Start**

1. **Clone and Install**
```bash
git clone https://github.com/your-org/str-certified.git
cd str-certified
npm install
```

2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
VITE_APP_VERSION=1.0.0
```

3. **Database Setup**
```bash
# Connect to hosted Supabase instance
# Production schema uses direct table access (no compatibility layer)

# Important: Migration completed July 17, 2025
# All compatibility views have been removed from the codebase
# Application now uses direct production table access
```

4. **Development Server**
```bash
npm run dev
# Open http://localhost:5173
```

### **Development Commands**

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run type-check      # Run TypeScript type checking
npm run lint            # Run ESLint
npm run test            # Run unit tests
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run end-to-end tests
```

## 📁 **Project Structure**

```
str-certified/
├── 📁 src/
│   ├── 📁 components/          # React components
│   │   ├── 📁 admin/           # Admin dashboard components
│   │   ├── 📁 ai/              # AI analysis components
│   │   ├── 📁 audit/           # Audit workflow components
│   │   ├── 📁 mobile/          # Mobile-optimized components
│   │   ├── 📁 photo/           # Photo capture/analysis
│   │   ├── 📁 scrapers/        # Property scraping components
│   │   ├── 📁 ui/              # Shared UI components
│   │   └── 📁 video/           # Video recording/review
│   ├── 📁 hooks/               # Custom React hooks
│   ├── 📁 lib/                 # Utility libraries
│   │   ├── 📁 ai/              # AI service integrations
│   │   ├── 📁 config/          # Configuration utilities
│   │   ├── 📁 integration/     # External API integrations
│   │   ├── 📁 monitoring/      # Performance monitoring
│   │   └── 📁 optimization/    # Performance optimizations
│   ├── 📁 pages/               # Page components
│   ├── 📁 services/            # API services
│   ├── 📁 types/               # TypeScript type definitions
│   └── 📁 utils/               # Utility functions
├── 📁 public/                  # Static assets
├── 📁 docs/                    # Documentation
├── 📁 tests/                   # Test files
├── 🔧 vite.config.ts           # Vite configuration
├── 🔧 tailwind.config.js       # Tailwind CSS configuration
├── 🔧 tsconfig.json            # TypeScript configuration
├── 🔧 eslint.config.js         # ESLint configuration
├── 🔧 vitest.config.ts         # Test configuration
├── 🔧 railway.json             # Railway deployment config
├── 🔧 Dockerfile               # Docker configuration
├── 📋 package.json             # Project dependencies
├── 📋 CLAUDE.md                # AI coding context and guidelines (updated post-migration)
├── 📋 MIGRATION.md             # Database compatibility layer migration documentation
├── 🗄️ database_cleanup.sql     # SQL script for removing compatibility layer
├── 📋 AI_CODING_STANDARDS.md   # AI development standards
├── 📋 ARCHITECTURE_GUIDE.md    # System architecture documentation
├── 📋 COMPONENT_PATTERNS.md    # Component patterns and examples
├── 📋 TESTING_STANDARDS.md     # Testing guidelines
└── 📋 SECURITY_GUIDELINES.md   # Security best practices
```

## 🛠️ **Development Guidelines**

### **Code Quality Standards**
- **TypeScript Strict Mode** - No 'any' types allowed
- **ESLint + Prettier** - Automated code formatting
- **Comprehensive Testing** - Unit, integration, and E2E tests
- **Security First** - Input validation and sanitization
- **Accessibility** - WCAG 2.1 AA compliance
- **Performance** - Mobile-first optimization

### **Architecture Principles**
- **Domain-Driven Design** - Organized by business domains
- **Component-Based** - Reusable and testable components
- **Responsive Design** - Mobile-first approach
- **Offline-First** - Progressive Web App capabilities
- **Security by Design** - Built-in security controls

### **AI Development Standards**
- **Production-Ready Code** - Enterprise-grade quality
- **Comprehensive Documentation** - Self-documenting code
- **Error Handling** - Graceful failure management
- **Performance Optimization** - Mobile device optimization
- **Accessibility Integration** - Built-in accessibility features

### **Documentation Standards**
The project includes comprehensive documentation for AI-assisted development:
- `CLAUDE.md` - Primary context and coding guidelines (updated July 17, 2025)
- `MIGRATION.md` - Complete database compatibility layer migration documentation
- `database_cleanup.sql` - SQL script for removing compatibility views from database
- `AI_CODING_STANDARDS.md` - Detailed AI development standards
- `COMPONENT_PATTERNS.md` - Reusable component patterns
- `TESTING_STANDARDS.md` - Testing guidelines and examples
- `SECURITY_GUIDELINES.md` - Security best practices

### **Database Migration (Phase 4 Complete) ✅**
**Important:** This project completed a major database compatibility layer migration on July 17, 2025:
- ✅ **110+ files migrated** from compatibility layer to direct production table access
- ✅ **200+ references updated** across the entire codebase
- ✅ **Zero compatibility dependencies** remaining
- ✅ **Database cleanup completed** - Compatibility views removed from Supabase
- ✅ **404 errors resolved** - Application fully functional
- ✅ **Inspection workflow restored** - Critical fixes deployed

## 🚀 **Production Deployment**

### **Railway Deployment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy to Railway
railway login
railway init
railway add
railway deploy
```

### **Environment Variables for Production**
```bash
# Set production environment variables
railway env set VITE_SUPABASE_URL=your_production_supabase_url
railway env set VITE_SUPABASE_ANON_KEY=your_production_anon_key
railway env set OPENAI_API_KEY=your_openai_api_key
```

## 👥 **User Workflows**

### **🔍 Inspector Experience**
1. **Property Selection** - Choose assigned property with auto-loaded listing data
2. **Smart Checklist** - AI-generated inspection items based on property amenities
3. **Guided Photo Capture** - Reference photos shown with quality feedback
4. **Video Walkthrough** - Record comprehensive property overview
5. **Offline Sync** - Complete inspections without internet, sync when available

### **👨‍💼 Auditor Experience**
1. **Review Queue** - Prioritized inspections with AI pre-screening
2. **Video Analysis** - AI-generated timestamps and scene detection
3. **Photo Comparison** - Side-by-side listing vs inspection photos
4. **Structured Feedback** - Provide corrections that improve AI accuracy
5. **Report Generation** - Automated PDF reports for property managers

### **🏠 Property Manager Experience**
1. **Automated Reports** - Receive comprehensive PDF reports via email
2. **Pass/Fail Status** - Clear compliance status with photo evidence
3. **Improvement Recommendations** - AI-suggested enhancements for guest experience
4. **Historical Tracking** - Track property condition trends over time

## 🧠 **AI Features & Capabilities**

### **🔍 Photo Analysis Engine**
- **Feature Detection** - Identify amenities, furniture, and safety equipment
- **Condition Assessment** - Evaluate cleanliness, damage, and maintenance needs
- **Compliance Checking** - Verify safety regulations and building codes
- **Discrepancy Identification** - Compare against listing photos for accuracy

### **📊 Learning & Improvement**
- **Auditor Feedback Integration** - Learn from expert corrections and annotations
- **Pattern Recognition** - Identify property-type specific inspection patterns
- **Confidence Scoring** - Provide accuracy predictions for AI assessments
- **Performance Tracking** - Monitor and report improvement metrics

### **📚 Knowledge Base & RAG**
- **Building Codes** - Embedded safety regulations and compliance standards
- **Best Practices** - Industry standards for vacation rental quality
- **Contextual Recommendations** - Relevant suggestions based on property type
- **Regulatory Updates** - Quarterly updates to safety and compliance knowledge

## 📱 **Mobile Optimization**

### **Performance Targets**
- **Page Load Time**: <2 seconds on 3G networks
- **Photo Capture**: <1 second response time
- **Offline Capability**: 8+ hours of inspection without connectivity
- **Battery Efficiency**: <20% drain for full day inspections

### **Device Compatibility**
- **iOS Safari 14+** (iPhone 8 and newer)
- **Android Chrome 90+** (Android 8.0 and newer)
- **Progressive Web App** - Add to home screen capability
- **Responsive Design** - Optimized for phones, tablets, and desktop

## 🔒 **Security & Compliance**

### **Data Protection**
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Authentication**: Multi-factor authentication with session management
- **Authorization**: Role-based access control with audit logging
- **Privacy**: GDPR and CCPA compliant data handling

### **API Security**
- **Rate Limiting**: 100 requests per minute per user
- **Input Validation**: Comprehensive validation and sanitization
- **CORS Policy**: Strict cross-origin resource sharing
- **API Keys**: Secure key management with rotation capabilities

## 📊 **Performance & Analytics**

### **System Metrics**
- **Uptime**: 99.9% availability target
- **Response Time**: <500ms API responses
- **Error Rate**: <0.1% of requests
- **Scalability**: 1,000+ concurrent users

### **Business Analytics**
- **Inspector Productivity**: Average inspections per day
- **AI Accuracy Trends**: Improvement metrics over time
- **User Satisfaction**: Net Promoter Score tracking
- **Cost Efficiency**: AI processing costs per inspection

## 🧪 **Testing & Quality Assurance**

### **Testing Strategy**
```bash
# Unit Tests
npm run test:unit

# Integration Tests  
npm run test:integration

# End-to-End Tests
npm run test:e2e

# Performance Tests
npm run test:performance
```

### **Quality Gates**
- **Code Coverage**: >90% for critical paths
- **TypeScript**: Strict mode with no 'any' types
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: Automated vulnerability scanning

## 📚 **Documentation & Support**

### **Technical Documentation**
- **API Reference** - Complete API documentation
- **Component Library** - Reusable component guide
- **Deployment Guide** - Production deployment instructions
- **Security Guide** - Security implementation details

### **User Guides**
- **Inspector Handbook** - Mobile inspection workflows
- **Auditor Manual** - Review and quality assurance
- **Admin Guide** - System administration and analytics

## 🤝 **Contributing**

### **Development Workflow**
1. **Fork & Clone** - Create your feature branch from `main`
2. **Environment Setup** - Follow the Getting Started guide
3. **Development** - Implement features following our coding standards
4. **Testing** - Ensure all tests pass and coverage targets met
5. **Security Review** - Validate security checklist compliance
6. **Code Review** - Submit PR with comprehensive description and tests

### **Coding Standards**
- **TypeScript Strict Mode** - No 'any' types in production code
- **Security First** - Follow `SECURITY_GUIDELINES.md` requirements
- **Mobile Optimized** - Test on real devices, minimum 44px touch targets
- **Accessible** - WCAG 2.1 AA compliance required
- **Performance** - Meet Core Web Vitals targets
- **Documentation** - Update relevant documentation files

### **Pull Request Guidelines**
- **Clear Title** - Descriptive title summarizing changes
- **Detailed Description** - Explain what, why, and how
- **Testing Evidence** - Include test results and manual testing
- **Security Considerations** - Address any security implications
- **Performance Impact** - Document performance changes
- **Breaking Changes** - Highlight any breaking changes

### **Code Review Checklist**
Before submitting, ensure your code meets these standards:
- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Security guidelines followed
- [ ] Accessibility requirements met
- [ ] Mobile performance optimized
- [ ] Documentation updated

## 📈 **Roadmap & Future Features**

### **Phase 1: MVP (Current)**
- ✅ Core inspection workflow
- ✅ AI photo analysis
- ✅ Mobile-optimized interface
- ✅ Basic auditor review

### **Phase 2: Advanced AI (Q2 2025)**
- 🔄 Predictive maintenance recommendations
- 🔄 Market analysis and property valuation
- 🔄 Advanced video analytics
- 🔄 Multi-language support

### **Phase 3: Platform Expansion (Q3 2025)**
- 📋 Third-party integrations
- 📋 White-label solutions
- 📋 Advanced analytics dashboard
- 📋 API ecosystem for partners

## 📞 **Support**

- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue on GitHub with detailed reproduction steps
- **Email**: support@strcertified.com
- **Health Check**: Monitor system status at `/health`

## 📄 **License**

This project is licensed under the UNLICENSED License - see the LICENSE file for details.

---

**STR Certified** - Ensuring quality in short-term rental properties through AI-powered inspection technology.