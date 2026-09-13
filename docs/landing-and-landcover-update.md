# Landing image, land cover, and user help update

The landing hero now uses the unaltered image `ppt/media/image18.png` extracted from slide 13 of the supplied `OARS Mid-Atlantic Tool Overview.pptx`. It is stored at `dashboard/public/images/oars-field-hero.png`. Next.js handles responsive display; an overlay maintains readable text. No new photographer credit was invented: provenance is the user-supplied deck. The satellite illustration card remains distinct from this field-photo background.

The land-cover overlay now uses Annual NLCD 2025 from the official USGS/MRLC WMS, with an explicit `TIME=2025-01-01T00:00:00.000Z` parameter. On September 13, 2026 the service advertised 1985–2025 and returned a nonempty colored 2025 PNG for a public Mid-Atlantic extent. Both the GIS layer label and legend URL were updated.

MRLC announced Collection 1.2, adding 2025, on June 10, 2026: [official data services and release information](https://www.mrlc.gov/data-services-page). Service endpoint: `https://dmsdata.cr.usgs.gov/geoserver/mrlc_Land-Cover-Native_conus_year_data/wms`, layer `Land-Cover-Native_conus_year_data`. Pinning the time avoids changing the displayed year silently.

FAQs now focus on visitor and account-holder tasks: accounts/approvals, multiple properties, address problems, observations, saving/recovery, photos/privacy, interpreting scores/maps, programs, external applications, Salt Patch Mapper, printing and tours. Provider pricing and implementation instructions were removed from the user FAQ.

See [local GeoTIFFs](local-geotiffs.md) for the prepared input folder and map-layer registration path.
