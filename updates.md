# Updates

## 2026-03-10

### Baseline
- Reviewed the repository end to end and documented the current architecture and flow.
- Created a checkpoint commit and pushed it to GitHub before starting cleanup work.

### Current Cleanup Pass
- Started a production-oriented cleanup without changing the project's marketplace ideology.
- Prioritized low-risk improvements first: deterministic pricing, test-friendly backend config, durable frontend flow state, order form validation, and UI cleanup on core dashboards.

### Completed In This Pass
- Added [TODO.md](/e:/scrapay_project/TODO.md) to sequence the production readiness work into practical phases.
- Updated [.gitignore](/e:/scrapay_project/.gitignore) so local virtualenv, media files, server pid files, and local dev metadata stay out of source control.
- Removed simulated market-price fluctuation from [catalog/views.py](/e:/scrapay_project/scrapay-backend/catalog/views.py) so the API now returns deterministic stored market rates.
- Updated [config/settings.py](/e:/scrapay_project/scrapay-backend/config/settings.py) to use sqlite during test runs by default and to apply safer non-debug security defaults.
- Tightened order input validation in [orders/serializers.py](/e:/scrapay_project/scrapay-backend/orders/serializers.py) for active category checks, duplicate category prevention, and more specific pickup addresses.
- Added backend regression coverage in [orders/tests.py](/e:/scrapay_project/scrapay-backend/orders/tests.py) for duplicate-category and short-address order failures.
- Persisted the sell flow in session storage through [AppFlowContext.jsx](/e:/scrapay_project/scrapay-frontend/src/contexts/AppFlowContext.jsx) so refreshes no longer discard selected scraps or vendor.
- Cleaned up [SellScrap.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/SellScrap.jsx) to remove the hardcoded `+05:30` timezone assumption, validate quantities before submit, disable repeated submissions, and reset the flow only after a successful order.
- Refined [VendorDashboard.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/VendorDashboard.jsx) with an operational header, queue stats, clearer availability state, and a better empty state.
- Added an admin order overview endpoint through [accounts/views.py](/e:/scrapay_project/scrapay-backend/accounts/views.py) and [accounts/urls.py](/e:/scrapay_project/scrapay-backend/accounts/urls.py) so admins can inspect recent platform orders.
- Added admin API coverage in [accounts/tests.py](/e:/scrapay_project/scrapay-backend/accounts/tests.py) for the new order oversight feed.
- Rebuilt [AdminPanel.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/AdminPanel.jsx) into an operations dashboard with platform KPIs, vendor review queue, rate desk, and order oversight.
- Extended [adminService.js](/e:/scrapay_project/scrapay-frontend/src/services/adminService.js) with admin order retrieval.
- Added admin account list and activation controls through [accounts/views.py](/e:/scrapay_project/scrapay-backend/accounts/views.py), [accounts/serializers.py](/e:/scrapay_project/scrapay-backend/accounts/serializers.py), and [accounts/urls.py](/e:/scrapay_project/scrapay-backend/accounts/urls.py).
- Added backend tests in [accounts/tests.py](/e:/scrapay_project/scrapay-backend/accounts/tests.py) for account suspension and self-protection against disabling the current admin.
- Extended [adminService.js](/e:/scrapay_project/scrapay-frontend/src/services/adminService.js) with account listing and activation status updates.
- Refined [AdminPanel.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/AdminPanel.jsx) with section navigation for overview, vendors, users, orders, and rates, plus suspend/reactivate controls for customers and vendors.
- Added a bootstrap command in [seed_admin.py](/e:/scrapay_project/scrapay-backend/accounts/management/commands/seed_admin.py) so an app admin can be created or upgraded in one step.
- Added command coverage in [accounts/tests.py](/e:/scrapay_project/scrapay-backend/accounts/tests.py) for admin seeding and upgrade behavior.
- Rebalanced [AdminPanel.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/AdminPanel.jsx) visually with embedded chart components for order mix, account health, and market-rate intensity so the dashboard reads like an operations console instead of a stack of forms.
- Removed the public navbar search from [Navbar.jsx](/e:/scrapay_project/scrapay-frontend/src/components/Navbar.jsx) so search only appears for authenticated users who can actually use it.
- Added [RegisterRoleSelect.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/RegisterRoleSelect.jsx) and routed `/register` through [routeConfig.jsx](/e:/scrapay_project/scrapay-frontend/src/routes/routeConfig.jsx) so signup now starts with role selection instead of assuming a user account.
- Updated [Login.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/Login.jsx) so the signup CTA consistently sends people to role selection first.
- Redesigned [Login.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/Login.jsx), [UserRegister.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/UserRegister.jsx), and [VendorRegister.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/VendorRegister.jsx) with cleaner spacing, stronger layout structure, and more professional auth presentation.
- Added visible but clearly non-wired social auth entry points on the auth screens so the UI can evolve toward Google or SSO without pretending the backend already supports it.
- Expanded signup data capture so user registration includes city/state/pincode and vendor registration includes business name, license number, service radius, and richer location information.
- Reworked the auth screens again into a darker, more cinematic storytelling direction so login and signup now feel visually aligned with a single site-wide mood instead of separate utility forms.
- Redesigned [Home.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/Home.jsx) and [About.jsx](/e:/scrapay_project/scrapay-frontend/src/pages/About.jsx) into the same dark cinematic public-facing visual language used by the auth flow.

### Validation
- `python manage.py test` passed from `scrapay-backend` with 24 tests.
- `npm --prefix scrapay-frontend run lint` passed after the admin dashboard refactor.
- `npm --prefix scrapay-frontend run build` is still blocked in this sandbox by an `esbuild` process spawn `EPERM` error while loading `vite.config.js`.
