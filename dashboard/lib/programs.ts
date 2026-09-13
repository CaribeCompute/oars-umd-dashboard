export type Program = {
  name: string;
  agency: string;
  type: 'Program' | 'Practice';
  land: 'farm' | 'forest' | 'both';
  stage: string;
  description: string;
  reason: string;
  costShare: string;
  timeline: string;
  deadline: string;
  tags: string[];
};

export const programs: Program[] = [
  {
    name: 'Conservation Practice Standard 656',
    agency: 'USDA Natural Resources Conservation Service',
    type: 'Practice',
    land: 'farm',
    stage: 'Early signs',
    description:
      'Constructed or restored wetland practices that help manage recurring saturation and habitat transition.',
    reason:
      'Matches wet conditions, habitat goals, and a farm property in transition.',
    costShare:
      'Financial assistance may be available after an NRCS eligibility review.',
    timeline: 'Planning commonly begins several months before installation.',
    deadline: 'Contact the local service center for current ranking dates.',
    tags: ['wetlands', 'habitat', 'water'],
  },
  {
    name: 'Drainage Water Management',
    agency: 'USDA Natural Resources Conservation Service',
    type: 'Practice',
    land: 'farm',
    stage: 'Early signs',
    description:
      'Manages water-table elevation and discharge from agricultural drainage systems.',
    reason:
      'Supports continued production where prolonged wetness and drainage changes are still manageable.',
    costShare:
      'Cost-share depends on site design and an approved conservation plan.',
    timeline:
      'Site assessment and engineering design are required before installation.',
    deadline: 'Program dates vary by county and funding cycle.',
    tags: ['agriculture', 'drainage', 'water'],
  },
  {
    name: 'Conservation Easement Planning',
    agency: 'Maryland Environmental Trust',
    type: 'Program',
    land: 'both',
    stage: 'Moderate impact',
    description:
      'Long-term land protection options developed with eligible property owners and conservation partners.',
    reason: 'Aligns with property protection, legacy, and habitat priorities.',
    costShare:
      'Terms and potential financial benefits depend on the easement program.',
    timeline: 'Review, appraisal, and legal steps may take a year or longer.',
    deadline: 'Initial inquiries are accepted throughout the year.',
    tags: ['legacy', 'habitat', 'planning'],
  },
  {
    name: 'Salt-Tolerant Species Transition',
    agency: 'OARS practice reference',
    type: 'Practice',
    land: 'both',
    stage: 'Severe impact',
    description:
      'Evaluates alternative vegetation or managed transition where conventional production is no longer reliable.',
    reason:
      'Relevant when salt-tolerant vegetation is established and transition is a stated goal.',
    costShare:
      'Funding depends on the selected practice and administering program.',
    timeline: 'Begin with site assessment and species selection.',
    deadline: 'No single deadline; confirm with the selected program provider.',
    tags: ['transition', 'plants', 'habitat'],
  },
  {
    name: 'Forest Stand Improvement',
    agency: 'USDA Natural Resources Conservation Service',
    type: 'Practice',
    land: 'forest',
    stage: 'Early signs',
    description:
      'Improves forest health and composition based on site conditions and management goals.',
    reason: 'Supports forest resilience and long-term land stewardship.',
    costShare: 'May qualify for conservation financial assistance.',
    timeline: 'Requires a forest management assessment and practice plan.',
    deadline: 'Contact the local service center for current dates.',
    tags: ['forest', 'legacy', 'habitat'],
  },
];
