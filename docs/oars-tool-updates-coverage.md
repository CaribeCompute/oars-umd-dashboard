# OARS Tool Updates requirement coverage

Reviewed September 13, 2026 against all four pages of `OARS Tool Updates.docx` and code through commit `7126972`. PRs 11 and 12 are merged. Merged code does not establish that Netlify deployed successfully or that the Supabase migrations and live acceptance tests were completed.

The document is not fully implemented. The interface covers much of the workflow, but the scientific assessment, recommendation rules, program curation, and comprehensive report remain substantial gaps.

| Document requirement | Current coverage | Remaining work |
| --- | --- | --- |
| 1. Address/property search and GIS selection | Implemented in code: address search, structured signup address, coordinates, saved property selection, boundary drawing, and assessment relationship choices. | Verify live persistence and access isolation after migrations. Registration currently requires ownership; tenant/manager account onboarding remains inconsistent with the broader relationship choices in the assessment. One boundary per property is supported. |
| 2. Property information questionnaire | Partial: property address, county, acreage, land type, registry number and relationship. | Previous land use, conservation agreements, existing program enrollment, and other eligibility inputs. |
| 3. Goals quiz and ranking | Partial: select up to four goals in priority order and save assessment inputs. | Guiding questions, separate near/long-term priorities, explicit cost constraints and marsh transition, easier reordering. Competing-goal sliders were exploratory in the notes, not a firm requirement. |
| 4. SWI score and land trajectory | Prototype only: sum of three observation scores, preliminary stage labels, and map overlays with caveats. | Scientifically approved thresholds, numeric DEM/MHHW analysis, geographic applicability, time horizon, uncertainty, and a validated trajectory index. Hillshade and NOAA scenario imagery do not supply this calculation. |
| 5. Recommendation/shortlisting algorithm | Placeholder: filter catalog by land type, then take the first three rows. | Incorporate property constraints, SWI assessment, goals, eligibility, scoring/ranking, and explanations using agreed rules. |
| 6. Personalized results | Partial results presentation: score, goals, property summary and recommendation cards. | Actual personalization. Selection now explicitly describes land-use/shortlist examples; SWI and goals still do not rank them. |
| 7. Full Explore database | Search, land filters, cards, comparison and public navigation are implemented. Data now contains 317 traceable records imported from the supplied workbook, with location/type/shortlist filters. | Curate missing source fields; persistent publication workflow; goal and eligibility filters. Agency portal items are still local sample state and do not feed this catalog. |
| 8. Detailed program/practice information | Implemented for supplied fields: individual detail pages with eligibility, contacts, assistance, limitations and source row references. | Complete missing workbook fields and independently verify current deadlines and terms. |
| 9. Interactive property/results map | Property GIS, public layers, boundaries and observations implemented; owner-specific storage added by PR 12. | Post-migration live checks. Results/report do not embed the saved property map or spatially show recommended practices. |
| 10. Downloadable/printable report | Partial: browser Print results action with summary, score, goals, recommendation descriptions and assistance text. | Complete map-bearing report with provider contacts, deadlines, timelines, plant recommendations and caveats; saved/versioned downloadable reports. The property-card Saved report button has no action. |
| 11. External tools/resources page | Partial: GIS source links, NOAA links, Salt Patch Mapper Survey123 handoff and GeoJSON export; integration documented. | Dedicated curated resources page including MyCoast, Marsh Viewer, Resilient Land Mapping, Catch the King Tide, and UMD climate-smart dashboard. Automatic external submission is not implemented. |
| 12. Common language and definitions | Partial: FAQs, basic explanations and dataset caveats. | Apply the document's referenced common-language resource, a consistent glossary and a full terminology pass. Correct unsupported personalization and time-horizon claims in current UI copy. |

## Meeting-note follow-ups

The notes also raise decisions and coordination work that should not be counted as completed website features:

- Confirm whether MHHW relationships established for Maryland apply to other regions before using them in scores.
- Agree how OARS occurrence observations supplement Salt Patch Mapper and MyCoast, distinguish observations from validated classifications, and establish consent/privacy rules for external publication.
- Define evidence-of-need and policy/community reporting outputs; these are not implemented dashboards.
- Confirm the intent of subscription/event models and potentially opposed-goal sliders; these are discussion prompts.
- Recruit test landowners, collect beta feedback, and coordinate team updates. There is no evidence these project-management activities have been completed by the code changes.

## Evidence in the repository

- `dashboard/app/page.tsx`: Assessment component; score sums answer values, while recommendations depend only on land type and `.slice(0, 3)`. Goals are ordered selections, without distinct near/long-term fields. Print results calls `window.print()`.
- `dashboard/lib/programs.ts`: maps the supplied workbook snapshot into structured catalog records and provider detail pages.
- `dashboard/components/explore-catalog.tsx`: shared public/signed-in browsing with search and land filters.
- `dashboard/components/personal-gis.tsx`, `dashboard/app/api/property-map/route.ts`, and `20260913200000_property_gis_storage.sql`: saved owner maps, version checks, and storage policies. Live validation remains outstanding in this review.
- `dashboard/components/faqs.tsx` and `docs/property-gis-persistence.md`: user guidance and the limits of the current external reporting handoff.

## Suggested completion order

1. Verify the merged deployment, migrations, and two-account persistence/access tests; correct UI claims that exceed current behavior.
2. Import and validate the full program database and define required detail fields.
3. Complete the property questionnaire and goals workflow.
4. Agree scientific SWI/trajectory methodology and program-matching rules with OARS, then implement and validate them with representative cases.
5. Build the complete printable/downloadable report from saved inputs, maps, and sourced program details.
6. Finish the resources directory, common-language glossary, and external reporting agreements; run a documented landowner pilot.

## Supplied materials update

The September 13 workbook and five labeled photos are integrated; see `oars-source-import.md`. Draft farm/forest stage tables are available for review in `/swi-guide`. They do not yet replace demonstration scoring. All source program SWI-stage fields remain blank.
