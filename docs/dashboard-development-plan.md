# OARS Dashboard Development Plan

## 1. Purpose

This plan translates the requirements in the OARS project documents into an implementation sequence for a maintainable web dashboard. The first release should guide a landowner or service provider from property selection through a saltwater intrusion assessment and ranked program or practice recommendations. It should also let users browse the full program and practice catalog.

The plan deliberately separates approved product requirements from scientific, privacy, and deployment decisions that the OARS Research Team must confirm before implementation.

## 2. Source documents

This plan is based on:

- `OARS x Terminal34 Mock Contract.docx`
- `OARS Tool Updates.docx`
- `OARS Mid-Atlantic Tool Overview.pptx`
- `database-schema.md`

## 3. Product outcome

The dashboard should help users understand conditions on a coastal farm, forest, or woodlot and identify relevant conservation programs and practices. It must explain why each result appears, disclose limitations, and provide practical next steps such as eligibility information, deadlines, cost share, timelines, and service-provider contacts.

The principal users are:

- Service providers advising coastal landowners
- Landowners or land managers using the tool directly or with assistance
- OARS scientists and administrators maintaining scorecard and catalog content

## 4. Release scope

### 4.1 Minimum viable workflow

The first integrated release should include these capabilities in order:

1. **Home and entry**: explain OARS, its intended use, and its limitations; select farm, forest, or both; start the guided assessment or open the GIS explorer.
2. **Location and property selection**: search by address; draw or select a property or field polygon; optionally add saltwater-intrusion observation markers; capture ownership or management role and current or previous land use.
3. **Property questionnaire**: record relevant property characteristics, existing conservation agreements, and enrolled programs.
4. **OARS Scorecard**: present OARS-approved visual indicators and answer choices; calculate a score using a versioned methodology; assign an SWI stage; explain the stage in common language and show uncertainty or limitations.
5. **Landowner goals**: ask guiding questions; collect and rank near-term and long-term goals; support goals such as continuing agriculture, transitioning land, protecting infrastructure, conserving habitat, preserving legacy, and minimizing cost.
6. **Personalized recommendations**: filter and rank practices and programs using land type, SWI stage, property conditions, goals, eligibility, and geographic availability; explain each match.
7. **Recommendation details**: show program or practice description, administering organization, eligibility, financial assistance, deadlines, expected timeline, plants or species when relevant, limitations, source links, and contacts.
8. **Explore all programs and practices**: provide a separate searchable and filterable catalog independent of the personalized shortlist.
9. **Results summary**: present the property map, SWI assessment, ranked goals, recommendations, limitations, deadlines, contacts, and next steps in a printable and downloadable format.
10. **Content administration**: let authorized OARS staff update scientist-managed reference content without editing application code.

### 4.2 GIS explorer

The first GIS release should display approved layers with controls to enable or disable each layer. Each layer needs a source, date or year, spatial resolution or scale when applicable, documentation link, and attribution. The layer registry should allow an administrator or developer to add, remove, or update layers without rebuilding the map interface.

Property-level summaries, scenario comparisons, GIS-assisted SWI staging, and connections from spatial indicators into the recommendation model should follow only after the OARS Research Team approves the datasets and scientific interpretation.

### 4.3 Deferred capabilities

The following items should remain outside the first release unless the project team explicitly promotes them:

- Economic calculator, cost comparison, cost-share estimator, or net present value calculations
- Expansion beyond the initially approved geography
- Advanced current-versus-future sea-level or SWI scenario comparison
- Public landowner-facing experience if the first release targets service providers
- Persistent user accounts and saved assessments before privacy requirements are approved
- Shapefile upload before file limits, coordinate handling, validation, security, and support expectations are defined

## 5. Proposed information architecture

| Area | Route concept | Primary purpose |
|---|---|---|
| Home | `/` | Explain OARS and start a workflow |
| Guided assessment | `/assessment/...` | Complete property, scorecard, goals, and review steps |
| Recommendations | `/assessment/{id}/recommendations` | Show ranked and explained results |
| Results report | `/assessment/{id}/report` | Print or download the assessment summary |
| Program catalog | `/explore` | Search and filter all programs and practices |
| Program detail | `/programs/{slug}` | Show current program information and providers |
| Practice detail | `/practices/{slug}` | Show practice information and related programs |
| GIS explorer | `/map` | Explore approved spatial layers and property context |
| Administration | `/admin` | Maintain reference content and publishing status |

The guided assessment should preserve progress between steps and include a review screen before completion. Users must be able to move backward without losing answers.

## 6. Data and application design

### 6.1 System boundaries

Use a modular web application with four clear boundaries:

- **Dashboard interface** for the guided workflow, catalog, results, and administration
- **Application service layer** for validation, authorization, score calculation, filtering, ranking, and report assembly
- **Supabase data layer** for authentication, relational data, row-level security, and PostGIS geometry
- **External GIS and program sources** accessed through documented adapters or registered layer definitions

The user interface must not contain hard-coded score thresholds, recommendations, program descriptions, or contact details. Scientist-managed content belongs in the database or an approved structured import process.

### 6.2 Existing schema alignment

The documented schema already supports the main workflow:

- `profiles`, `properties`, `fields`, and `field_hotspots` represent users and land.
- `scorecard_indicators`, `indicator_options`, `assessments`, and `assessment_answers` support the scorecard.
- `goals` and `assessment_goals` support ranked goals.
- `programs`, `practices`, `service_providers`, and their join tables support the resource catalog.
- `recommendations` stores a reproducible result snapshot and explanation.

Before migrations are treated as final, resolve these schema questions:

- Confirm whether `land_type` allows `farm`, `forest`, `woodlot`, and `both`; the current documentation uses inconsistent value sets.
- Decide how assessment inputs for ownership, land-use history, existing agreements, cost constraints, and planning horizon map to normalized fields.
- Add explicit content provenance and review fields where required, such as source URL, source date, last verified date, scientific reviewer, and methodology version.
- Define how GIS layer metadata and citations are stored.
- Decide whether recommendation rules need dedicated versioned tables instead of application configuration.
- Define deletion and retention behavior before saving identifiable user or property data.

### 6.3 Recommendation pipeline

The recommendation engine should use a transparent, versioned pipeline:

1. Validate that required assessment fields are complete.
2. Apply hard eligibility and geographic filters.
3. Match the property land type and approved SWI stage.
4. score goal alignment using ranked priorities.
5. Apply other OARS-approved factors, such as existing agreements or planning horizon.
6. Return programs and practices in ranked order with a plain-language explanation.
7. Store the result, methodology version, score, rank, and explanation as a snapshot.

All rule weights, exclusions, thresholds, and tie-breaking behavior require OARS approval. The application should never infer scientific relationships that the research team has not specified.

### 6.4 Privacy and security baseline

- Use synthetic, public, demonstration, or explicitly approved data during development and testing.
- Treat addresses, polygons, questionnaire answers, contacts, and goals as sensitive when linked to an identifiable person or property.
- Minimize data collection and avoid persistent personal data until OARS approves authentication, access, storage, retention, and deletion requirements.
- Keep passwords exclusively in the external identity provider or Supabase Auth.
- Enforce role-based access and row-level security for user, scientist, and administrator roles.
- Keep secrets out of source control and separate development, staging, and production credentials.
- Document every third-party service, license, attribution requirement, recurring cost, and data-sharing implication for OARS approval.
- Log administrative content changes without exposing sensitive assessment data.

## 7. Dashboard experience requirements

### 7.1 Navigation and usability

- Show the user's current step and remaining steps in the guided assessment.
- Save draft progress only when approved; otherwise keep the first prototype session-based.
- Use common-language definitions consistently for SWI, stage labels, practices, programs, eligibility, and uncertainty.
- Pair scientific indicators with approved visual examples and accessible text descriptions.
- Explain the reason for every recommendation and make limitations visible near the result.
- Support keyboard navigation, visible focus, clear validation messages, sufficient contrast, and responsive layouts.
- Design the print view separately so maps, tables, links, and caveats remain readable on paper and in PDF.

### 7.2 Admin experience

Authorized OARS users should be able to:

- Create, edit, preview, publish, archive, and restore programs and practices.
- Maintain agencies, providers, deadlines, eligibility, cost-share information, timelines, limitations, and source links.
- Maintain goals, scorecard indicators, answer options, SWI stage descriptions, and approved methodology versions subject to tighter permissions.
- Validate required fields and URLs before publication.
- See when content was last reviewed and by whom.

Scientific scoring and recommendation rules should require a review and approval workflow rather than immediate publication by any administrator.

## 8. Development phases

### Phase 0: Requirement confirmation

**Outcome:** an approved MVP boundary and decision log.

- Confirm the primary first-release user and geography.
- Resolve the open scientific, privacy, GIS, schema, and deployment decisions in Section 11.
- Convert each selected feature into user stories and measurable acceptance criteria.
- Inventory program, practice, provider, scorecard, and GIS source data.
- Agree on content owners and approval responsibilities.

**Exit criteria:** OARS approves the selected components, inputs, outputs, dependencies, content sources, and acceptance criteria.

### Phase 1: Technical foundation and interface design

**Outcome:** a testable application shell and approved interaction design.

- Record the selected framework, hosting, mapping library, identity provider, analytics policy, and report approach.
- Define application modules, environments, repository conventions, pull-request review, and deployment gates.
- Validate the database schema and row-level security design.
- Produce low-fidelity wireframes for the complete guided workflow, catalog, report, GIS explorer, and admin area.
- Prototype the highest-risk interactions: polygon drawing, ranked goals, scorecard selection, and printable results.
- Create a content dictionary and shared terminology list.

**Exit criteria:** the technical design, data flow, wireframes, and sprint backlog receive joint approval.

### Phase 2: Core assessment prototype

**Outcome:** a working flow using synthetic or approved public data.

- Build the home, property selection, questionnaire, scorecard, goals, review, and basic results screens.
- Implement database access through typed service boundaries.
- Implement draft assessment state without unapproved persistence of personal data.
- Add validation, common-language help, uncertainty text, and basic accessibility.
- Unit test score aggregation against OARS-provided examples.

**Exit criteria:** a user can complete the workflow with test data and receive a deterministic SWI stage and placeholder or approved test recommendations.

### Phase 3: Catalog and recommendation integration

**Outcome:** data-driven recommendations and a complete searchable catalog.

- Import reviewed programs, practices, providers, relationships, and source metadata.
- Implement approved eligibility filters and ranking rules.
- Generate explanations tied to the factors that affected each result.
- Build program and practice detail pages.
- Build the Explore experience with search and filters.
- Add content-management workflows and publishing states.

**Exit criteria:** approved test cases produce the expected shortlist, ordering, explanation, and detail content without hard-coded records.

### Phase 4: GIS and report integration

**Outcome:** spatial context and a usable assessment handoff.

- Add approved map layers, controls, metadata, citations, and attribution.
- Persist or transfer the selected polygon only under the approved privacy model.
- Implement property summaries for scientifically approved spatial indicators.
- Connect approved spatial outputs to the scorecard or recommendations.
- Build print and download output with the map, assessment, goals, recommendations, contacts, deadlines, and limitations.

**Exit criteria:** GIS values match reference calculations and the report is readable, complete, and reproducible from a stored or in-session assessment.

### Phase 5: User testing, hardening, and release

**Outcome:** an accepted release and maintainable handoff.

- Test with the OARS team and, where feasible, service providers or other intended users using demonstration data.
- Prioritize findings by workflow impact, feasibility, scientific accuracy, and importance to the core journey.
- Resolve critical defects and document accepted limitations.
- Complete accessibility, security, privacy, responsive-layout, browser, performance, and data-quality checks.
- Deploy to the agreed environment and run smoke tests.
- Deliver architecture, schema, content-update, GIS-source, dependency, deployment, backup, and known-issues documentation.

**Exit criteria:** the OARS Research Team confirms the release meets the agreed acceptance criteria and approves it for use or continued development.

## 9. Testing strategy

| Test level | Required coverage |
|---|---|
| Unit | Score calculation, stage boundaries, ranking, filters, validation, and explanation construction |
| Data quality | Required fields, enum values, broken links, duplicate records, invalid deadlines, missing relationships, and stale content |
| Integration | Authentication, row-level security, database operations, GIS adapters, catalog imports, and report generation |
| End to end | Complete guided assessment, backward navigation, draft recovery if enabled, Explore search, admin publishing, and print flow |
| Scientific validation | OARS-provided scorecard cases, stage assignments, GIS reference areas, eligibility rules, and expected recommendations |
| Usability | Service-provider and landowner comprehension, goal ranking, recommendation rationale, limitations, and next actions |
| Accessibility | Keyboard use, focus order, labels, error messages, contrast, map alternatives, text scaling, and print readability |
| Security and privacy | Authorization boundaries, RLS policies, sensitive-data exposure, file inputs if enabled, secrets, retention, and deletion |

Each requirement should link to at least one acceptance test. Scientific fixtures and expected outcomes must come from the OARS Research Team.

## 10. Definition of done

A dashboard component is complete when:

- It meets its approved purpose, inputs, outputs, behavior, and acceptance tests.
- It has no unresolved critical functional, usability, security, privacy, or accessibility defects.
- OARS has verified scientific and programmatic content.
- It integrates with the agreed workflow and uses centralized, maintainable data.
- Relevant automated tests pass and reviewers approve the change.
- Data sources, dependencies, licenses, costs, and third-party services are documented.
- OARS staff can update managed content through the agreed process.
- Setup, deployment, operation, and known limitations are documented.
- The feature works in the agreed deployment environment and OARS grants final approval.

## 11. Decisions required before implementation

| Decision | Why it blocks or changes development | Owner |
|---|---|---|
| Primary MVP user: service provider, landowner, or both | Changes language, onboarding, permissions, and testing participants | OARS product lead |
| Initial geographic scope | Determines catalog filters, GIS datasets, terminology, and validation cases | OARS research team |
| Scorecard formula, thresholds, stage names, and methodology version | Required for scientifically valid calculation and tests | OARS research team |
| Recommendation eligibility rules, weights, exclusions, and tie breaking | Required for ranking and explanations | OARS research team |
| Approved GIS layers and meaning of derived indicators | Required before spatial outputs affect assessment or recommendations | OARS GIS and research leads |
| Applicability of MHHW relationships outside Maryland's Eastern Shore | Prevents unsupported scientific generalization | OARS research team |
| Authentication and persistence in the first release | Determines privacy design, RLS, retention, deletion, and user flows | OARS and technical lead |
| Shapefile upload in or out of scope | Adds substantial validation, security, coordinate, storage, and support work | OARS product lead |
| Report format and required content | Determines map rendering and browser or server-side generation approach | OARS stakeholders |
| Admin roles and publishing approval | Determines authorization and audit requirements | OARS content owners |
| Hosting, domain, analytics, and third-party services | Affects privacy review, cost, deployment, and maintenance | OARS and technical lead |
| Canonical `land_type` values and treatment of woodlots or both | Required for schema, filters, and migration consistency | OARS and data lead |
| Data retention and deletion periods | Required before storing identifiable assessments | OARS privacy owner |

## 12. Risks and controls

| Risk | Control |
|---|---|
| Scientific logic changes during development | Version methods and test fixtures; require OARS approval before publishing changes |
| Catalog becomes stale | Track source, last-reviewed date, owner, and content status; add periodic review procedures |
| Recommendation appears authoritative without context | Show rationale, sources, uncertainty, limitations, and a clear next contact |
| Sensitive property data leaks | Minimize collection, use synthetic test data, enforce RLS, and approve third parties before use |
| GIS scope overwhelms the core workflow | Deliver layer viewing first; gate derived analysis and scenarios behind scientific validation |
| Parallel student work produces incompatible modules | Share contracts, types, interface conventions, fixtures, and integration checks from the first sprint |
| Admin editing corrupts scientific content | Validate fields, separate roles, add preview and approval, and retain change history |
| Semester timeline encourages unfinished breadth | Finish a smaller end-to-end vertical slice before adding Tier 2 capabilities |

## 13. Project management and handoff

- Maintain user stories, owners, dependencies, acceptance criteria, and status in the agreed issue tracker.
- Demonstrate working software at the end of every sprint.
- Record decisions that affect scope, scientific logic, schema, GIS, privacy, or integration.
- Require code review before merge and OARS review for scientific or programmatic changes.
- Keep source code, migrations, seed data, import templates, tests, and documentation accessible to the OARS Research Team.
- Maintain a dependency register containing license, version, purpose, restrictions, attribution, recurring cost, and account owner.
- Plan a final demonstration, deployment handoff, known-issues review, and a clearly dated support window.

## 14. Documentation inconsistencies to resolve

The source documents contain scheduling and support terms that should be corrected in the project record:

- The mock contract references an academic year or semester engagement, a two-week duration, a ten-day phase table, and payment milestones at weeks 4 and 9.
- Section 13 begins with a 60-day post-release support period but later refers to 30 days.
- The database diagram and its type guide do not present the same complete set of `land_type` values.

These inconsistencies do not prevent requirements planning, but they must be resolved before the team commits to dates, staffing, or support obligations.
