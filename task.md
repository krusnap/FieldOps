# Employee Login — Task Tracker

## Component 2: Backend Auth Service
- [x] Create `backend/package.json` with all dependencies
- [x] Create `backend/tsconfig.json`
- [x] Create `backend/.env` with Supabase keys
- [x] Create `backend/src/index.ts` — Express server bootstrap
- [x] Create `backend/src/config/supabase.ts` — Supabase admin client
- [x] Create `backend/src/middleware/authenticate.ts` — JWT verification
- [x] Create `backend/src/middleware/requireRole.ts` — RBAC factory
- [x] Create `backend/src/middleware/rateLimiter.ts` — Rate limiting
- [x] Create `backend/src/modules/auth/auth.router.ts` — Auth endpoints
- [x] Create `backend/src/utils/AppError.ts` — Custom error class
- [x] Create `backend/src/utils/logger.ts` — Winston logger
- [x] Create `backend/migrations/001_users_table.sql` — DB schema

## Component 3: Mobile App Auth
- [ ] Create `app/src/lib/supabase.ts` — Supabase client
- [ ] Create `app/src/services/api.ts` — Axios API service (missing file!)
- [ ] Modify `app/src/screens/LoginScreen.tsx` — Employee ID → Email
- [ ] Modify `app/src/context/FieldOpsContext.tsx` — Real Supabase auth
- [ ] Modify `app/src/types/fieldOps.ts` — Add email field

## Component 4: Web Dashboard Fix
- [ ] Create `web/src/lib/supabase.ts` — Missing Supabase client
- [ ] Create `web/.env` — Supabase env vars
- [ ] Verify `useRoleAccess.tsx` works with new client

## Verification
- [ ] TypeScript: `tsc --noEmit` on all packages
- [ ] Backend: Start dev server, test endpoints
- [ ] Mobile: Verify login flow compiles
- [ ] Web: Verify login flow compiles
