'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  Check,
  CircleAlert,
  Compass,
  Database,
  Download,
  ExternalLink,
  Filter,
  Home as HomeIcon,
  KeyRound,
  Layers3,
  Map,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  LogOut,
  Pencil,
  Sprout,
  Trash2,
  TreePine,
  Waves,
  UserRound,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress, ProgressLabel } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FunctionalMap } from '@/components/functional-map';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type View = 'assessment' | 'explore' | 'gis';
type LandType = 'farm' | 'forest' | 'both';
type Role = 'landowner' | 'agency' | 'admin';
type PublicView = 'landing' | 'login' | 'register';

type Property = {
  id: number;
  name: string;
  location: string;
  acres: string;
  cadastralNumber: string;
  latitude: number;
  longitude: number;
  landType: LandType;
  status: string;
};

function OarsMark({ className = 'size-8' }: { className?: string }) {
  return (
    <Image
      src="/oars-mark.png"
      alt=""
      aria-hidden="true"
      width={64}
      height={64}
      className={`${className} object-contain`}
    />
  );
}

type DemoUser = {
  name: string;
  email: string;
  role: Role;
  organization?: string;
};

const demoUsers: DemoUser[] = [
  { name: 'Jordan Lee', email: 'landowner@oars.demo', role: 'landowner' },
  {
    name: 'Morgan Diaz',
    email: 'agency@oars.demo',
    role: 'agency',
    organization: 'Coastal Conservation Office',
  },
  {
    name: 'Alex Chen',
    email: 'admin@oars.demo',
    role: 'admin',
    organization: 'OARS Research Team',
  },
];

type Program = {
  name: string;
  agency: string;
  type: 'Program' | 'Practice';
  land: LandType;
  stage: string;
  description: string;
  reason: string;
  costShare: string;
  timeline: string;
  deadline: string;
  tags: string[];
};

const steps = [
  { label: 'Property', detail: 'Location and land use' },
  { label: 'SWI score', detail: 'Field indicators' },
  { label: 'Goals', detail: 'Your priorities' },
  { label: 'Results', detail: 'Programs and practices' },
];

const indicators = [
  {
    id: 'plants',
    label: 'Plant condition',
    question: 'What best describes crop or forest vegetation?',
    options: [
      'Healthy and uniform',
      'Localized stress',
      'Bare patches or salt-tolerant species',
      'Mostly marsh vegetation',
    ],
  },
  {
    id: 'soil',
    label: 'Soil appearance',
    question: 'What signs are visible on the soil surface?',
    options: [
      'No visible salt',
      'Salt near field edges',
      'Large white or bare patches',
      'Organic marsh soil',
    ],
  },
  {
    id: 'water',
    label: 'Water and drainage',
    question: 'How often does water remain on the land?',
    options: [
      'Drains normally',
      'Wet longer after rain or tides',
      'Frequently saturated',
      'Persistent standing or tidal water',
    ],
  },
];

const goalOptions = [
  {
    id: 'agriculture',
    label: 'Continue agricultural or forestry use',
    icon: Sprout,
  },
  {
    id: 'transition',
    label: 'Transition to a salt-tolerant land use',
    icon: Waves,
  },
  {
    id: 'habitat',
    label: 'Protect or restore natural habitat',
    icon: TreePine,
  },
  { id: 'income', label: 'Maintain income from the land', icon: Database },
  {
    id: 'legacy',
    label: 'Protect the property and its legacy',
    icon: ShieldCheck,
  },
  {
    id: 'infrastructure',
    label: 'Protect roads, drainage, or buildings',
    icon: MapPin,
  },
];

const programs: Program[] = [
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

const stageDetails = [
  {
    max: 2,
    label: 'No impact',
    color: '#4f9f76',
    copy: 'The selected indicators do not show a clear pattern of saltwater intrusion.',
  },
  {
    max: 5,
    label: 'Early signs',
    color: '#2f83a5',
    copy: 'Localized stress or longer wet periods may indicate early saltwater intrusion.',
  },
  {
    max: 7,
    label: 'Moderate impact',
    color: '#d99b2b',
    copy: 'Multiple indicators suggest that salt and water are affecting land performance.',
  },
  {
    max: 9,
    label: 'Severe impact',
    color: '#b75d4a',
    copy: 'Persistent saturation and vegetation change suggest a major transition is underway.',
  },
];

function Assessment({
  openExplore,
  property,
}: {
  openExplore: () => void;
  property?: Property;
}) {
  const [step, setStep] = useState(0);
  const [landType, setLandType] = useState<LandType>(property?.landType ?? 'farm');
  const [address, setAddress] = useState(
    property?.location ?? 'Somerset County, Maryland',
  );
  const [role, setRole] = useState('landowner');
  const [answers, setAnswers] = useState<Record<string, number>>({
    plants: 1,
    soil: 1,
    water: 2,
  });
  const [goals, setGoals] = useState<string[]>([
    'agriculture',
    'habitat',
    'legacy',
  ]);

  const score = Object.values(answers).reduce(
    (total, value) => total + value,
    0,
  );
  const stage =
    stageDetails.find((item) => score <= item.max) ??
    stageDetails[stageDetails.length - 1];
  const recommendations = useMemo(
    () =>
      programs
        .filter(
          (program) => program.land === landType || program.land === 'both',
        )
        .slice(0, 3),
    [landType],
  );

  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool?: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'start_oars_assessment',
          title: 'Start OARS assessment',
          description:
            'Open the OARS property step and prefill a general location and land type in the visible assessment.',
          inputSchema: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              landType: { type: 'string', enum: ['farm', 'forest', 'both'] },
            },
            required: ['location', 'landType'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const value = input as { location?: unknown; landType?: unknown };
            if (
              typeof value.location !== 'string' ||
              !['farm', 'forest', 'both'].includes(String(value.landType))
            )
              throw new Error('A location and valid land type are required.');
            setAddress(value.location.trim());
            setLandType(value.landType as LandType);
            setStep(0);
            return {
              status: 'ready',
              step: 'property',
              location: value.location.trim(),
              landType: value.landType,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <>
      <section className="border-b bg-[var(--navy)] text-white print:hidden">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-5 pb-8 pt-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--seafoam)]">
              Guided assessment
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Find practical options for salt-affected land
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/72">
              Describe the property, note visible conditions, and rank what
              matters to you. OARS will prepare a shortlist to discuss with a
              service provider.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            <ShieldCheck className="size-5 text-[var(--seafoam)]" /> Demo uses
            synthetic information
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="border-b bg-[var(--mist)] px-5 py-6 lg:min-h-[calc(100vh-220px)] lg:border-b-0 lg:border-r lg:px-7 lg:py-8 print:hidden">
          <Progress value={(step + 1) * 25} className="mb-8">
            <ProgressLabel>Assessment progress</ProgressLabel>
            <span className="ml-auto text-sm tabular-nums text-muted-foreground">
              {(step + 1) * 25}%
            </span>
          </Progress>
          <ol className="grid gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {steps.map((item, index) => (
              <li key={item.label}>
                <button
                  onClick={() => index <= step && setStep(index)}
                  disabled={index > step}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left ${index === step ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-muted-foreground'} disabled:cursor-not-allowed`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index < step ? 'bg-[var(--teal)] text-[var(--navy)]' : index === step ? 'bg-[var(--navy)] text-white' : 'border border-current'}`}
                  >
                    {index < step ? <Check className="size-4" /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5">
                      {item.detail}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-8 border-t border-[var(--line)] pt-6 text-sm leading-6 text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <Compass className="size-4 text-[var(--teal-dark)]" /> Why this
              matters
            </div>
            {step === 0 &&
              'Property context helps OARS compare resources that may apply to your land.'}
            {step === 1 &&
              'Visible indicators provide a preliminary stage for planning conversations.'}
            {step === 2 &&
              'Your ranked goals help put the most relevant options first.'}
            {step === 3 &&
              'Recommendations are starting points, not eligibility decisions.'}
          </div>
        </aside>

        <section className="min-h-[690px] px-5 py-8 lg:px-12 lg:py-12">
          {step === 0 && (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,720px)_minmax(280px,1fr)]">
              <form
                className="max-w-3xl"
                onSubmit={(event) => event.preventDefault()}
              >
                <p className="text-sm font-semibold text-[var(--teal-dark)]">
                  Step 1 of 4
                </p>
                <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                  Tell us about the property
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  {property
                    ? `Assessment for ${property.name}. Its saved coordinates are used to locate it on the map.`
                    : 'Start with a general location and land type.'}
                </p>
                <div className="mt-9 space-y-8">
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">
                      Property location
                    </legend>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                          aria-label="Property address or county"
                          className="h-12 rounded-xl bg-white pl-11 text-base shadow-sm"
                        />
                      </div>
                      <Button className="h-12 rounded-xl px-5">Find</Button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Use an address, county, city, or ZIP code.
                    </p>
                  </fieldset>
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">
                      How is the land used?
                    </legend>
                    <RadioGroup
                      value={landType}
                      onValueChange={(value) =>
                        setLandType(String(value) as LandType)
                      }
                      className="grid gap-3 sm:grid-cols-3"
                    >
                      {[
                        ['farm', 'Farm', 'Crop or pasture land'],
                        ['forest', 'Forest', 'Managed forest or woodlot'],
                        ['both', 'Both', 'Mixed farm and forest'],
                      ].map(([value, label, description]) => (
                        <label
                          key={value}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${landType === value ? 'border-[var(--teal-dark)] bg-[var(--teal-soft)] ring-2 ring-[var(--teal)]/20' : 'bg-white hover:border-[var(--teal)]'}`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{label}</span>
                            <RadioGroupItem value={value} aria-label={label} />
                          </span>
                          <span className="mt-2 block text-sm leading-5 text-muted-foreground">
                            {description}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </fieldset>
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">
                      Your relationship to the property
                    </legend>
                    <RadioGroup
                      value={role}
                      onValueChange={(value) => setRole(String(value))}
                      className="grid gap-3 sm:grid-cols-3"
                    >
                      {[
                        ['landowner', 'Landowner'],
                        ['tenant', 'Tenant farmer'],
                        ['provider', 'Service provider'],
                      ].map(([value, label]) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium"
                        >
                          <RadioGroupItem value={value} />
                          {label}
                        </label>
                      ))}
                    </RadioGroup>
                  </fieldset>
                  <div className="flex justify-end border-t border-[var(--line)] pt-6">
                    <Button
                      size="lg"
                      className="h-11 rounded-xl px-5"
                      onClick={() => setStep(1)}
                    >
                      Continue to SWI score <ArrowRight />
                    </Button>
                  </div>
                </div>
              </form>
              <FunctionalMap
                initialAddress={address}
                initialCoordinates={
                  property
                    ? {
                        latitude: property.latitude,
                        longitude: property.longitude,
                      }
                    : undefined
                }
                onAddressChange={setAddress}
                compact
              />
            </div>
          )}

          {step === 1 && (
            <div className="mx-auto max-w-5xl">
              <p className="text-sm font-semibold text-[var(--teal-dark)]">
                Step 2 of 4
              </p>
              <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-heading text-3xl font-semibold tracking-tight">
                    OARS saltwater intrusion scorecard
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                    Choose the description that most closely matches the field.
                    The demonstration score is not a scientific determination.
                  </p>
                </div>
                <div className="rounded-2xl border bg-white px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Current score
                  </p>
                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: stage.color }}
                  >
                    {score} · {stage.label}
                  </p>
                </div>
              </div>
              <div className="mt-8 grid gap-5">
                {indicators.map((indicator, index) => (
                  <fieldset
                    key={indicator.id}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <legend className="px-1 text-sm font-semibold text-[var(--teal-dark)]">
                      {index + 1}. {indicator.label}
                    </legend>
                    <p className="mb-4 mt-1 text-lg font-semibold">
                      {indicator.question}
                    </p>
                    <RadioGroup
                      value={String(answers[indicator.id])}
                      onValueChange={(value) =>
                        setAnswers((current) => ({
                          ...current,
                          [indicator.id]: Number(value),
                        }))
                      }
                      className="grid gap-2 md:grid-cols-4"
                    >
                      {indicator.options.map((option, optionIndex) => (
                        <label
                          key={option}
                          className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm leading-5 ${answers[indicator.id] === optionIndex ? 'border-[var(--teal-dark)] bg-[var(--teal-soft)]' : 'hover:bg-muted/40'}`}
                        >
                          <RadioGroupItem
                            value={String(optionIndex)}
                            className="mt-0.5"
                          />
                          {option}
                        </label>
                      ))}
                    </RadioGroup>
                  </fieldset>
                ))}
              </div>
              <div
                className="mt-6 rounded-2xl border-l-4 bg-[var(--mist)] p-5"
                style={{ borderLeftColor: stage.color }}
              >
                <p className="font-semibold">
                  Preliminary stage: {stage.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {stage.copy} OARS must approve the final methodology and
                  thresholds before production use.
                </p>
              </div>
              <div className="mt-7 flex justify-between border-t border-[var(--line)] pt-6">
                <Button variant="outline" size="lg" onClick={() => setStep(0)}>
                  <ArrowLeft /> Property
                </Button>
                <Button size="lg" onClick={() => setStep(2)}>
                  Continue to goals <ArrowRight />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mx-auto max-w-5xl">
              <p className="text-sm font-semibold text-[var(--teal-dark)]">
                Step 3 of 4
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                Rank what matters most
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Select up to four goals. The number shows the order in which
                OARS will consider them.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {goalOptions.map((goal) => {
                  const priority = goals.indexOf(goal.id);
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() =>
                        setGoals((current) =>
                          current.includes(goal.id)
                            ? current.filter((id) => id !== goal.id)
                            : current.length < 4
                              ? [...current, goal.id]
                              : current,
                        )
                      }
                      className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${priority >= 0 ? 'border-[var(--teal-dark)] bg-[var(--teal-soft)] shadow-sm' : 'bg-white hover:border-[var(--teal)]'}`}
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-[var(--teal-dark)] shadow-sm">
                        <Icon className="size-6" />
                      </span>
                      <span className="flex-1 font-semibold leading-6">
                        {goal.label}
                      </span>
                      <span
                        className={`grid size-8 place-items-center rounded-full text-sm font-bold ${priority >= 0 ? 'bg-[var(--navy)] text-white' : 'border text-muted-foreground'}`}
                      >
                        {priority >= 0 ? priority + 1 : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[var(--mist)] p-4 text-sm leading-6 text-muted-foreground">
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-[var(--teal-dark)]" />
                <p>
                  These priorities help sort the results. They do not determine
                  program eligibility or replace advice from a conservation
                  professional.
                </p>
              </div>
              <div className="mt-7 flex justify-between border-t border-[var(--line)] pt-6">
                <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                  <ArrowLeft /> SWI score
                </Button>
                <Button
                  size="lg"
                  onClick={() => setStep(3)}
                  disabled={goals.length === 0}
                >
                  See recommendations <ArrowRight />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mx-auto max-w-6xl print:max-w-none">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold text-[var(--teal-dark)]">
                    Your OARS results
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                    A starting point for your next conversation
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                    These demonstration results combine property type,
                    preliminary SWI stage, and ranked goals.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.print()}
                  className="print:hidden"
                >
                  <Download /> Print results
                </Button>
              </div>
              <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr]">
                <div className="space-y-5">
                  <div className="rounded-2xl bg-[var(--navy)] p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--seafoam)]">
                      Preliminary SWI stage
                    </p>
                    <p className="mt-2 text-3xl font-bold">{stage.label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Score {score} from three demonstration indicators
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-white p-5">
                    <p className="text-sm font-semibold">Property summary</p>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Location</dt>
                        <dd className="font-medium">{address}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Land use</dt>
                        <dd className="font-medium capitalize">{landType}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Priority goals
                        </dt>
                        <dd className="font-medium">
                          {goals
                            .map(
                              (id) =>
                                goalOptions.find((item) => item.id === id)
                                  ?.label,
                            )
                            .join(', ')}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold">
                    Recommended programs and practices
                  </h3>
                  <div className="mt-4 grid gap-4">
                    {recommendations.map((program, index) => (
                      <article
                        key={program.name}
                        className="rounded-2xl border bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--teal-soft)] text-sm font-bold text-[var(--teal-dark)]">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                                {program.type}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {program.agency}
                              </span>
                            </div>
                            <h4 className="mt-2 text-lg font-semibold">
                              {program.name}
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {program.description}
                            </p>
                            <div className="mt-4 rounded-xl bg-[var(--mist)] p-3 text-sm leading-6">
                              <strong>Why it appears:</strong> {program.reason}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {program.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 print:hidden"
                    onClick={openExplore}
                  >
                    Explore the full catalog <ArrowRight />
                  </Button>
                </div>
              </div>
              <div className="mt-7 flex items-start gap-3 border-t border-[var(--line)] pt-6 text-sm leading-6 text-muted-foreground">
                <CircleAlert className="mt-0.5 size-5 shrink-0" />
                <p>
                  This prototype does not determine eligibility or provide
                  financial, engineering, or legal advice. Confirm current
                  program requirements and site suitability with the
                  administering agency or a qualified service provider.
                </p>
              </div>
              <div className="mt-7 print:hidden">
                <Button variant="outline" size="lg" onClick={() => setStep(2)}>
                  <ArrowLeft /> Revise goals
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function ExploreCatalog() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = programs.filter((program) => {
    const matchesQuery =
      `${program.name} ${program.agency} ${program.description} ${program.tags.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery &&
      (filter === 'all' || program.land === filter || program.land === 'both')
    );
  });
  return (
    <section className="mx-auto max-w-[1300px] px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal-dark)]">
            Explore
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
            Programs and practices
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Browse the full demonstration catalog. Personalized assessment
            results are ranked separately.
          </p>
        </div>
        <div className="rounded-xl border bg-[var(--mist)] px-4 py-3 text-sm">
          <strong>{filtered.length}</strong> resources shown
        </div>
      </div>
      <div className="mt-8 grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search programs, practices, agencies, or topics"
            className="h-11 pl-11 text-base"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="size-4 shrink-0 text-muted-foreground" />
          {['all', 'farm', 'forest'].map((value) => (
            <Button
              key={value}
              size="lg"
              variant={filter === value ? 'default' : 'outline'}
              onClick={() => setFilter(value)}
              className="capitalize"
            >
              {value === 'all' ? 'All land' : value}
            </Button>
          ))}
        </div>
      </div>
      <Tabs defaultValue="cards" className="mt-7">
        <TabsList>
          <TabsTrigger value="cards">Resource cards</TabsTrigger>
          <TabsTrigger value="compare">Compare details</TabsTrigger>
        </TabsList>
        <TabsContent value="cards">
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {filtered.map((program) => (
              <article
                key={program.name}
                className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold text-[var(--teal-dark)]">
                    {program.type}
                  </span>
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {program.land}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{program.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {program.agency}
                </p>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
                  {program.description}
                </p>
                <div className="mt-5 border-t pt-4">
                  <p className="text-sm">
                    <strong>Cost share:</strong> {program.costShare}
                  </p>
                  <Button
                    variant="link"
                    className="mt-3 h-auto p-0 text-[var(--teal-dark)]"
                  >
                    View resource details <ExternalLink />
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="mt-5 rounded-2xl border border-dashed p-12 text-center">
              <BookOpen className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No matching resources</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a broader search or a different land filter.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="compare">
          <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[var(--navy)] text-white">
                  <tr>
                    <th className="p-4">Resource</th>
                    <th className="p-4">SWI stage</th>
                    <th className="p-4">Cost share</th>
                    <th className="p-4">Timeline</th>
                    <th className="p-4">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((program) => (
                    <tr key={program.name} className="border-t align-top">
                      <td className="p-4 font-semibold">{program.name}</td>
                      <td className="p-4">{program.stage}</td>
                      <td className="max-w-xs p-4 text-muted-foreground">
                        {program.costShare}
                      </td>
                      <td className="max-w-xs p-4 text-muted-foreground">
                        {program.timeline}
                      </td>
                      <td className="max-w-xs p-4 text-muted-foreground">
                        {program.deadline}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function GisExplorer() {
  const [layers, setLayers] = useState(['Property boundary', 'Elevation']);
  const options = [
    'Property boundary',
    'Elevation',
    'Land cover',
    'Tidal reference',
    'SWI observations',
  ];
  return (
    <section className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="border-r bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal-dark)]">
          GIS explorer
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Spatial context
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Turn demonstration layers on and off. Production layers require OARS
          approval and complete source metadata.
        </p>
        <div className="mt-7">
          <p className="mb-3 text-sm font-semibold">Map layers</p>
          <div className="grid gap-2">
            {options.map((layer) => {
              const active = layers.includes(layer);
              return (
                <button
                  key={layer}
                  onClick={() =>
                    setLayers((current) =>
                      active
                        ? current.filter((item) => item !== layer)
                        : [...current, layer],
                    )
                  }
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium ${active ? 'border-[var(--teal-dark)] bg-[var(--teal-soft)]' : 'hover:bg-muted/40'}`}
                >
                  <span className="flex items-center gap-3">
                    <Layers3 className="size-4" />
                    {layer}
                  </span>
                  <span
                    className={`grid size-5 place-items-center rounded ${active ? 'bg-[var(--teal-dark)] text-white' : 'border'}`}
                  >
                    {active && <Check className="size-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-8 border-t pt-6">
          <p className="text-sm font-semibold">Layer information</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Each production layer will include its source, year, scale or
            resolution, documentation link, and attribution.
          </p>
        </div>
      </aside>
      <div className="bg-[var(--water)] p-4 lg:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            Pan, zoom, search, draw a boundary, or add observation markers.
          </p>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">
            {layers.length} active layers
          </span>
        </div>
        <FunctionalMap key={layers.join('|')} activeLayers={layers} />
      </div>
    </section>
  );
}

function PublicHeader({
  onNavigate,
}: {
  onNavigate: (view: PublicView) => void;
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-white/10 text-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 lg:px-8">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 text-left"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-white/95 p-1.5 shadow-sm">
            <OarsMark className="size-10" />
          </span>
          <span>
            <span className="block font-heading text-xl font-semibold">
              OARS
            </span>
            <span className="block text-xs text-white/65">
              Options for Adapting to Rising Seas
            </span>
          </span>
        </button>
        <nav className="flex items-center gap-2" aria-label="Public navigation">
          <Button
            variant="ghost"
            onClick={() => onNavigate('register')}
            className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Create account
          </Button>
          <Button
            onClick={() => onNavigate('login')}
            className="h-10 bg-[var(--teal)] px-4 text-[var(--navy)] hover:bg-[var(--seafoam)]"
          >
            <KeyRound /> Sign in
          </Button>
        </nav>
      </div>
    </header>
  );
}

function LandingPage({
  onNavigate,
}: {
  onNavigate: (view: PublicView) => void;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-[var(--navy)] text-white">
        <PublicHeader onNavigate={onNavigate} />
        <div
          className="landing-tide absolute inset-0 opacity-45"
          aria-hidden="true"
        />
        <section className="relative mx-auto grid min-h-[720px] max-w-[1400px] items-center gap-14 px-5 pb-20 pt-36 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--seafoam)]">
              Coastal land decisions
            </p>
            <h1 className="font-heading text-5xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              A clearer path for land affected by saltwater intrusion
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72">
              OARS helps property owners understand changing field conditions,
              organize their goals, and find assistance programs published by
              trusted agencies.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => onNavigate('register')}
                className="h-12 bg-[var(--teal)] px-6 text-base text-[var(--navy)] hover:bg-[var(--seafoam)]"
              >
                Register your property <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate('login')}
                className="h-12 border-white/25 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                Sign in to OARS
              </Button>
            </div>
            <p className="mt-5 text-sm text-white/55">
              New landowner accounts require administrator approval.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[580px]">
            <div className="absolute -inset-12 rounded-full bg-[var(--teal)]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/8 p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold">
                    Somerset County property
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    Planning overview
                  </p>
                </div>
                <span className="rounded-full bg-[var(--amber)] px-3 py-1 text-xs font-bold text-[var(--navy)]">
                  Early signs
                </span>
              </div>
              <div className="relative mt-5 h-[310px] overflow-hidden rounded-2xl bg-[#a9d4d2]">
                <div className="map-grid absolute inset-0 opacity-70" />
                <div className="absolute left-[18%] top-[18%] h-[58%] w-[62%] rotate-[-8deg] rounded-[32%_47%_39%_28%] border-[3px] border-[var(--amber)] bg-[var(--amber)]/18" />
                <span className="absolute left-[55%] top-[45%] size-8 rounded-full border-4 border-white bg-[#d45e49] shadow-lg" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 text-[var(--navy)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Top goal
                  </p>
                  <p className="mt-2 font-semibold">
                    Continue agricultural use
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--teal)] p-4 text-[var(--navy)]">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-65">
                    Matches
                  </p>
                  <p className="mt-2 text-2xl font-bold">3 programs</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--teal-dark)]">
              How OARS works
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
              From field observations to useful next steps
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              The tool keeps scientific context, property goals, and program
              details connected in one guided record.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {[
              [
                '01',
                'Map the property',
                'Search, draw the field boundary, and record observation points.',
              ],
              [
                '02',
                'Assess conditions',
                'Use OARS indicators to describe vegetation, soil, and water.',
              ],
              [
                '03',
                'Set priorities',
                'Rank near-term and long-term goals for each property.',
              ],
              [
                '04',
                'Review options',
                'Save a report and apply through an agency form or link.',
              ],
            ].map(([number, title, copy]) => (
              <li key={number} className="rounded-2xl border bg-white p-5">
                <span className="text-sm font-bold text-[var(--teal-dark)]">
                  {number}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {copy}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y bg-[var(--mist)]">
        <div className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--teal-dark)]">
              One platform, clear roles
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
              Who has an OARS account
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: HomeIcon,
                title: 'Landowners',
                copy: 'Register properties, complete and update assessments, save reports, review agency programs, and apply through the method each agency provides.',
              },
              {
                icon: Building2,
                title: 'Agencies',
                copy: 'Maintain agency contact details and publish assistance programs with an OARS application form or an external application link.',
              },
              {
                icon: Users,
                title: 'Administrators',
                copy: 'Review registrations, approve accounts, manage users, and protect access to the platform.',
              },
            ].map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="rounded-[26px] border bg-white p-7 shadow-sm"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-[var(--teal-soft)] text-[var(--teal-dark)]">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 lg:px-8">
        <div className="rounded-[32px] bg-[var(--navy)] px-7 py-12 text-white sm:px-12">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="font-heading text-3xl font-semibold">
                Start with the land you know
              </h2>
              <p className="mt-3 text-base leading-7 text-white/68">
                Create a landowner profile and add at least one property. An
                OARS administrator will review the account before access is
                granted.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => onNavigate('register')}
              className="h-12 shrink-0 bg-[var(--teal)] px-6 text-[var(--navy)] hover:bg-[var(--seafoam)]"
            >
              Create landowner account <ArrowRight />
            </Button>
          </div>
        </div>
      </section>
      <footer className="border-t px-5 py-8 text-center text-sm text-muted-foreground">
        OARS Mid-Atlantic Tool · Options for Adapting to Rising Seas
      </footer>
    </main>
  );
}

function LoginPage({
  onNavigate,
  onLogin,
}: {
  onNavigate: (view: PublicView) => void;
  onLogin: (user: DemoUser) => void;
}) {
  const [email, setEmail] = useState('landowner@oars.demo');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const submit = () => {
    const user = demoUsers.find(
      (item) => item.email === email.trim().toLowerCase(),
    );
    if (!user || password !== 'demo123') {
      setError('Use one of the demonstration accounts and password demo123.');
      return;
    }
    onLogin(user);
  };
  return (
    <main className="grid min-h-screen bg-[var(--navy)] lg:grid-cols-[.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="landing-tide absolute inset-0 opacity-35" />
        <button
          className="relative flex items-center gap-3 self-start text-left"
          onClick={() => onNavigate('landing')}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-white/95 p-1.5 shadow-sm">
            <OarsMark className="size-10" />
          </span>
          <span className="text-xl font-semibold">OARS</span>
        </button>
        <div className="relative max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--seafoam)]">
            Secure workspace
          </p>
          <h1 className="mt-4 font-heading text-5xl font-semibold leading-tight">
            Your properties, programs, and decisions in one place
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/68">
            Access depends on your approved account role.
          </p>
        </div>
        <p className="relative text-sm text-white/45">
          Demonstration access · No production data
        </p>
      </div>
      <section className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-lg">
          <button
            onClick={() => onNavigate('landing')}
            className="mb-10 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to OARS
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal-dark)]">
            Account access
          </p>
          <h2 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
            Sign in
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Approved landowners, agencies, and administrators can access their
            workspace.
          </p>
          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className="block" htmlFor="login-email">
              <span className="mb-2 block text-sm font-semibold">
                Email address
              </span>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 bg-white text-base"
              />
            </label>
            <label className="block" htmlFor="login-password">
              <span className="mb-2 block text-sm font-semibold">Password</span>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 bg-white text-base"
              />
            </label>
            {error && (
              <p
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="h-12 w-full text-base">
              Sign in <ArrowRight />
            </Button>
          </form>
          <div className="mt-8 border-t pt-6">
            <p className="text-sm font-semibold">Demonstration accounts</p>
            <div className="mt-3 grid gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.role}
                  onClick={() => {
                    setEmail(user.email);
                    setPassword('demo123');
                    setError('');
                  }}
                  className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm hover:border-[var(--teal-dark)]"
                >
                  <span>
                    <strong className="capitalize">{user.role}</strong>
                    <span className="ml-2 text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">demo123</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-7 text-center text-sm text-muted-foreground">
            Own coastal land?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="font-semibold text-[var(--teal-dark)] hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function RegistrationPage({
  onNavigate,
}: {
  onNavigate: (view: PublicView) => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [ownsLand, setOwnsLand] = useState(false);
  if (submitted)
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--mist)] px-5">
        <section className="max-w-xl rounded-[28px] border bg-white p-9 text-center shadow-lg">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--teal-soft)] text-[var(--teal-dark)]">
            <BadgeCheck className="size-8" />
          </span>
          <h1 className="mt-6 font-heading text-3xl font-semibold">
            Registration submitted
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            An OARS administrator must review the landowner and property
            information before the account can sign in.
          </p>
          <Button className="mt-7" onClick={() => onNavigate('login')}>
            Return to sign in
          </Button>
        </section>
      </main>
    );
  return (
    <main className="min-h-screen bg-[var(--mist)]">
      <div className="mx-auto max-w-4xl px-5 py-10 lg:py-14">
        <button
          onClick={() => onNavigate('landing')}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to OARS
        </button>
        <div className="rounded-[30px] border bg-white p-6 shadow-sm sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal-dark)]">
              Landowner registration
            </p>
            <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
              Create your OARS profile
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Self-registration is for property owners. At least one property is
              required, and an administrator must approve the account.
            </p>
          </div>
          <form
            className="mt-9 space-y-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (ownsLand) setSubmitted(true);
            }}
          >
            <fieldset>
              <legend className="mb-4 text-lg font-semibold">
                Profile information
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label htmlFor="register-name">
                  <span className="mb-2 block text-sm font-semibold">
                    Full name
                  </span>
                  <Input id="register-name" required className="h-11" />
                </label>
                <label htmlFor="register-email">
                  <span className="mb-2 block text-sm font-semibold">
                    Email address
                  </span>
                  <Input
                    id="register-email"
                    type="email"
                    required
                    className="h-11"
                  />
                </label>
                <label htmlFor="register-phone">
                  <span className="mb-2 block text-sm font-semibold">
                    Phone number
                  </span>
                  <Input id="register-phone" type="tel" className="h-11" />
                </label>
                <label htmlFor="register-password">
                  <span className="mb-2 block text-sm font-semibold">
                    Password
                  </span>
                  <Input
                    id="register-password"
                    type="password"
                    required
                    minLength={8}
                    className="h-11"
                  />
                </label>
              </div>
            </fieldset>
            <fieldset className="border-t pt-8">
              <legend className="mb-4 text-lg font-semibold">
                First property
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label htmlFor="property-name">
                  <span className="mb-2 block text-sm font-semibold">
                    Property name
                  </span>
                  <Input
                    id="property-name"
                    required
                    placeholder="North field"
                    className="h-11"
                  />
                </label>
                <label htmlFor="property-county">
                  <span className="mb-2 block text-sm font-semibold">
                    County
                  </span>
                  <Input
                    id="property-county"
                    required
                    placeholder="Somerset County"
                    className="h-11"
                  />
                </label>
                <label className="sm:col-span-2" htmlFor="property-address">
                  <span className="mb-2 block text-sm font-semibold">
                    Property address or general location
                  </span>
                  <Input id="property-address" required className="h-11" />
                </label>
                <label htmlFor="property-land-use">
                  <span className="mb-2 block text-sm font-semibold">
                    Land use
                  </span>
                  <select
                    id="property-land-use"
                    required
                    className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
                  >
                    <option value="farm">Farm</option>
                    <option value="forest">Forest or woodlot</option>
                    <option value="both">Farm and forest</option>
                  </select>
                </label>
                <label htmlFor="property-acres">
                  <span className="mb-2 block text-sm font-semibold">
                    Approximate acres
                  </span>
                  <Input
                    id="property-acres"
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-11"
                  />
                </label>
              </div>
            </fieldset>
            <div className="flex items-start gap-3 rounded-2xl border bg-[var(--mist)] p-4">
              <input
                id="ownership-confirmation"
                aria-labelledby="ownership-label"
                type="checkbox"
                checked={ownsLand}
                onChange={(event) => setOwnsLand(event.target.checked)}
                className="mt-1 size-4 accent-[var(--teal-dark)]"
              />
              <span>
                <strong id="ownership-label" className="block text-sm">
                  I confirm that I own or co-own this property.
                </strong>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  The administrator may request supporting information during
                  account review.
                </span>
              </span>
            </div>
            <div className="flex justify-end border-t pt-6">
              <Button
                type="submit"
                size="lg"
                disabled={!ownsLand}
                className="h-12 px-6"
              >
                Submit for approval <ArrowRight />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function PortalHeader({
  user,
  onLogout,
}: {
  user: DemoUser;
  onLogout: () => void;
}) {
  return (
    <header className="border-b bg-[var(--navy)] text-white">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-white/95 p-1 shadow-sm">
            <OarsMark className="size-9" />
          </span>
          <div>
            <p className="font-heading text-lg font-semibold">OARS Portal</p>
            <p className="text-xs capitalize text-white/60">
              {user.role} workspace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-white/55">
              {user.organization ?? user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <LogOut /> <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function LandownerPortal({
  user,
  onLogout,
}: {
  user: DemoUser;
  onLogout: () => void;
}) {
  const [section, setSection] = useState<'home' | 'property' | View>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(1);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [properties, setProperties] = useState<Property[]>([
    {
      id: 1,
      name: 'Marsh Edge Farm',
      location: 'Somerset County, MD',
      acres: '42.7',
      cadastralNumber: '18-047921',
      latitude: 38.105,
      longitude: -75.69,
      landType: 'farm',
      status: 'Assessment complete',
    },
    {
      id: 2,
      name: 'North Woodlot',
      location: 'Dorchester County, MD',
      acres: '18.2',
      cadastralNumber: '09-115804',
      latitude: 38.47,
      longitude: -76.03,
      landType: 'forest',
      status: 'Assessment draft',
    },
  ]);
  const emptyProperty: Omit<Property, 'id' | 'status'> = {
    name: '',
    location: '',
    acres: '',
    cadastralNumber: '',
    latitude: 38.08,
    longitude: -75.63,
    landType: 'farm',
  };
  const [propertyDraft, setPropertyDraft] = useState(emptyProperty);
  const selectedProperty = properties.find(
    (property) => property.id === selectedPropertyId,
  );
  const openPropertyForm = (property?: Property) => {
    setEditingPropertyId(property?.id ?? null);
    setPropertyDraft(
      property
        ? {
            name: property.name,
            location: property.location,
            acres: property.acres,
            cadastralNumber: property.cadastralNumber,
            latitude: property.latitude,
            longitude: property.longitude,
            landType: property.landType,
          }
        : emptyProperty,
    );
    setSection('property');
  };
  return (
    <main className="min-h-screen bg-background">
      <PortalHeader user={user} onLogout={onLogout} />
      {section === 'assessment' ? (
        <>
          <div className="border-b bg-white px-5 py-3">
            <Button variant="ghost" onClick={() => setSection('home')}>
              <ArrowLeft /> Property dashboard
            </Button>
          </div>
          <Assessment
            openExplore={() => setSection('explore')}
            property={selectedProperty}
          />
        </>
      ) : section === 'explore' ? (
        <>
          <div className="border-b bg-white px-5 py-3">
            <Button variant="ghost" onClick={() => setSection('home')}>
              <ArrowLeft /> Property dashboard
            </Button>
          </div>
          <ExploreCatalog />
        </>
      ) : section === 'gis' ? (
        <>
          <div className="border-b bg-white px-5 py-3">
            <Button variant="ghost" onClick={() => setSection('home')}>
              <ArrowLeft /> Property dashboard
            </Button>
          </div>
          <GisExplorer />
        </>
      ) : section === 'property' ? (
        <section className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
          <Button variant="ghost" onClick={() => setSection('home')}>
            <ArrowLeft /> Property dashboard
          </Button>
          <form
            className="mt-6 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (editingPropertyId) {
                setProperties((current) =>
                  current.map((property) =>
                    property.id === editingPropertyId
                      ? { ...property, ...propertyDraft }
                      : property,
                  ),
                );
              } else {
                const id = Date.now();
                setProperties((current) => [
                  ...current,
                  { id, ...propertyDraft, status: 'Not assessed' },
                ]);
                setSelectedPropertyId(id);
              }
              setSection('home');
            }}
          >
            <p className="text-sm font-semibold text-[var(--teal-dark)]">
              Property profile
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold">
              {editingPropertyId ? 'Edit property' : 'Add a property'}
            </h1>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {[
                ['name', 'Property name', 'text'],
                ['location', 'Address or location', 'text'],
                ['acres', 'Area in acres', 'number'],
                ['cadastralNumber', 'Registry or cadastral number', 'text'],
                ['latitude', 'Latitude', 'number'],
                ['longitude', 'Longitude', 'number'],
              ].map(([field, label, type]) => (
                <label key={field}>
                  <span className="mb-2 block text-sm font-semibold">{label}</span>
                  <Input
                    required
                    type={type}
                    step={type === 'number' ? 'any' : undefined}
                    value={String(propertyDraft[field as keyof typeof propertyDraft])}
                    onChange={(event) =>
                      setPropertyDraft((current) => ({
                        ...current,
                        [field]:
                          field === 'latitude' || field === 'longitude'
                            ? Number(event.target.value)
                            : event.target.value,
                      }))
                    }
                    className="h-11"
                  />
                </label>
              ))}
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Land use</span>
                <select
                  value={propertyDraft.landType}
                  onChange={(event) =>
                    setPropertyDraft((current) => ({
                      ...current,
                      landType: event.target.value as LandType,
                    }))
                  }
                  className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
                >
                  <option value="farm">Farm</option>
                  <option value="forest">Forest</option>
                  <option value="both">Mixed farm and forest</option>
                </select>
              </label>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              The assessment map will open at the latitude and longitude saved here.
            </p>
            <div className="mt-7 flex justify-end gap-2 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => setSection('home')}>
                Cancel
              </Button>
              <Button type="submit">Save property</Button>
            </div>
          </form>
        </section>
      ) : (
        <section className="mx-auto max-w-[1300px] px-5 py-10 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[var(--teal-dark)]">
                Landowner dashboard
              </p>
              <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
                Welcome back, {user.name.split(' ')[0]}
              </h1>
              <p className="mt-3 text-muted-foreground">
                Manage properties, assessments, reports, and program
                applications.
              </p>
            </div>
            <Button size="lg" onClick={() => openPropertyForm()}>
              <Plus /> Add property
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => {
                setSelectedPropertyId(properties[0]?.id ?? null);
                setSection('assessment');
              }}
              className="rounded-2xl border bg-[var(--navy)] p-6 text-left text-white shadow-sm"
            >
              <Compass className="size-6 text-[var(--seafoam)]" />
              <p className="mt-6 text-lg font-semibold">Start an assessment</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Evaluate one of your properties.
              </p>
            </button>
            <button
              onClick={() => setSection('explore')}
              className="rounded-2xl border bg-white p-6 text-left shadow-sm"
            >
              <Database className="size-6 text-[var(--teal-dark)]" />
              <p className="mt-6 text-lg font-semibold">Explore programs</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review assistance published by agencies.
              </p>
            </button>
            <button
              onClick={() => setSection('gis')}
              className="rounded-2xl border bg-white p-6 text-left shadow-sm"
            >
              <Map className="size-6 text-[var(--teal-dark)]" />
              <p className="mt-6 text-lg font-semibold">Open property map</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Draw boundaries and add observations.
              </p>
            </button>
          </div>
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">
                Your properties
              </h2>
              <span className="text-sm text-muted-foreground">
                {properties.length} properties
              </span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {properties.map((property) => (
                <article
                  key={property.name}
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">{property.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {property.location} · {property.acres} acres
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Registry/cadastre {property.cadastralNumber} · {property.latitude.toFixed(5)}, {property.longitude.toFixed(5)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold text-[var(--teal-dark)]">
                      {property.status}
                    </span>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button onClick={() => {
                      setSelectedPropertyId(property.id);
                      setSection('assessment');
                    }}>
                      Open assessment
                    </Button>
                    <Button variant="outline" onClick={() => openPropertyForm(property)}>
                      <Pencil /> Edit
                    </Button>
                    <Button variant="outline">
                      <Download /> Saved report
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="outline" />}>
                        <Trash2 /> Delete
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {property.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the property from this profile and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                              setProperties((current) =>
                                current.filter((item) => item.id !== property.id),
                              );
                              if (selectedPropertyId === property.id)
                                setSelectedPropertyId(null);
                            }}
                          >
                            Delete property
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function AgencyPortal({
  user,
  onLogout,
}: {
  user: DemoUser;
  onLogout: () => void;
}) {
  const [items, setItems] = useState([
    {
      id: 1,
      name: 'Coastal Resilience Assistance',
      method: 'OARS form',
      status: 'Published',
      description: 'Technical and financial support for coastal property resilience projects.',
      applicationUrl: '',
    },
    {
      id: 2,
      name: 'Wetland Planning Consultation',
      method: 'External link',
      status: 'Draft',
      description: 'Planning consultation for wetland restoration and transition.',
      applicationUrl: 'https://example.org/apply',
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [programDraft, setProgramDraft] = useState({
    name: '',
    method: 'OARS form',
    status: 'Draft',
    description: '',
    applicationUrl: '',
  });
  const openProgramForm = (item?: (typeof items)[number]) => {
    setEditingProgramId(item?.id ?? null);
    setProgramDraft(
      item
        ? {
            name: item.name,
            method: item.method,
            status: item.status,
            description: item.description,
            applicationUrl: item.applicationUrl,
          }
        : {
            name: '',
            method: 'OARS form',
            status: 'Draft',
            description: '',
            applicationUrl: '',
          },
    );
    setShowForm(true);
  };
  return (
    <main className="min-h-screen bg-background">
      <PortalHeader user={user} onLogout={onLogout} />
      <section className="mx-auto max-w-[1250px] px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[var(--teal-dark)]">
              Agency dashboard
            </p>
            <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
              {user.organization}
            </h1>
            <p className="mt-3 text-muted-foreground">
              Manage agency information and assistance programs available to
              landowners.
            </p>
          </div>
          <Button size="lg" onClick={() => openProgramForm()}>
            <Plus /> New program
          </Button>
        </div>
        {showForm && (
          <form
            className="mt-8 rounded-2xl border bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              setItems((current) =>
                editingProgramId
                  ? current.map((item) =>
                      item.id === editingProgramId
                        ? { ...item, ...programDraft }
                        : item,
                    )
                  : [{ id: Date.now(), ...programDraft }, ...current],
              );
              setShowForm(false);
            }}
          >
            <h2 className="text-xl font-semibold">
              {editingProgramId ? 'Edit assistance program' : 'Create assistance program'}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label htmlFor="program-name">
                <span className="mb-2 block text-sm font-semibold">
                  Program name
                </span>
                <Input
                  id="program-name"
                  required
                  value={programDraft.name}
                  onChange={(event) =>
                    setProgramDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="h-11"
                />
              </label>
              <label htmlFor="application-method">
                <span className="mb-2 block text-sm font-semibold">
                  Application method
                </span>
                <select
                  id="application-method"
                  value={programDraft.method}
                  onChange={(event) =>
                    setProgramDraft((current) => ({
                      ...current,
                      method: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
                >
                  <option>OARS form</option>
                  <option>External link</option>
                </select>
              </label>
              <label className="sm:col-span-2" htmlFor="program-description">
                <span className="mb-2 block text-sm font-semibold">
                  Description
                </span>
                <textarea
                  id="program-description"
                  required
                  value={programDraft.description}
                  onChange={(event) =>
                    setProgramDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-24 w-full rounded-lg border p-3 text-sm"
                />
              </label>
              {programDraft.method === 'External link' && (
                <label className="sm:col-span-2" htmlFor="program-url">
                  <span className="mb-2 block text-sm font-semibold">Application link</span>
                  <Input
                    id="program-url"
                    type="url"
                    required
                    value={programDraft.applicationUrl}
                    onChange={(event) =>
                      setProgramDraft((current) => ({
                        ...current,
                        applicationUrl: event.target.value,
                      }))
                    }
                    placeholder="https://agency.gov/apply"
                    className="h-11"
                  />
                </label>
              )}
              <label htmlFor="program-status">
                <span className="mb-2 block text-sm font-semibold">Status</span>
                <select
                  id="program-status"
                  value={programDraft.status}
                  onChange={(event) =>
                    setProgramDraft((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border bg-white px-3 text-sm"
                >
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save program</Button>
            </div>
          </form>
        )}
        <div className="mt-9 grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-2xl border bg-white p-6">
            <Building2 className="size-7 text-[var(--teal-dark)]" />
            <h2 className="mt-5 text-lg font-semibold">Agency profile</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Director</dt>
                <dd className="font-medium">Morgan Diaz</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="font-medium">agency@oars.demo</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Service area</dt>
                <dd className="font-medium">Maryland Eastern Shore</dd>
              </div>
            </dl>
            <Button variant="outline" className="mt-6 w-full">
              Edit profile
            </Button>
          </aside>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-semibold">
                Assistance programs
              </h2>
              <span className="text-sm text-muted-foreground">
                {items.length} programs
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--navy)] text-white">
                  <tr>
                    <th className="p-4">Program</th>
                    <th className="hidden p-4 sm:table-cell">Application</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-4 font-semibold">{item.name}</td>
                      <td className="hidden p-4 text-muted-foreground sm:table-cell">
                        {item.method}
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-[var(--teal-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--teal-dark)]">
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProgramForm(item)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AdminPortal({
  user,
  onLogout,
}: {
  user: DemoUser;
  onLogout: () => void;
}) {
  const [pending, setPending] = useState([
    {
      name: 'Taylor Morgan',
      email: 'taylor@example.test',
      property: 'Bay View Farm · Somerset County',
    },
    {
      name: 'Riley Johnson',
      email: 'riley@example.test',
      property: 'Pine Creek Woodlot · Dorchester County',
    },
  ]);
  const [notice, setNotice] = useState('');
  const decide = (email: string, decision: 'approved' | 'declined') => {
    setPending((current) => current.filter((item) => item.email !== email));
    setNotice(`Account ${decision}.`);
  };
  return (
    <main className="min-h-screen bg-background">
      <PortalHeader user={user} onLogout={onLogout} />
      <section className="mx-auto max-w-[1250px] px-5 py-10 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-[var(--teal-dark)]">
            Administrator dashboard
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
            Users and approvals
          </h1>
          <p className="mt-3 text-muted-foreground">
            Review landowner registrations and manage access to OARS.
          </p>
        </div>
        {notice && (
          <output className="mt-6 block rounded-xl bg-[var(--teal-soft)] px-4 py-3 text-sm font-medium text-[var(--teal-dark)]">
            {notice}
          </output>
        )}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ['24', 'Active landowners'],
            ['6', 'Agency accounts'],
            [String(pending.length), 'Pending approvals'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border bg-white p-5">
              <p className="text-3xl font-bold text-[var(--navy)]">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold">
              Pending landowner accounts
            </h2>
            <span className="rounded-full bg-[var(--amber)]/20 px-3 py-1 text-xs font-semibold">
              Ownership review required
            </span>
          </div>
          <div className="mt-4 grid gap-4">
            {pending.map((account) => (
              <article
                key={account.email}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 place-items-center rounded-full bg-[var(--mist)] text-[var(--teal-dark)]">
                      <UserRound />
                    </span>
                    <div>
                      <h3 className="font-semibold">{account.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {account.email}
                      </p>
                      <p className="mt-2 text-sm">
                        <strong>First property:</strong> {account.property}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => decide(account.email, 'declined')}
                    >
                      Decline
                    </Button>
                    <Button onClick={() => decide(account.email, 'approved')}>
                      <BadgeCheck /> Approve account
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {pending.length === 0 && (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <BadgeCheck className="mx-auto size-8 text-[var(--teal-dark)]" />
                <p className="mt-3 font-semibold">No registrations waiting</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-10">
          <h2 className="font-heading text-2xl font-semibold">
            Account policy
          </h2>
          <div className="mt-4 rounded-2xl border bg-white p-6 text-sm leading-7 text-muted-foreground">
            <p>
              <strong className="text-foreground">Landowners:</strong> may
              self-register only after adding a property and confirming
              ownership. Access begins after administrator approval.
            </p>
            <p className="mt-2">
              <strong className="text-foreground">
                Agencies and administrators:
              </strong>{' '}
              receive role-specific accounts created or approved by an
              administrator.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [publicView, setPublicView] = useState<PublicView>('landing');
  const [user, setUser] = useState<DemoUser | null>(null);
  if (!user) {
    if (publicView === 'login')
      return <LoginPage onNavigate={setPublicView} onLogin={setUser} />;
    if (publicView === 'register')
      return <RegistrationPage onNavigate={setPublicView} />;
    return <LandingPage onNavigate={setPublicView} />;
  }
  const logout = () => {
    setUser(null);
    setPublicView('landing');
  };
  if (user.role === 'agency')
    return <AgencyPortal user={user} onLogout={logout} />;
  if (user.role === 'admin')
    return <AdminPortal user={user} onLogout={logout} />;
  return <LandownerPortal user={user} onLogout={logout} />;
}
