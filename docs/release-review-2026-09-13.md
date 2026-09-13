# Pre-publication review — September 13, 2026

## Outcome

The reviewed branch passes its automated checks and the tested public/landowner/program-editing workflows. It is suitable for continued pilot verification. It is **not yet a fully verified production release**: local server-side account administration is unconfigured; the new permission migration must be applied; live Administrator and external authentication/delivery workflows remain untested. Scientific scoring and recommendation matching retain their explicitly documented demonstration limits.

Review target: the Next.js application under `dashboard/`, branch `codex/oars-source-catalog-photos`, existing PR #13. No production deployment, external email, new user account, survey submission or property deletion was performed by this review.

## Issues fixed

| Issue | Correction | Verification |
| --- | --- | --- |
| API could repeat application submission, and consent could overwrite later status | Reuse submission policy; conditional draft-to-consented and consented-to-submitted updates detect stale status | Policy tests, TypeScript, code review; live admin API remains unconfigured |
| Former officer could act on an application using its old officer ID | Require an active current assignment as well as the application's officer identity | Code review; assignment policy tests |
| Assisted registration wrote an absent `agency_profile_id` column to officer assignments | Removed that invalid assignment field | Compared with migration schema, TypeScript |
| Application creation ignored the Agency selection | Validate an active agency and save `agency_profile_id`; require program name | Compared with schema, code review |
| Assignment changes did not verify target role or previous update failure | Require active landowner and check the previous assignment update error | Code review |
| Auth callback allowed a backslash-based external redirect | Normalize/validate local destinations and reject backslashes/control characters | New redirect regression test; HTTP redirect check |
| Failed auth-code exchanges quietly redirected | Show an actionable sign-in error; session restoration failure no longer leaves endless loading | TypeScript and code review; expired provider link not exercised |
| Forced-password flag trusted a browser assertion | Server now changes the authenticated user’s password before clearing the flag | Code review and TypeScript; no demo password changed |
| Normal password recovery depended on administrator secret | Only clear the profile flag for accounts that actually require temporary-password completion | TypeScript and code review; no recovery email sent |
| Invited administrators did not explicitly reach password creation | Invitation redirect requests the password-update view | Code review; no invitation sent |
| Assessment-load failure left users stuck | Add retry and transport-error handling without enabling overwrite of an unread record | Browser-injected failure followed by real read recovery |
| Property editing required optional fields and exposed coordinates that lookup overwrote | Registry/acreage optional, nonnegative acreage, coordinates supplied by lookup | TypeScript and form review |
| Assessment with a map could receive the GIS tour | Prioritize the assessment context | Browser tour check |
| Landing page still advertised an OARS agency application form | Updated copy to describe provider links and internal tracking accurately | Source/UI review |
| Full lint failed on unhandled node:test return promises | Explicitly mark test registration promises | Full lint |
| Loose UUID checks could send malformed IDs to PostgreSQL | Use canonical UUID structure for map and dynamic program lookup | TypeScript and route review |
| Browser table defaults could contradict server-only application mutation design | Added explicit revoke migration for account/application writes | SQL review; **not applied to live database in this review** |

## Browser coverage

At desktop width 1440 and mobile width 390, the following routes returned HTTP 200 with no page exceptions or document-wide horizontal overflow: `/`, `/programs`, `/programs/de-7`, `/swi-guide`, `/faqs`, `/gis`, `/map`. An invalid program slug correctly returned 404 at both sizes. These checks do not prove every map provider loaded every tile or that every device/browser combination behaves identically.

Authorized demo accounts:

- **Landowner:** login, four assessment steps, results dialog, actual PDF download, saved GIS load. Program-management API correctly returned 403. Existing private data was read for these checks; no assessment/property edits were saved.
- **Agency:** login, program-management API returned 200, expanded editor displayed 35 inputs/selects/textareas and eight SWI choices. Draft/public persistence was not mutated in this review.
- **Extension Officer:** login, Programs tab/editor, program-management API returned 200. Portfolio administration endpoint reported missing server configuration.
- **Administrator:** no Administrator credentials were provided; no live administrator workflow was tested.

Additional checks: mobile tour opens/advances/closes; assessment load failure offers Retry and recovers; assessment selects the correct tour; anonymous management API rejects access; callback keeps a malformed external destination on the local origin.

The address service is not re-tested with private addresses: earlier automatic approval review rejected transmitting the demo property's saved address to Nominatim. Address UI checks use intercepted responses. This review did not circumvent that restriction.

## Automated and build coverage

- TypeScript compilation.
- Full Oxlint check.
- Node tests: account rules, safe redirects, catalog provenance, contributor field validation/display, geospatial utilities, address validation, map/GeoJSON validation, PDF generation including media, and Survey123 encoding/validation.
- Production build through the repository's Netlify Next.js adapter.

Commands from `dashboard/`: `pnpm typecheck`, `pnpm lint`, `pnpm test`. Netlify build from repository root: `CI=true node dashboard/node_modules/netlify-cli/bin/run.js build --offline`.

## Required setup and unverified areas

1. **Server secret:** the local `/api/account-management` reported missing server-only Supabase configuration. Use `SUPABASE_SECRET_KEY` in `.env.local` and Netlify's server environment; never commit it or expose it through a public variable. The error now returns HTTP 503.
2. **Database hardening:** apply `20260914050000_server_only_account_writes.sql`. This explicitly enforces the intended server-only account/application write path even when a project has permissive default grants.
3. **External auth:** Google configuration, email confirmation, password recovery, administrator invitation and first-login completion need a consenting staging test user and configured services.
4. **Administration:** account creation, deactivation/reactivation, live assignments and application transitions have not been exercised with the service secret. Multi-step administrative writes are not all transactional; a database/provider failure may require reconciliation. Supervise these workflows during pilot testing.
5. **Program persistence:** management reads succeeded. Existing validation/field tests pass, but this review did not create, publish, withdraw or delete live catalog records.
6. **Photo lifecycle:** a previous session verified storage operations. This review downloaded available report media but did not upload/delete photos. Remove photos before deleting their marker/property; automatic orphan cleanup is absent.
7. **Spatial services:** map UI loaded; full external-service availability and regional completeness are not guaranteed. Public map drawings remain temporary.
8. **Scientific behavior:** demonstration score and shortlist-based examples are not the final OARS scoring/recommendation engine.
9. **Deployment:** the feature branch must be merged and successfully deployed before the production site reflects these changes. Recheck production redirects and direct routes after deploy.

## Documentation delivered

[README.md](README.md) inventories public pages, all account roles, addresses, assessments, catalogs, program entry fields, GIS layers/persistence, photos, Survey123 handoff, PDF/print, tours, local startup, environment variables, migration order, and publication steps. It distinguishes implemented features from configuration requirements and unfinished integrations.
