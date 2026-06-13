<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Architecture Rules

- **Feature Slice Architecture**: Every feature built must follow the feature slice architecture. Code should be organized by feature (e.g., `features/[feature-name]/` or similar feature-centric directories) rather than by global technical concerns. Each feature slice should be self-contained, encapsulating its own components, hooks, business logic, API calls, and types.

## Testing Rules

- **Running E2E Tests**: When instructed to run E2E tests (`npm run test:e2e`), you must choose the appropriate workflow:
  - **Dev Workflow (Fast)**: If iterating on tests, ensure `npm run dev` is running, then execute `npm run test:e2e`. Playwright's `reuseExistingServer` will utilize the running dev server.
  - **Prod Workflow (Stable)**: If running the full test suite for verification or if encountering Next.js compiler panics, you MUST run `npm run build` first, ensure no dev server is running on port 3000, and then execute `npm run test:e2e` to test against the production build.
  - **Database Requirements**: A local PostgreSQL database must be actively running (e.g., via `npx prisma dev`). The `test:e2e` script handles its own DB seeding.

## Database & Environment Separation Rules

- **Supabase Projects Separation**:
  - **Production Environment**:
    - Project Name: `tpl-payroll`
    - Supabase Project Ref: `aacgdygsjeflnenqbdgv`
    - Target Environment in Vercel: **Production**
  - **Staging / Preview Environment**:
    - Project Name: `tpl-payroll-stage`
    - Supabase Project Ref: `zuwybpjeeiypmwhtlvbe`
    - Target Environment in Vercel: **Preview** (across all preview branches)

- **Required Environment Variables**:
  The application utilizes the server-side REST API for Supabase storage and prisma client for DB connection. Both environments require the following environment variables:
  - `DATABASE_URL`: Transaction pooler URL (host `aws-1-ap-south-1.pooler.supabase.com`, port `6543`, containing `?pgbouncer=true`).
  - `DIRECT_DATABASE_URL`: Direct database connection URL (host `aws-1-ap-south-1.pooler.supabase.com`, port `5432`).
  - `SUPABASE_URL`: `https://[project-ref].supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role API key for storage access.

- **Unused Variables**:
  - Do not use or configure client-side `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_URL` environment variables in Vercel as the app does not load any client-side Supabase libraries.

