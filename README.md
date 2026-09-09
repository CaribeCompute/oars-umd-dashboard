# OARS UMD Dashboard for Saltwater Intrusion

This repository contains the planning documents and a local demonstration dashboard for the OARS Mid-Atlantic Tool.

## Run the dashboard locally

Requirements: Node.js 22.13 or newer and pnpm.

```powershell
cd dashboard
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. Keep the terminal running while using the dashboard. Stop the server with `Ctrl+C`.

## Current prototype scope

- Public OARS landing page
- Landowner self-registration with a required first property and approval state
- Role-based demonstration access for landowners, agencies, and administrators
- Property location, land type, and user relationship
- Demonstration saltwater intrusion scorecard
- Ranked landowner goals
- Explained program and practice recommendations
- Searchable and comparable resource catalog
- Demonstration GIS layer controls
- Printable assessment results

The prototype uses synthetic information and does not persist personal or property data. OARS must approve the scoring methodology, recommendation rules, GIS sources, authentication, and privacy requirements before production use.

## Demonstration accounts

All three demonstration accounts use the password `demo123`:

- Landowner: `landowner@oars.demo`
- Agency: `agency@oars.demo`
- Administrator: `admin@oars.demo`

See [the dashboard development plan](docs/dashboard-development-plan.md) for the documented requirements, phases, decisions, and acceptance criteria.
