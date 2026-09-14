/**
 * The assessment model is content, not UI code. These records are shaped like
 * the scorecard/reference tables described in docs/database-schema.md so they
 * can be replaced by published Supabase rows without changing the workflow.
 *
 * The repository contains no OARS-approved thresholds or catalog records yet.
 * Consequently the bundled configuration is explicitly draft and must not be
 * presented as a scientific determination or an eligibility decision.
 */
export const SCORECARD_METHODOLOGY_VERSION = 'oars-mvp-draft-2026-09-10';

export type LandType = 'farm' | 'forest' | 'both';
export type StageId = 'none' | 'early' | 'transition' | 'severe' | 'marsh' | 'incomplete';

export type ScorecardOption = {
  id: string;
  label: string;
  description: string;
  descriptionForest?: string;
  descriptionBoth?: string;
  descriptionWoodlot?: string;
  score: number | null;
  sortOrder: number;
  imageSrc?: string;
  imageSrcForest?: string;
  imageSrcBoth?: string;
  imageSrcWoodlot?: string;
  color?: string;
};

export type ScorecardIndicator = {
  id: string;
  label: string;
  question: string;
  appliesTo: Exclude<LandType, 'both'>[];
  options: ScorecardOption[];
  source: string;
  active: boolean;
};

export type StageDefinition = {
  id: StageId;
  label: string;
  minAverage: number | null;
  maxAverage: number | null;
  summary: string;
  sortOrder: number;
};

const notSure: ScorecardOption = {
  id: 'not_sure',
  label: 'Not sure / not observed',
  description: 'Use this when the available descriptions do not match what you observe.',
  score: null,
  sortOrder: 4,
};

const stageLabels = ['No Impact', 'Early Signs', 'Moderate Impact', 'Severe Impact', 'Marsh Conversion'];

const options = (
  id: string,
  descriptions: string[],
  forestDescriptions: string[],
  bothDescriptions: string[],
  woodlotDescriptions: string[],
  images: string[],
  forestReference: string[],
  bothReference: string[],
  woodlotReference: string[],
): ScorecardOption[] =>
  [
    ...descriptions.map((description, score) => ({
      id: `${id}-${score}`,
      label: stageLabels[score],
      description,
      descriptionForest: forestDescriptions[score],
      descriptionBoth: bothDescriptions[score],
      descriptionWoodlot: woodlotDescriptions[score],
      score,
      sortOrder: score,
      imageSrc: images[score],
      imageSrcForest: forestReference[score],
      imageSrcBoth: bothReference[score],
      imageSrcWoodlot: woodlotReference[score],
      color: ['#4f9f76', '#d6ad28', '#e17d22', '#b75d4a', '#4b2a63'][score],
    })),
    notSure,
  ];

const farmPlantDescriptions = [
  'Healthy crop, uniform stands.',
  'Crops present with localized stress or damage.',
  'Poor germination, uneven stands, and bare patches; salt-tolerant species may appear along field edges.',
  'Very low to no crop productivity; salt-tolerant or marsh species established within the field.',
  'Dominated by native marsh vegetation.',
];
const farmSoilDescriptions = [
  'No visible salt accumulation; well-structured soil.',
  'Initial salt accumulation near field edges or drainage ditches.',
  'Expansion of salt-affected areas (white, bare patches), often along drainage pathways.',
  'Large, visible salt patches; degraded soil structure, presence of soil dispersion (cracking).',
  'Fully saturated soils with organic matter accumulation.',
];
const farmWaterDescriptions = [
  'Well-drained conditions; no prolonged saturation.',
  'Low-lying areas remain saturated for longer periods after rainfall or after perigean spring tides.',
  'Reduced drainage; some areas remain persistently wet, algae may appear on soil surface as indicator of prolonged inundation.',
  'Frequent saturation, green algae persists.',
  'Persistent or standing water; hydrology driven by tidal or groundwater influence.',
];
const forestPlantDescriptions = [
  'Open understory, sparse grasses, herbs, and vines; closed canopy, healthy trees, adjacent tree canopies nearly touch.',
  'Relatively open understory, some grasses, herbs, and vines; small shrubs or patches of regenerating trees. Closed canopy, but change in overstory composition towards fewer species or one dominant species (unless planted).',
  'Increase in shrubs in understory compared to unaffected areas. Canopy opening, loss of branches.',
  'Phragmites prevalent. Severe canopy decline, loss of branches, sloughing tree bark.',
  'Dominance of native marsh grasses or Phragmites and shrubs. Ghost forest (standing dead trees) with marsh. Canopy absent.',
];
const forestSoilDescriptions = [
  'Forest is walkable, not a lot of wet spots to navigate.',
  'During high tides, boots are needed to navigate parts of the forest/woodlot. Soils may become saturated after storms but dry within a few days.',
  'Large parts of the forest are waterlogged and difficult to navigate even at low tide. Soils remain saturated for long periods following storms.',
  'Soils cannot support your weight because of waterlogging. Unstable footing.',
  'Fully saturated soils with organic matter accumulation; no tree roots.',
];

const fiveStageImage = (src: string) => Array.from({ length: 5 }, () => src);

// Each file is a five-panel aerial reference sequence ordered from No Impact
// through Marsh Conversion. The Scorecard crops the panel matching the score.
const farmImages = fiveStageImage('/scorecard/farm-vegetation.png');
const farmSoilImages = fiveStageImage('/scorecard/farm-soil.png');
const farmWaterImages = fiveStageImage('/scorecard/farm-water.png');
const forestImages = fiveStageImage('/scorecard/forest-vegetation.png');
const forestSoilImages = fiveStageImage('/scorecard/forest-soil.png');
const forestWaterImages = fiveStageImage('/scorecard/forest-water.png');
const bothImages = farmImages;
const bothSoilImages = farmSoilImages;
const bothWaterImages = farmWaterImages;
const woodlotImages = forestImages;
const woodlotSoilImages = forestSoilImages;
const woodlotWaterImages = forestWaterImages;

export const scorecardIndicators: ScorecardIndicator[] = [
  {
    id: 'plants',
    label: 'Plant condition',
    question: 'What best describes crop or forest vegetation?',
    appliesTo: ['farm', 'forest'],
    options: options('plants', farmPlantDescriptions, forestPlantDescriptions, farmPlantDescriptions, forestPlantDescriptions, farmImages, forestImages, bothImages, woodlotImages),
    source: 'docs/database-schema.md: SCORECARD_INDICATORS / INDICATOR_OPTIONS',
    active: true,
  },
  {
    id: 'soil',
    label: 'Soil appearance',
    question: 'What signs are visible on the soil surface?',
    appliesTo: ['farm', 'forest'],
    options: options('soil', farmSoilDescriptions, forestSoilDescriptions, farmSoilDescriptions, forestSoilDescriptions, farmSoilImages, forestSoilImages, bothSoilImages, woodlotSoilImages),
    source: 'docs/database-schema.md: SCORECARD_INDICATORS / INDICATOR_OPTIONS',
    active: true,
  },
  {
    id: 'water',
    label: 'Water and drainage',
    question: 'How often does water remain on the land?',
    appliesTo: ['farm', 'forest'],
    options: options('water', farmWaterDescriptions, forestSoilDescriptions, farmWaterDescriptions, forestSoilDescriptions, farmWaterImages, forestWaterImages, bothWaterImages, woodlotWaterImages),
    source: 'docs/database-schema.md: SCORECARD_INDICATORS / INDICATOR_OPTIONS',
    active: true,
  },
];

/**
 * Thresholds are a draft configuration only. A production deployment must
 * load approved rows from the database and use their methodology version.
 */
export const stageDefinitions: StageDefinition[] = [
  { id: 'none', label: 'No Impact', minAverage: 0, maxAverage: 0, summary: 'No Impact is selected for the observed indicators.', sortOrder: 1 },
  { id: 'early', label: 'Early Signs', minAverage: 1, maxAverage: 1, summary: 'Early Signs are selected for the observed indicators.', sortOrder: 2 },
  { id: 'transition', label: 'Moderate Impact', minAverage: 2, maxAverage: 2, summary: 'Moderate Impact is selected for the observed indicators.', sortOrder: 3 },
  { id: 'severe', label: 'Severe Impact', minAverage: 3, maxAverage: 3, summary: 'Severe Impact is selected for the observed indicators.', sortOrder: 4 },
  { id: 'marsh', label: 'Marsh Conversion', minAverage: 4, maxAverage: 4, summary: 'Marsh Conversion is selected for the observed indicators.', sortOrder: 5 },
  { id: 'incomplete', label: 'Not enough information', minAverage: null, maxAverage: null, summary: 'Answer each indicator, or mark it not sure, before interpreting a stage.', sortOrder: 6 },
];

export type ScoreResult = {
  average: number | null;
  total: number | null;
  answered: number;
  required: number;
  complete: boolean;
  methodologyVersion: string;
  stage: StageDefinition;
};

export function calculateScore(
  answers: Record<string, number | null | undefined>,
  indicators: ScorecardIndicator[] = scorecardIndicators,
  methodologyVersion = SCORECARD_METHODOLOGY_VERSION,
): ScoreResult {
  const active = indicators.filter((indicator) => indicator.active);
  const values = active.map((indicator) => answers[indicator.id]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const complete = values.length === active.length && active.length > 0;
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const stage = !complete || average === null
    ? stageDefinitions.find((item) => item.id === 'incomplete')!
    : stageDefinitions.find((item) => item.minAverage !== null && item.maxAverage !== null && average >= item.minAverage && average <= item.maxAverage) ?? stageDefinitions.find((item) => item.id === 'incomplete')!;
  return {
    average: average === null ? null : Math.round(average * 100) / 100,
    total: values.length === active.length ? values.reduce((sum, value) => sum + value, 0) : null,
    answered: values.length,
    required: active.length,
    complete,
    methodologyVersion,
    stage,
  };
}

export type Goal = { id: string; label: string; sortOrder: number; source: string };
export const goals: Goal[] = [
  { id: 'agriculture', label: 'Continue agricultural or forestry use', sortOrder: 1, source: 'docs/database-schema.md: GOALS' },
  { id: 'transition', label: 'Transition to a salt-tolerant land use', sortOrder: 2, source: 'docs/database-schema.md: GOALS' },
  { id: 'habitat', label: 'Protect or restore natural habitat', sortOrder: 3, source: 'docs/database-schema.md: GOALS' },
  { id: 'income', label: 'Maintain income from the land', sortOrder: 4, source: 'docs/database-schema.md: GOALS' },
  { id: 'legacy', label: 'Protect the property and its legacy', sortOrder: 5, source: 'docs/database-schema.md: GOALS' },
  { id: 'infrastructure', label: 'Protect roads, drainage, or buildings', sortOrder: 6, source: 'docs/database-schema.md: GOALS' },
  { id: 'woodlot-management', label: 'Manage and improve a woodlot or forest stand', sortOrder: 7, source: 'Copy of OARS Mid-Atlantic Tool Database.xlsx / Federal Practices' },
  { id: 'invasive-species', label: 'Manage invasive or undesirable woody vegetation', sortOrder: 8, source: 'Copy of OARS Mid-Atlantic Tool Database.xlsx / Federal Practices' },
  { id: 'minimize-costs', label: 'Minimize implementation costs', sortOrder: 9, source: 'docs/OARS Tool Updates.docx: Landowner Goals Assessment' },
  { id: 'marsh-transition', label: 'Facilitate a managed transition to marsh', sortOrder: 10, source: 'docs/OARS Tool Updates.docx: Landowner Goals Assessment' },
];

export type Resource = {
  id: string;
  name: string;
  agency: string;
  type: 'Program' | 'Practice';
  landTypes: LandType[];
  stageIds: StageId[];
  goalIds: string[];
  concernIds?: string[];
  description: string;
  eligibility: string | null;
  requirements?: string | null;
  costShare: string | null;
  paymentBenefit?: string | null;
  timeline: string | null;
  duration?: string | null;
  deadline: string | null;
  limitations: string | null;
  sourceUrl: string | null;
  practiceUrl?: string | null;
  practiceOverviewUrl?: string | null;
  strategies?: string[];
  nextStep?: string | null;
  contact?: string | null;
  scope?: string | null;
  county?: string | null;
  programId?: string | null;
  programName?: string | null;
  source: string;
  sourceRow?: number;
  mappingStatus?: 'provisional-keyword' | 'oars-input-required' | 'oars-approved';
  status: 'draft' | 'published' | 'archived';
};

import catalogData from '../content/mid-atlantic-catalog.ts';

const normalizeCatalogResource = (resource: Resource): Resource => {
  const text = `${resource.name} ${resource.description} ${resource.eligibility ?? ''} ${resource.limitations ?? ''}`.toLowerCase();
  const inferredConcernIds = [
    ...(text.match(/soil|erosion|tillage|cover crop|nutrient|phosphorus|runoff|gypsum/) ? ['soil-health'] : []),
    ...(text.match(/water|drain|irrigat|flood|wetland|channel|runoff/) ? ['water-management'] : []),
    ...(text.match(/habitat|wildlife|pollinator|hedgerow|buffer|tree|forest|wood/) ? ['habitat'] : []),
    ...(text.match(/invasive|brush|woody|phragmites|vegetation/) ? ['vegetation-management'] : []),
  ];
  return {
    ...resource,
    landTypes: Array.isArray(resource.landTypes)
      ? resource.landTypes
      : String(resource.landTypes).toLowerCase().includes('forest')
        ? String(resource.landTypes).toLowerCase().includes('farm') ? ['farm', 'forest'] : ['forest']
        : ['farm'],
    concernIds: resource.concernIds?.length ? resource.concernIds : [...new Set(inferredConcernIds)],
  };
};

export const resources: Resource[] = (catalogData as Resource[]).map(normalizeCatalogResource);

export type Recommendation = Resource & { rank: number; matchScore: number; explanation: string[] };

export function rankRecommendations(
  input: { landType: LandType; stageId: StageId; goalIds: string[]; concernIds?: string[] },
  catalog: Resource[] = resources,
): Recommendation[] {
  return catalog
    .filter((resource) =>
      resource.status === 'published' &&
      (resource.landTypes.includes(input.landType) || (input.landType === 'both' && resource.landTypes.some((type) => type === 'farm' || type === 'forest'))) &&
      (resource.stageIds.length === 0 || resource.stageIds.includes(input.stageId)),
    )
    .map((resource) => {
      const matchedGoals = input.goalIds.filter((id) => resource.goalIds.includes(id));
      const stageMatch = resource.stageIds.includes(input.stageId);
      const matchedConcerns = (input.concernIds ?? []).filter((id) => resource.concernIds?.includes(id));
      const matchScore = (stageMatch ? 10 : 0) + matchedGoals.length * 2 + matchedConcerns.length * 3;
      const explanation = [
        stageMatch
          ? 'Land type and stage match the configured rule fields.'
          : 'Land type matches. The workbook does not provide an approved SWI-stage mapping for this resource.',
        matchedGoals.length
          ? `Provisional source-text match for selected goals: ${matchedGoals.join(', ')}.`
          : 'The workbook does not provide an approved selected-goal mapping for this resource.',
        matchedConcerns.length ? `Addresses selected needs: ${matchedConcerns.join(', ')}.` : 'No selected-need match was published.',
        resource.mappingStatus === 'oars-approved'
          ? 'Recommendation mapping is OARS approved.'
          : 'Recommendation mapping is provisional and requires OARS review.',
      ];
      return { ...resource, rank: 0, matchScore, explanation };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name))
    .map((resource, index) => ({ ...resource, rank: index + 1 }));
}
