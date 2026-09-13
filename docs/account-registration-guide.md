# Account registration and Google sign-in

## Changes and database setup

Landowners can sign in after email verification without administrator review. New Agency and Extension Officer registrations remain **pending** until an Administrator approves them. Administrators join through an existing administrator's invitation. Declined and inactive accounts remain blocked.

Email signup uses the database auth trigger. Google signup starts with an incomplete pending profile; after registration details are saved, only landowners activate automatically. Agencies and Extension Officers remain pending. Logging in with Google alone does not bypass onboarding or approval.

Apply [`20260914060000_professional_account_approval.sql`](../dashboard/supabase/migrations/20260914060000_professional_account_approval.sql) after the earlier registration migrations, then deploy the matching application. This migration replaces the old automatic-professional-activation rule without changing existing account statuses. It can be rerun safely. Do not rerun the older activation migrations afterward, as they would restore the old policy. The new migration has not been applied to the hosted database by Codex.

Administrators review new professional accounts under **Approvals**, including their organization, job title and service area, then choose Approve or Decline. This requires the server-only `SUPABASE_SECRET_KEY` configuration. After approval and email verification, the applicant can sign in. No approval notification email is currently sent automatically. Existing active Agency/Officer accounts are not retroactively suspended; review them under All accounts if needed.

## Enable the existing Google button

1. In Google Cloud Console, configure Google Auth Platform branding, audience, and support email. Create an OAuth client of type **Web application**. If using Testing mode, add your test users to the audience.
2. Add this exact authorized redirect URI to the Google client: `https://zslwulitoyaqyvbrxnxj.supabase.co/auth/v1/callback`.
3. In Supabase **Authentication → Sign In / Providers → Google**, enable Google and save the Google client ID and client secret. The Google secret belongs here, never in browser code.
4. In Supabase **Authentication → URL Configuration**, set Site URL to `https://oars-umd.netlify.app`. Add redirect URLs:
   - `https://oars-umd.netlify.app/auth/callback`
   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:3003/auth/callback`
5. Keep the existing public Supabase URL and publishable key in Netlify. The registration callback also needs the current server-only `SUPABASE_SECRET_KEY` to finish profile/property creation. Never use a `NEXT_PUBLIC_` prefix for that secret. No Google-specific Netlify variables are needed.
6. Complete the registration form and choose **Create with Google** using a test account. A landowner should enter the dashboard; an Extension Officer should also enter their workspace. Existing accounts use **Sign in with Google**.

Google returns to Supabase `/auth/v1/callback`, then Supabase returns to OARS `/auth/callback`. These are different URLs.

References: [Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Address fields

Public and officer-assisted signup now collect street, optional unit, city, state/territory, and ZIP separately. ZIP accepts five digits or ZIP+4 and preserves leading zeros. Public registration also checks these fields server-side. The combined address is stored using the existing schema; existing property editing remains compatible.

Browser autofill is enabled. The current free Nominatim service [prohibits autocomplete](https://operations.osmfoundation.org/policies/nominatim/), so we check the location on submission rather than request suggestions on every keystroke. No paid Places API or new geocoding credentials are needed.

The lookup requires a mapped U.S. street address with a house number. It does not certify deliverability, ownership, or ZIP/city correspondence; ZIP validation is format validation. Rural addresses may be absent from the provider's data.

## Classroom checks

- Register a landowner, confirm email, and sign in without approval.
- Register Agency and Extension Officer test accounts, verify their email, confirm access is denied while pending, approve them as an Administrator, then confirm access.
- Check that public signup cannot grant administrator privileges.
- Verify a four-digit ZIP is rejected; ZIP+4 and leading zeros are accepted.
- Compare Google login for existing accounts with Google registration for new accounts.

Automated tests cover activation rules and address format handling. Live Google OAuth, email delivery, and the migration still require verification in the configured Supabase project.

The signup password and confirmation share a row on wider screens and stack on phones. The landing-page example uses Esri satellite imagery of Somerset County with attribution; the drawn boundary and planning summary are illustrative.

## Google sign-in cost

As checked September 13, 2026, Supabase includes social OAuth on its Free plan with 50,000 monthly active users. This Google sign-in flow does not require Google Maps/Places billing. Other hosting/database quotas still apply. See [Supabase pricing](https://supabase.com/pricing) and [Google's sign-in setup](https://codelabs.developers.google.com/codelabs/sign-in-with-google-button).
