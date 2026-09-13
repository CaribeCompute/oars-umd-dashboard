# Property address entry and assessment lookup

The Step 1 Find button previously had no click handler. It now validates the form, calls `/api/validate-address`, shows loading and error feedback, and displays the matched location on a map. Changing the input requires finding the new address before continuing. Assessment lookup coordinates are saved with the assessment JSON; it does not overwrite the property profile or saved GIS observations.

Registration, assisted registration, property creation/editing, and assessment address entry share `PropertyAddressFields`: street, optional unit, city, state dropdown, and ZIP/ZIP+4. Existing combined addresses are displayed intact. Choose Change address to replace one using structured fields; the app does not guess how to split old geocoder output. Property saves validate structured fields on the server and use the matched coordinates.

General map search can still accept a place name; property address entry requires a complete U.S. street address. This is map lookup, not postal delivery verification. No database migration is needed.

Validation: TypeScript and 23 existing automated tests passed. Browser checks using a mocked geocoder response verified invalid ZIP rejection and successful Find enabling Continue. No property or assessment records were saved. Automatic approval review rejected a live test involving the demo account's saved address and the external geocoder; the external provider result was not verified in this change.

## Map matching is not address validity

The former “Enter a complete, existing U.S. street address” error conflated a missing OpenStreetMap match with an invalid address. Structured submissions now search street/city/state/ZIP separately, then retry street/state/ZIP without the locality name. Units are retained in the saved address but excluded from geocoding; ZIP+4 is reduced to its five-digit search prefix. This helps when the entered locality is a historic district rather than a mapped city. The lookup considers up to five results, requiring a street-number result matching the requested house number and, when returned, ZIP. It does not silently use a road or town center as the property's precise location.

Format validation and map coverage remain separate: a real rural address can pass format checks and still be absent from the provider. The revised message acknowledges this. Saving still requires matched coordinates; manual pin confirmation is not yet available in property creation. The screenshot's specific address has not been verified against the live provider in this change. Regression tests use fictional addresses.

Provider query format: [Nominatim structured search documentation](https://nominatim.org/release-docs/latest/api/Search/#structured-query). The fallback requests are sequential with a delay; project-wide rate limiting across server instances remains a deployment consideration.
