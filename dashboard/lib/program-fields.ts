// Shared by workbook import display and contributor program forms.
export const programDetailFields = [
  {
    "key": "programName",
    "sourceKey": "programName",
    "label": "Parent program / category",
    "section": "Overview"
  },
  {
    "key": "landDescription",
    "sourceKey": "landDescription",
    "label": "Land use described in source",
    "section": "Overview"
  },
  {
    "key": "scopeDetail",
    "sourceKey": "scopeDetail",
    "label": "Geographic scope",
    "section": "Overview"
  },
  {
    "key": "county",
    "sourceKey": "county",
    "label": "County / local coverage",
    "section": "Overview"
  },
  {
    "key": "eligibility",
    "sourceKey": "eligibility",
    "label": "Eligibility",
    "section": "Eligibility and practices"
  },
  {
    "key": "requirements",
    "sourceKey": "requirements",
    "label": "Program requirements",
    "section": "Eligibility and practices"
  },
  {
    "key": "practice",
    "sourceKey": "practice",
    "label": "Practices supported",
    "section": "Eligibility and practices"
  },
  {
    "key": "code",
    "sourceKey": "code",
    "label": "Practice code",
    "section": "Eligibility and practices"
  },
  {
    "key": "strategies",
    "sourceKey": "strategies",
    "label": "Strategies / plants and species",
    "section": "Eligibility and practices"
  },
  {
    "key": "swiStrategies",
    "sourceKey": "swiStrategies",
    "label": "SWI-specific strategies",
    "section": "Eligibility and practices"
  },
  {
    "key": "goals",
    "sourceKey": "goals",
    "label": "Landowner goals in source",
    "section": "Eligibility and practices"
  },
  {
    "key": "cost_share",
    "sourceKey": "costShare",
    "label": "Cost share / financial assistance",
    "section": "Funding and timing"
  },
  {
    "key": "benefit",
    "sourceKey": "benefit",
    "label": "Payment / economic benefit",
    "section": "Funding and timing"
  },
  {
    "key": "timeline",
    "sourceKey": "timeline",
    "label": "Application to implementation",
    "section": "Funding and timing"
  },
  {
    "key": "duration",
    "sourceKey": "duration",
    "label": "Program duration",
    "section": "Funding and timing"
  },
  {
    "key": "nextStep",
    "sourceKey": "nextStep",
    "label": "Next step",
    "section": "Contacts and next steps"
  },
  {
    "key": "personnel",
    "sourceKey": "personnel",
    "label": "Key personnel",
    "section": "Contacts and next steps"
  },
  {
    "key": "contacts",
    "sourceKey": "contacts",
    "label": "Contact information",
    "section": "Contacts and next steps"
  },
  {
    "key": "experts",
    "sourceKey": "experts",
    "label": "Strategy specialists",
    "section": "Contacts and next steps"
  },
  {
    "key": "limitations",
    "sourceKey": "limitations",
    "label": "Limitations / barriers",
    "section": "Evaluation and notes"
  },
  {
    "key": "quantitative",
    "sourceKey": "quantitative",
    "label": "Quantitative evaluation",
    "section": "Evaluation and notes"
  },
  {
    "key": "qualitative",
    "sourceKey": "qualitative",
    "label": "Qualitative evaluation",
    "section": "Evaluation and notes"
  },
  {
    "key": "notes",
    "sourceKey": "notes",
    "label": "Source notes",
    "section": "Evaluation and notes"
  },
  {
    "key": "stage",
    "sourceKey": "stage",
    "label": "SWI stage",
    "section": "Overview"
  },
  {
    "key": "deadline",
    "sourceKey": "deadline",
    "label": "Application deadline",
    "section": "Funding and timing"
  }
] as const;
export const programLinkFields = [
  {
    "key": "website",
    "label": "Program website"
  },
  {
    "key": "practiceWebsite",
    "label": "Practice website"
  },
  {
    "key": "overviewUrl",
    "label": "Practice overview PDF"
  }
] as const;
export function safeProgramUrl(value: string) {
  try { const url = new URL(value.trim()); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
