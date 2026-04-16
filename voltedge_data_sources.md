# VoltEdge Data Sources — Executive Brief

## What We Use and Why


| Source | What It Gives Us | Cost |
|---|---|---|
| AESO | Alberta pool prices, curtailment, generation data | Free |
| Site SCADA | Hub-height wind and generation telemetry from the operator or historian | Contract / integration |
| Canadian Wind Turbine Database | Every turbine in Canada — location, height, capacity | Free |

---

## AESO — Alberta Electricity Market

**Link:** [developer-apim.aeso.ca](https://developer-apim.aeso.ca/)

**What we get:**
- Real-time and historical pool prices
- Generation capacity and outage schedules
- Metered generation volumes by asset
- Actual vs. forecast supply and demand

**Why AESO:** Alberta's market has its own rules for how curtailment is priced and reported. Generic global energy APIs don't reflect that. Using AESO means our numbers match what operators and investors in this market already use to make decisions — no translation layer, no credibility gap.

**Cost:** Free. Requires API key registration at the developer portal.


---

## Canadian Wind Turbine Database — Site Registry

**Link:** [open.canada.ca](https://open.canada.ca/data/en/dataset/79fdad93-9025-49ad-ba16-c26d718cc070)

**API:** ESRI REST — `https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/wind_turbine_database2_en/MapServer`

**What we get:**
- Location (lat/lon) of every commercial wind turbine in Canada
- Turbine model, manufacturer, rotor diameter, hub height, rated capacity
- Commissioning date — covers 1993 to present, updated irregularly
- Queryable by province, so Alberta-only pulls are straightforward

**Why this database:** Hub height and layout from this registry anchor site screening before the operator shares SCADA. It also lets us enumerate many Alberta target sites programmatically rather than manually — useful for scaling the platform beyond a single demo project.

**Cost:** Free. Open Government Licence — Canada. No registration required.

**Limits:** Static registry updated irregularly (not a live feed). New projects may lag by weeks to months after commissioning.

---

## Site SCADA — Operator Telemetry

**What we get (typical):**
- Time-aligned hub wind, power, availability, and curtailment signals from the plant historian or OEM export.

**Why SCADA:** For investment-grade views, modeled wind from public weather is a placeholder. SCADA is ground truth for what the farm actually saw and produced, which is what matters for curtailment capture and co-location economics.

**Cost:** Covered by project agreements and integration work, not a public open API.

**Limits:** Access, sampling rate, and field naming vary by operator — normalize in the ingestion layer.

---

## Demo Data Strategy

Focus on AESO data and the Canadian Wind Turbine Database for public demo layers. SCADA is represented with **mock hourly series** in code (`src/lib/Backend/scada/`) until a historian or file feed is connected.

Where live data is not yet available — financial parameters, load forecasts, PPA terms, and site connectivity — we use realistic synthetic data. All mocked values are based on current industry benchmarks and are designed to be replaced by operator-provided data as projects progress. Swapping in actual numbers requires no platform changes.


*Data use governed by [AESO Terms](https://www.aeso.ca/legal/) and [Open Government Licence — Canada](https://open.canada.ca/en/open-government-licence-canada). SCADA use is governed by operator agreements and internal data policies.*
