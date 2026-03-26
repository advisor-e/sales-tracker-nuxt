# Sales Tracker Nuxt

A full-stack sales tracking application built with Nuxt 3, Prisma, and MySQL.

## Tech Stack

- **Framework**: Nuxt 3.21+ (Vue 3.5+, Nitro 2.13+, Vite 7.3+)
- **Database**: MySQL with Prisma ORM
- **Auth**: Session-based authentication with hashed tokens
- **AI**: OpenAI integration for blog generation
- **i18n**: Vue I18n for internationalization
- **Charts**: Chart.js with vue-chartjs

## Project Structure

```
├── components/       # Vue components (auto-imported)
├── composables/      # Vue composables (useAuth, useLists)
├── pages/            # File-based routing
│   ├── index.vue     # Main entry/landing
│   ├── login.vue     # Authentication
│   ├── dashboard.vue # Metrics dashboard
│   ├── pipeline.vue  # Sales pipeline management
│   ├── coi.vue       # Centers of Influence
│   ├── lists.vue     # List management
│   ├── team.vue      # Team overview
│   └── home.vue      # Home view
├── server/
│   ├── api/          # API routes (Nitro)
│   │   ├── auth/     # login, logout, me
│   │   ├── blog/     # generate, inputs, posts, references
│   │   ├── coi/      # COI CRUD + summary
│   │   ├── dashboard/# metrics
│   │   ├── lists/    # dropdown lists
│   │   ├── pipeline/ # pipeline CRUD
│   │   └── team/     # team summary
│   ├── middleware/   # Server middleware
│   └── utils/        # Server utilities (Prisma client)
├── plugins/          # Nuxt plugins (i18n, csrf)
├── prisma/           # Database schema
├── middleware/       # Route middleware
├── scripts/          # Utility scripts
└── types/            # TypeScript types
```

## Commands

```bash
# Development
npm run dev           # Start dev server (typically port 3000/3001)

# Database
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Open Prisma Studio GUI

# Build
npm run build         # Production build
npm run preview       # Preview production build

# Scripts
npm run auth:create-admin     # Create admin user
npm run import:app-config     # Import app configuration
npm run import:workbook       # Import Excel workbook data
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - MySQL connection string
- `OPENAI_API_KEY` - For blog generation features
- `ADMIN_EMAIL` - Initial admin email
- `ADMIN_PASSWORD` - Initial admin password

## Database Models

- **User** - Users with roles (firm_manager, advisor)
- **Session** - Auth sessions with token hashes
- **PipelineEntry** - Sales pipeline prospects
- **CoiEntry** - Centers of Influence contacts
- **BlogInput/BlogPost/BlogReference** - Blog content system
- **AppConfig** - User-specific configuration
- **AuditLog** - Activity tracking

## API Conventions

- Routes follow Nuxt/Nitro file naming: `[method].ts` or `index.[method].ts`
- All routes requiring auth use server middleware
- CRUD operations: GET (list), POST (create), PATCH (update), DELETE (remove)
- Dynamic params use `[id]` in filename

## Development Guidelines

1. **Components**: Use auto-import, no explicit imports needed
2. **Composables**: Prefix with `use` (useAuth, useLists)
3. **API Routes**: Place in appropriate subdirectory under `server/api/`
4. **Types**: Define in `types/` directory
5. **Styling**: Inline styles or scoped `<style>` blocks
6. **Auth**: Check session via `useAuth()` composable client-side

## Git Remote

- Origin: https://github.com/advisor-e/sales-tracker-nuxt.git
