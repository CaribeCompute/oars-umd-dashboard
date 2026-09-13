# Administrator access to user data

Active administrators can open **User data** in their dashboard, search accounts by name/email/role, select an account, and select one of its properties.

The view includes every saved OARS profile column (including contact information, Farmer ID, organization, role, status and timestamps), all owned properties, related applications and officer assignments, saved assessment payloads, boundary drawings, flooding and salt-patch observations, dates, notes and downloadable observation photos. Assessment payloads retain all stored fields; expand Saved assessment to inspect them. GIS layers, zoom and pan remain available. Use Refresh user data to load recent changes.

This is read-only review. It has no map autosave, marker deletion, photo upload or photo deletion controls. Passwords and authentication secrets are never retrieved. Browser-only drafts, unsaved drawings, and external Survey123 responses are not saved OARS data and cannot be inspected here. Contributor program management remains in the existing Programs tab; account audit events remain in Audit log.

## Required database update

Apply `dashboard/supabase/migrations/20260914070000_admin_user_data_read.sql` in the Supabase SQL editor after the existing account, property GIS and observation-photo migrations. Then deploy the updated app. The migration is safe to rerun.

The new endpoint uses the signed-in session and database row-level security, without a service-role key. It checks the current database profile for an active administrator on every request, and returns private, non-cacheable responses. Inactive administrators and all non-admin roles are refused. A readiness function prevents missing access policies from being misreported as empty map data. Existing account-management actions still need their server-only secret.

New SELECT policies allow active administrators to read property maps, assessments and observation photo objects whose path matches the property's owner. Owner editing policies are unchanged. The photo bucket remains private. Assigned officers do not gain access to private GIS data through this change. Accounts, properties and photo lists are paginated internally rather than stopping at Supabase's default result limit.

## Verification and remaining checks

Type checking, lint, all 27 regression tests and the Netlify build passed. Browser checks exercise anonymous and landowner denial against the real endpoint; administrator rendering uses fixture responses because an administrator login was not provided. This does not prove the new live database policies have been applied.

After applying SQL, sign in with an active administrator, open a known landowner and confirm its property, assessment, map notes and photo download. Check another non-admin account cannot read that property map or photo, and that an inactive admin cannot read it. This live cross-account RLS verification is required before production use.

## Other known pilot limitations

- Assessment scoring remains a labeled demonstration; the OARS five-stage scientific methodology still needs approval and implementation.
- Program ranking currently uses land type and the shortlist, not the full combination of stage, goals, geography and eligibility.
- Valid properties that cannot be geocoded still need a manual map-location fallback.
- Survey123 handoff is manual; there is no submission receipt, bidirectional synchronization or automatic photo transfer.
- Deleting properties/markers does not yet clean up orphaned photo files automatically.
- Local GeoTIFF files require preprocessing and layer registration as documented in `local-geotiffs.md`.
