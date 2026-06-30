# JewelCancy Angular Migration

## Version Decision

- Active frontend build is now Angular `21.2.14` with strict TypeScript, standalone components, SSR, PWA config, Tailwind CSS, Angular Material, PrimeNG, RxJS, NgRx Store/Effects/Entity/DevTools, and Angular animations.
- `npm view @angular/core version` reported Angular `22.0.4`, but stable NgRx is `21.1.1` and targets Angular `^21.0.0`. The migration uses the latest stable Angular line compatible with stable NgRx.

## Active Structure

```text
src/
  admin/
  applications/
  auth/
  blogs/
  chat/
  company/
  core/
  dashboard/
  environments/
  interview/
  jobs/
  layout/
  notification/
  resume/
  shared/
  subscription/
```

The active Angular entrypoints are `src/main.ts`, `src/main.server.ts`, `src/server.ts`, `src/app.config.ts`, and `src/app.routes.ts`. Legacy React/Vite JSX files are no longer part of the Angular compilation path and are retained only as parity reference.

## API Compatibility

- Base API URL remains `/api/v1`.
- Local development proxies `/api`, `/health`, `/uploads`, and `/socket.io` to the existing Express backend on `localhost:3000`.
- Service classes replace Axios/RTK Query with Angular `HttpClient`.
- Socket.IO client keeps the backend JWT handshake and chat events: `userOnline`, `joinChat`, `leaveChat`, `sendMessage`, `typing`, `stopTyping`, `receiveMessage`, `newMessage`, `newMessageNotification`, `userTyping`, `userStoppedTyping`, and `userStatusChange`.

## Migrated Modules

- Core: strict app config, SSR config, hydration, service worker, interceptors, loading state, i18n service, route preloading, guards, and shared models.
- Auth: login, register, email verification, forgot password, reset password, logout, JWT hydration, guest guard, auth guard, and role guard support.
- Jobs: job listing, detail, and application pages wired through `JobService`.
- Company: company listing and detail pages wired through `CompanyService`.
- Applications: API service layer for candidate/recruiter application flows.
- Chat: Socket.IO service and chat page shell with message stream support.
- Notifications: notification API service and notifications page.
- Blogs: blog listing/detail services and Angular blog page shells.
- Subscription, interview, resume, dashboard, and admin: typed service layers and guarded route shells that preserve backend endpoints.
- Layout: public and dashboard standalone layouts with lazy child routes for guest, candidate, recruiter, and admin areas.
- Deployment: Angular production build, SSR output, PWA config, Nginx static serving, Dockerfile, and Compose frontend build updates.

## Verification

- `npm run build`: passes.
- `npm run lint`: passes strict TypeScript check.
- `npm test`: passes with one Angular smoke spec when run outside the filesystem sandbox.
- Local dev server: running at `http://localhost:5173/`.

## Migration Checklist

- [x] Scan existing React routes, backend API mounts, and Socket.IO events.
- [x] Replace Vite entrypoints with Angular CLI entrypoints.
- [x] Add strict TypeScript Angular config.
- [x] Add standalone components and lazy Angular Router route tree.
- [x] Add NgRx auth/resource store, actions, reducers, selectors, effects, and entity adapters.
- [x] Replace Axios access with Angular `HttpClient` services.
- [x] Add JWT, refresh-token placeholder, loading, and auth-error interceptors.
- [x] Add route guards for guest/auth/role flows.
- [x] Add SSR, hydration, PWA, Tailwind, Material, PrimeNG, charts dependencies, and ngx-translate.
- [x] Update Docker/Nginx/Compose for Angular output.
- [x] Add smoke test and verify build/lint/test.
- [ ] Convert each legacy JSX screen to full pixel/interaction parity Angular components.
- [ ] Expand component, guard, service, and API test coverage per feature.
- [ ] Add production sitemap generation and final structured-data content per public page.
- [ ] Wire real dashboards/charts to production analytics endpoints once backend data shape is confirmed.
- [ ] Run full end-to-end QA with backend, MongoDB, Cloudinary, Razorpay, and Socket.IO enabled.
