# STR Certified - Property Inspection Platform

A modern, mobile-first property inspection platform for short-term rental certification. Built with Next.js 14, TypeScript, and Prisma.

## 🚀 Features

- **Mobile-First Inspector App**: Optimized for field inspections on mobile devices
- **Progressive Web App**: Works offline with background sync
- **AI-Powered Validation**: Integrated Claude API for automated inspection validation
- **Real-time Collaboration**: Multiple inspectors can work together
- **Property Scraping**: Automated VRBO/Airbnb data collection
- **Comprehensive Reporting**: Generate detailed inspection reports

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, tRPC
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Upload**: UploadThing
- **AI**: Claude API
- **Deployment**: Docker, Vercel/AWS

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm 8+
- Redis (optional, for production)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd str-certified
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   - Database URL
   - NextAuth secret (generate with `openssl rand -base64 32`)
   - OAuth credentials (optional)
   - Claude API key

4. **Set up the database**
   ```bash
   # Create database
   createdb str_certified

   # Run migrations
   pnpm db:migrate

   # Seed with sample data
   pnpm db:seed
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The app will be available at http://localhost:3000

## 🔐 Default Login Credentials

After seeding the database, you can log in with:

- **Admin**: admin@strcertified.com / admin123
- **Inspector**: john@strcertified.com / inspector123
- **Inspector**: jane@strcertified.com / inspector123

## 📱 Mobile Development

For the best mobile development experience:

1. Use Chrome DevTools device emulation
2. Enable touch simulation
3. Test offline functionality in DevTools Network tab
4. Use ngrok for testing on real devices:
   ```bash
   ngrok http 3000
   ```

## 🏗️ Project Structure

```
str-certified/
├── apps/
│   ├── web/              # Next.js main application
│   ├── scraper/          # Scraper microservice (future)
│   └── worker/           # Background job processor (future)
├── packages/
│   ├── database/         # Prisma schema and migrations
│   ├── ui/               # Shared UI components
│   └── utils/            # Shared utilities
```

## 🚀 Deployment

### Docker

```bash
# Build the image
docker build -t str-certified .

# Run with docker-compose
docker-compose up -d
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📝 API Documentation

The API uses tRPC for type-safe API calls. Main routers:

- `/api/trpc/property.*` - Property management
- `/api/trpc/inspection.*` - Inspection workflows
- `/api/trpc/scraper.*` - Web scraping jobs
- `/api/trpc/checklist.*` - Checklist item management
- `/api/trpc/media.*` - File uploads

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT

## 🆘 Support

For issues and feature requests, please use GitHub Issues.

---

Built with ❤️ for property managers and inspectors