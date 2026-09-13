# Property address entry and assessment lookup

The Step 1 Find button previously had no click handler. It now validates the form, calls `/api/validate-address`, shows loading and error feedback, and displays the matched location on a map. Changing the input requires finding the new address before continuing. Assessment lookup coordinates are saved with the assessment JSON; it does not overwrite the property profile or saved GIS observations.

Registration, assisted registration, property creation/editing, and assessment address entry share `PropertyAddressFields`: street, optional unit, city, state dropdown, and ZIP/ZIP+4. Existing combined addresses are displayed intact. Choose Change address to replace one using structured fields; the app does not guess how to split old geocoder output. Property saves validate structured fields on the server and use the matched coordinates.

General map search can still accept a place name; property address entry requires a complete U.S. street address. This is map lookup, not postal delivery verification. No database migration is needed.

Validation: TypeScript and 23 existing automated tests passed. Browser checks using a mocked geocoder response verified invalid ZIP rejection and successful Find enabling Continue. No property or assessment records were saved. Automatic approval review rejected a live test involving the demo account's saved address and the external geocoder; the external provider result was not verified in this change.
