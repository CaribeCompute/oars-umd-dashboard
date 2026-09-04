# OARS Database Schema

The schema is organized around four kinds of information: authenticated users, their land and assessments, scientist-managed reference content, and generated recommendations.

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        text email
        jsonb raw_user_meta_data
    }
    PROFILES {
        uuid user_id PK,FK
        text display_name
        text organization
        text app_role "user | scientist | admin"
        timestamptz created_at
        timestamptz updated_at
    }
    PROPERTIES {
        uuid id PK
        uuid owner_id FK
        text name
        text address_line
        text city
        text county
        char2 state_code "MD by default"
        text postal_code
        property_role relationship "landowner | tenant_farmer | property_manager | service_provider | other"
        land_type land_type "farm | forest | woodlot"
        text current_use
        text previous_use
        text existing_agreements
        timestamptz created_at
        timestamptz updated_at
    }
    FIELDS {
        uuid id PK
        uuid property_id FK
        text name
        geometry boundary "Polygon, WGS84 / SRID 4326"
        numeric stated_acres "12 digits, 2 decimals"
        timestamptz created_at
        timestamptz updated_at
    }
    FIELD_HOTSPOTS {
        uuid id PK
        uuid field_id FK
        geometry location "Point, WGS84 / SRID 4326"
        text observation_type "saltwater_intrusion by default"
        text notes
        date observed_on
        timestamptz created_at
    }
    SWI_STAGES {
        text id PK "none | early | transition | marsh"
        text label UK
        integer min_score
        integer max_score
        text summary
        text next_step
        integer sort_order
    }
    SCORECARD_INDICATORS {
        text id PK "crop_stress etc."
        text question
        text help_text
        land_type applies_to "farm | forest | both | null"
        integer sort_order
        boolean active "true by default"
    }
    INDICATOR_OPTIONS {
        uuid id PK
        text indicator_id FK
        text label
        integer score "0 or greater"
        integer sort_order
    }
    ASSESSMENTS {
        uuid id PK
        uuid field_id FK
        uuid created_by FK
        assessment_status status "draft | complete"
        text planning_horizon "near_term | long_term | both"
        integer total_score "0 or greater"
        text stage_id FK
        text methodology_version "1.0 by default"
        boolean limitations_acknowledged "false by default"
        timestamptz completed_at
        timestamptz created_at
        timestamptz updated_at
    }
    ASSESSMENT_ANSWERS {
        uuid assessment_id PK,FK
        text indicator_id PK,FK
        uuid option_id FK
        text notes
    }
    GOALS {
        text id PK "conservation, income, legacy etc."
        text label UK
        text description
        boolean active "true by default"
        integer sort_order
    }
    ASSESSMENT_GOALS {
        uuid assessment_id PK,FK
        text goal_id PK,FK
        integer priority "1 is highest"
    }
    PRACTICES {
        uuid id PK
        text slug UK
        text name
        text description
        text eligibility
        text plants_species
        text limitations
        text expected_timeline
        content_status status "draft | published | archived"
        timestamptz created_at
        timestamptz updated_at
    }
    PROGRAMS {
        uuid id PK
        text slug UK
        text name
        text administering_agency
        text description
        text eligibility
        text geographic_availability
        text cost_share
        text enrollment_deadline
        text expected_timeline
        text limitations
        text website_url
        content_status status "draft | published | archived"
        timestamptz created_at
        timestamptz updated_at
    }
    PROGRAM_PRACTICES {
        uuid program_id PK,FK
        uuid practice_id PK,FK
    }
    SERVICE_PROVIDERS {
        uuid id PK
        text name
        text organization
        text email
        text phone
        text website_url
        text service_area
        timestamptz created_at
    }
    PROGRAM_PROVIDERS {
        uuid program_id PK,FK
        uuid provider_id PK,FK
        boolean is_primary "false by default"
    }
    RECOMMENDATIONS {
        uuid id PK
        uuid assessment_id FK
        uuid practice_id FK "practice or program, not both"
        uuid program_id FK "practice or program, not both"
        integer rank "1 is highest"
        numeric match_score "8 digits, 2 decimals"
        text explanation
        timestamptz created_at
    }

    AUTH_USERS ||--|| PROFILES : has
    PROFILES ||--o{ PROPERTIES : owns
    PROPERTIES ||--o{ FIELDS : contains
    FIELDS ||--o{ FIELD_HOTSPOTS : records
    FIELDS ||--o{ ASSESSMENTS : evaluated_by

    SWI_STAGES ||--o{ ASSESSMENTS : classifies
    ASSESSMENTS ||--o{ ASSESSMENT_ANSWERS : contains
    SCORECARD_INDICATORS ||--o{ INDICATOR_OPTIONS : offers
    SCORECARD_INDICATORS ||--o{ ASSESSMENT_ANSWERS : answers
    INDICATOR_OPTIONS ||--o{ ASSESSMENT_ANSWERS : selected_as

    ASSESSMENTS ||--o{ ASSESSMENT_GOALS : prioritizes
    GOALS ||--o{ ASSESSMENT_GOALS : selected_in

    ASSESSMENTS ||--o{ RECOMMENDATIONS : generates
    PRACTICES ||--o{ RECOMMENDATIONS : recommends
    PROGRAMS ||--o{ RECOMMENDATIONS : recommends
    PROGRAMS ||--o{ PROGRAM_PRACTICES : supports
    PRACTICES ||--o{ PROGRAM_PRACTICES : funded_by
    PROGRAMS ||--o{ PROGRAM_PROVIDERS : administered_by
    SERVICE_PROVIDERS ||--o{ PROGRAM_PROVIDERS : participates_in
```

## Type and value guide

| Database type | What students should enter | Example |
|---|---|---|
| `uuid` | Generated identifier; users do not type it | `4c728bf1-...` |
| `text` | Names, descriptions, notes, URLs, or codes | `North field` |
| `char(2)` | Two-letter state code | `MD` |
| `integer` | Whole number | score `8`, priority `1` |
| `numeric(12,2)` | Decimal acreage | `42.75` |
| `numeric(8,2)` | Decimal recommendation score | `14.50` |
| `boolean` | True/false value | `true` |
| `date` | Calendar date without a time | `2026-09-03` |
| `timestamptz` | Timestamp stored with timezone awareness | generated by `now()` |
| `jsonb` | Structured JSON owned by Supabase Auth | Google profile metadata |
| `geometry(Polygon,4326)` | Closed longitude/latitude field boundary | GeoJSON polygon converted by PostGIS |
| `geometry(Point,4326)` | Longitude/latitude observation | SWI hotspot at a map location |
| `land_type` | One allowed enum value | `farm`, `forest`, or `both` |
| `property_role` | One allowed enum value | `landowner` or `tenant_farmer` |
| `assessment_status` | Assessment workflow state | `draft` or `complete` |
| `content_status` | Publishing workflow state | `draft`, `published`, or `archived` |

`PK` means primary key, `FK` means foreign key, and `UK` means unique key. Fields without `not null` in the migration are optional and may contain `NULL`.

## Running the migrations

With the Supabase CLI connected to a project:

```bash
supabase db reset
```

For a remote project after reviewing the generated diff:

```bash
supabase db push
```

The first migration creates the schema, indexes, authentication profile trigger, and row-level security policies. The second migration adds the current SWI stages, landowner goals, scorecard questions, and answer options.

## Classroom build order

1. `profiles`, `properties`, and `fields`
2. `assessments`, indicators, options, and answers
3. goals and ranked assessment goals
4. programs, practices, and service providers
5. generated recommendation snapshots
6. PostGIS field boundaries and hotspot queries

Supabase Auth owns passwords and Google OAuth identities in `auth.users`. The application should never create its own password column.
