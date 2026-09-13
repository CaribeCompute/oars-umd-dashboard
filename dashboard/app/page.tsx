'use client';
/* oxlint-disable eslint/no-unused-vars, jsx-a11y/label-has-associated-control, jsx-a11y/prefer-tag-over-role, react/react-compiler */

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ResultsExport } from '@/components/results-export';
import { SwiPhotoGuide } from '@/components/swi-photo-guide';
import { ExploreCatalog } from '@/components/explore-catalog';
import { programs } from '@/lib/programs';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleAlert,
  ClipboardCopy,
  Compass,
  Database,
  Download,
  ExternalLink,
  Filter,
  FileText,
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
import { PropertyAddressFields } from '@/components/property-address-fields';
import { Faqs } from '@/components/faqs';
import { PersonalGis } from '@/components/personal-gis';
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
import { createBrowserSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import type { AccountProfile, AccountRole } from '@/lib/account-types';

type View = 'assessment' | 'explore' | 'gis';
type LandType = 'farm' | 'forest' | 'both';
type Role = AccountRole;
type PublicView = 'landing' | 'login' | 'register';

type Property = {
  id: string;
  county: string;
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
  userId?: string;
  name: string;
  email: string;
  role: Role;
  status?: 'pending' | 'active' | 'declined' | 'inactive';
  mustChangePassword?: boolean;
  organization?: string;
  farmerId?: string;
};

const demoUsers: DemoUser[] = [];


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

  const [assessmentStatus, setAssessmentStatus] = useState('');
  const [assessmentLoaded, setAssessmentLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const db = createBrowserSupabaseClient();
    if (!db || !property?.id) { setAssessmentLoaded(true); return; }
    void db.from('property_assessments').select('data').eq('property_id', property.id).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setAssessmentStatus('Assessment storage unavailable. Apply the GIS migration, then reload.'); return; }
      const d = data?.data;
      if (d && typeof d === 'object') {
        if (['farm','forest','both'].includes(d.landType)) setLandType(d.landType);
        if (typeof d.address === 'string') setAddress(d.address);
        if (typeof d.role === 'string') setRole(d.role);
        if (d.answers && ['plants','soil','water'].every(k => Number.isFinite(d.answers[k]) && d.answers[k] >= 0 && d.answers[k] <= 3)) setAnswers(d.answers);
        if (Array.isArray(d.goals) && d.goals.every((v: unknown) => typeof v === 'string')) setGoals(d.goals);
      }
      setAssessmentLoaded(true);
    });
  return () => { cancelled = true; };
  }, [property?.id]);
  const saveAssessment = async () => {
    const db = createBrowserSupabaseClient(); if (!db || !property?.id) return;
    setAssessmentStatus('Saving assessment…');
    const { error } = await db.from('property_assessments').upsert({ property_id: property.id, data: { landType, address, role, answers, goals }, updated_at: new Date().toISOString() });
    setAssessmentStatus(error ? 'Assessment was not saved. Please retry.' : 'Assessment saved.');
  };
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
          (program) => program.shortlisted && (landType === 'both' || program.land === landType || program.land === 'both'),
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

  if (property && !assessmentLoaded) return <p className="p-5" role="status">{assessmentStatus || 'Loading saved assessment…'}</p>;
  return (
    <>
      {property && <div className="flex items-center gap-4 border-b p-4"><Button disabled={!assessmentLoaded} onClick={() => void saveAssessment()}>Save assessment</Button><p role="status">{assessmentStatus || 'Save assessment to keep your answers and goals.'}</p></div>}
      <section data-tour="assessment" className="border-b bg-[var(--navy)] text-white print:hidden">
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

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[290px_minmax(0,1fr)] print:block">
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
              'Your ranked goals are saved for planning conversations.'}
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
              {property ? <div className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Property map and observations</h2><p className="mt-3 text-sm">Draw and save boundaries, flooding, and salt patches in your personalized GIS explorer.</p><Link className="mt-4 inline-block underline" href={`/gis?propertyId=${property.id}`} target="_blank">Open saved property GIS</Link></div> : (
              <FunctionalMap
                initialAddress={address}
                onAddressChange={setAddress}
                compact
              />              )}

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
              <SwiPhotoGuide landType={landType} />
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
                  These priorities are saved for planning conversations. They do not determine
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
                    The score remains a demonstration. Catalog examples below use land type and the OARS shortlist; SWI stage and goals do not yet rank them.
                  </p>
                </div>
                <ResultsExport propertyId={property?.id} center={property ? [property.latitude,property.longitude] : undefined} report={{ address, landType, relationship: role, stage: stage.label, score,
                  goals: goals.map(id => goalOptions.find(g => g.id === id)?.label ?? id),
                  answers: indicators.map(indicator => ({ label: indicator.label, value: indicator.options[answers[indicator.id]] ?? 'Not supplied' })),
                  programs: recommendations }} />
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
                    OARS shortlist examples
                  </h3>
                  <div className="mt-4 grid gap-4">
                    {recommendations.map((program, index) => (
                      <article
                        key={program.id}
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
                              <Link className="underline" href={`/programs/${program.id}`}>{program.name}</Link>
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {program.description}
                            </p>
                            <div className="mt-4 rounded-xl bg-[var(--mist)] p-3 text-sm leading-6">
                              <strong>Why it appears:</strong> {program.reason}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {[...new Set(program.tags.filter(Boolean))].map((tag) => (
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
          <Link href="/faqs" className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">FAQs</Link>
          <Link href="/programs" className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">Programs</Link>
          <Link href="/gis" className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">GIS explorer</Link>
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
              Landowner, Agency, and Extension Officer accounts do not require approval. Only administrator access requires authorization by an existing administrator.
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
                <Image
                  src="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-75.76,38.14,-75.73,38.16&bboxSR=4326&imageSR=3857&size=900,600&format=jpg&f=image"
                  alt="Satellite imagery of farmland in Somerset County, Maryland"
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 540px, 100vw"
                  className="object-cover"
                />
                <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noreferrer" className="absolute bottom-0 right-0 z-10 bg-black/75 px-2 py-1 text-[10px] text-white">Imagery © Esri and imagery providers · Illustrative boundary</a>
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
          <div className="grid gap-5 md:grid-cols-2">
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
                icon: BriefcaseBusiness,
                title: 'Extension Officers',
                copy: 'Create and support assigned landowner accounts, guide assessments, match programs, record consent, and track applications.',
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
                Choose a Landowner, Agency, or Extension Officer profile.
                Only administrator accounts require approval; public accounts can sign in after email verification.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => onNavigate('register')}
              className="h-12 shrink-0 bg-[var(--teal)] px-6 text-[var(--navy)] hover:bg-[var(--seafoam)]"
            >
              Create an account <ArrowRight />
            </Button>
          </div>
        </div>
      </section>
      <Faqs />
      <footer className="border-t px-5 py-8 text-center text-sm text-muted-foreground">
        OARS Mid-Atlantic Tool · Options for Adapting to Rising Seas
      </footer>
    </main>
  );
}

function LegacyLoginPage({
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

function LegacyRegistrationPage({
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
            Verify your email, then sign in. Landowner accounts do not
            require administrator approval.
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
                Create account <ArrowRight />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function LoginPage({
  onNavigate,
  onLogin,
  initialMessage = '',
}: {
  onNavigate: (view: PublicView) => void;
  onLogin: (user: DemoUser) => void;
  initialMessage?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState(false);

  const signInWithGoogle = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  };

  const submit = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured. Add the values from .env.example to .env.local.');
      return;
    }
    setBusy(true);
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Unable to sign in.');
      setBusy(false);
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single<AccountProfile>();
    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError('Your OARS profile could not be loaded.');
    } else if (profile.status !== 'active') {
      await supabase.auth.signOut();
      setError(
        profile.status === 'pending'
          ? 'Your email may be verified, but an administrator must approve your account before you can sign in.'
          : 'This account is not active. Contact an OARS administrator.',
      );
    } else {
      onLogin({
        userId: profile.user_id,
        name: profile.display_name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        mustChangePassword: profile.must_change_password,
        organization: profile.organization ?? undefined,
        farmerId: profile.farmer_id ?? undefined,
      });
    }
    setBusy(false);
  };

  const resetPassword = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !email) {
      setError('Enter your email address first.');
      return;
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=/?update-password=1`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetError) setError(resetError.message);
    else setMessage('Check your email for a secure password reset link.');
  };

  return (
    <main className="grid min-h-screen bg-[var(--navy)] lg:grid-cols-[.9fr_1.1fr]">
      <div className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="landing-tide absolute inset-0 opacity-35" />
        <button className="relative flex items-center gap-3 self-start" onClick={() => onNavigate('landing')}>
          <span className="grid size-12 place-items-center rounded-2xl bg-white/95 p-1.5"><OarsMark className="size-10" /></span>
          <span className="text-xl font-semibold">OARS</span>
        </button>
        <div className="relative max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--seafoam)]">Secure workspace</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold leading-tight">One trusted record for every coastal land decision</h1>
          <p className="mt-5 text-lg leading-8 text-white/68">Access is based on your approved account and assigned responsibilities.</p>
        </div>
        <p className="relative text-sm text-white/45">Protected by Supabase Auth and role-based access</p>
      </div>
      <section className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-lg">
          <button onClick={() => onNavigate('landing')} className="mb-10 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to OARS</button>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal-dark)]">Account access</p>
          <h2 className="mt-2 font-heading text-4xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">Approved landowners, agency staff, Extension Officers, and administrators can access their workspace.</p>
          {!isSupabaseConfigured && <p role="status" className="mt-5 rounded-xl border border-[var(--amber)] bg-[var(--amber)]/10 px-4 py-3 text-sm">Configuration required: copy <strong>.env.example</strong> to <strong>.env.local</strong> and add your Supabase project values.</p>}
          <Button type="button" size="lg" variant="outline" disabled={busy || !isSupabaseConfigured} onClick={() => void signInWithGoogle()} className="mt-8 h-12 w-full bg-white text-base"><span aria-hidden="true" className="grid size-6 place-items-center rounded-full border font-bold text-[#4285f4]">G</span> Continue with Google</Button>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>or use your password</span><span className="h-px flex-1 bg-border" /></div>
          <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <label className="block" htmlFor="login-email"><span className="mb-2 block text-sm font-semibold">Email address</span><Input id="login-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 bg-white text-base" /></label>
            <label className="block" htmlFor="login-password"><span className="mb-2 block text-sm font-semibold">Password</span><Input id="login-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 bg-white text-base" /></label>
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
            {message && <p className="rounded-xl bg-[var(--teal-soft)] px-4 py-3 text-sm text-[var(--teal-dark)]" role="status">{message}</p>}
            <Button type="submit" size="lg" disabled={busy || !isSupabaseConfigured} className="h-12 w-full text-base">{busy ? 'Signing in…' : 'Sign in'} <ArrowRight /></Button>
          </form>
          <button onClick={() => void resetPassword()} className="mt-4 text-sm font-semibold text-[var(--teal-dark)] hover:underline">Forgot your password?</button>
          <p className="mt-7 text-center text-sm text-muted-foreground">Need an OARS account? <button onClick={() => onNavigate('register')} className="font-semibold text-[var(--teal-dark)] hover:underline">Create an account</button></p>
        </div>
      </section>
    </main>
  );
}

function RegistrationPage({ onNavigate }: { onNavigate: (view: PublicView) => void }) {
  const [accountType, setAccountType] = useState<Exclude<Role, 'admin'>>('landowner');
  const [submitted, setSubmitted] = useState(false);
  const [ownsLand, setOwnsLand] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const validateRegistrationAddress = async (data: FormData) => {
    if (accountType !== 'landowner') return null;
    const response = await fetch('/api/validate-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(['street', 'unit', 'city', 'state', 'zip'].map(key => [key, textFromForm(data, key)]))),
    });
    const result = await response.json() as { address?: string; latitude?: number; longitude?: number; error?: string };
    if (!response.ok || !result.address || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
      throw new Error(result.error ?? 'The property address could not be verified.');
    }
    data.set('address', result.address);
    return { address: result.address, latitude: result.latitude, longitude: result.longitude };
  };

  const registerWithGoogle = async (form: HTMLFormElement) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
    const passwordInput = form.elements.namedItem('password') as HTMLInputElement | null;
    const confirmPasswordInput = form.elements.namedItem('confirmPassword') as HTMLInputElement | null;
    if (emailInput) emailInput.required = false;
    if (passwordInput) passwordInput.required = false;
    if (confirmPasswordInput) confirmPasswordInput.required = false;
    const valid = form.reportValidity();
    if (emailInput) emailInput.required = true;
    if (passwordInput) passwordInput.required = true;
    if (confirmPasswordInput) confirmPasswordInput.required = true;
    if (!valid || (accountType === 'landowner' && !ownsLand)) {
      setError(accountType === 'landowner' && !ownsLand ? 'Confirm property ownership before continuing with Google.' : 'Complete the required profile and account fields first.');
      return;
    }
    const data = new FormData(form);
    setBusy(true);
    setError('');
    let verifiedAddress: Awaited<ReturnType<typeof validateRegistrationAddress>>;
    try {
      verifiedAddress = await validateRegistrationAddress(data);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'The property address could not be verified.');
      setBusy(false);
      return;
    }
    const registration = {
      requestedRole: accountType,
      displayName: textFromForm(data, 'displayName'),
      phone: textFromForm(data, 'phone'),
      farmerId: textFromForm(data, 'farmerId'),
      organization: textFromForm(data, 'organization'),
      jobTitle: textFromForm(data, 'jobTitle'),
      serviceArea: textFromForm(data, 'serviceArea'),
      propertyName: textFromForm(data, 'propertyName'),
      county: textFromForm(data, 'county'),
      address: textFromForm(data, 'address'),
      latitude: verifiedAddress?.latitude ?? null,
      longitude: verifiedAddress?.longitude ?? null,
      landType: textFromForm(data, 'landType'),
      acres: textFromForm(data, 'acres'),
      ownershipConfirmed: ownsLand,
    };
    document.cookie = `oars_oauth_registration=${encodeURIComponent(JSON.stringify(registration))}; Path=/; Max-Age=600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (oauthError) {
      document.cookie = 'oars_oauth_registration=; Path=/; Max-Age=0; SameSite=Lax';
      setError(oauthError.message);
      setBusy(false);
    }
  };

  const submit = async (form: HTMLFormElement) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured. Add the values from .env.example to .env.local.');
      return;
    }
    const data = new FormData(form);
    setBusy(true);
    setError('');
    if (textFromForm(data, 'password') !== textFromForm(data, 'confirmPassword')) {
      setError('The passwords do not match.');
      setBusy(false);
      return;
    }
    let verifiedAddress: Awaited<ReturnType<typeof validateRegistrationAddress>>;
    try {
      verifiedAddress = await validateRegistrationAddress(data);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'The property address could not be verified.');
      setBusy(false);
      return;
    }
    const { error: signupError } = await supabase.auth.signUp({
      email: textFromForm(data, 'email'),
      password: textFromForm(data, 'password'),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          requested_role: accountType,
          display_name: textFromForm(data, 'displayName'),
          phone: textFromForm(data, 'phone'),
          farmer_id: textFromForm(data, 'farmerId'),
          organization: textFromForm(data, 'organization'),
          job_title: textFromForm(data, 'jobTitle'),
          service_area: textFromForm(data, 'serviceArea'),
          property_name: textFromForm(data, 'propertyName'),
          property_county: textFromForm(data, 'county'),
          property_address: textFromForm(data, 'address'),
          property_latitude: verifiedAddress?.latitude ?? null,
          property_longitude: verifiedAddress?.longitude ?? null,
          property_land_type: textFromForm(data, 'landType'),
          property_acres: textFromForm(data, 'acres'),
        },
      },
    });
    if (signupError) setError(signupError.message);
    else setSubmitted(true);
    setBusy(false);
  };

  if (submitted) return (
    <main className="grid min-h-screen place-items-center bg-[var(--mist)] px-5">
      <section className="max-w-xl rounded-[28px] border bg-white p-9 text-center shadow-lg">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--teal-soft)] text-[var(--teal-dark)]"><BadgeCheck className="size-8" /></span>
        <h1 className="mt-6 font-heading text-3xl font-semibold">Registration submitted</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">Verify your email, then sign in. Your account does not require administrator approval.</p>
        <Button className="mt-7" onClick={() => onNavigate('login')}>Return to sign in</Button>
      </section>
    </main>
  );

  const organizationAccount = accountType === 'agency' || accountType === 'extension_officer';
  return (
    <main className="min-h-screen bg-[var(--mist)]">
      <div className="mx-auto max-w-4xl px-5 py-10 lg:py-14">
        <button onClick={() => onNavigate('landing')} className="mb-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to OARS</button>
        <div className="rounded-[30px] border bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--teal-dark)]">Account registration</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">Create your OARS profile</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Landowner, Agency, and Extension Officer accounts can sign in after email verification. Only administrator accounts require approval through an existing administrator’s invitation.</p>
          <form className="mt-9 space-y-8" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
            <fieldset><legend className="mb-4 text-lg font-semibold">Profile information</legend><div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Full name</span><Input name="displayName" required className="h-11" /></label>
              <label><span className="mb-2 block text-sm font-semibold">Email address</span><Input name="email" type="email" required className="h-11" /></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Phone number</span><Input name="phone" type="tel" className="h-11" /></label>
              <label><span className="mb-2 block text-sm font-semibold">Password</span><Input name="password" type="password" required minLength={10} autoComplete="new-password" className="h-11" /></label>
              <label><span className="mb-2 block text-sm font-semibold">Confirm password</span><Input name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" className="h-11" /></label>
            </div></fieldset>
            <fieldset className="border-t pt-8"><legend className="mb-4 text-lg font-semibold">Account type</legend><label htmlFor="account-type" className="block max-w-md"><span className="mb-2 block text-sm font-semibold">I am registering as</span><select id="account-type" value={accountType} onChange={(event) => { setAccountType(event.target.value as Exclude<Role, 'admin'>); setOwnsLand(false); }} className="h-12 w-full rounded-lg border bg-white px-3 text-base"><option value="landowner">Landowner</option><option value="agency">Agency</option><option value="extension_officer">Extension Officer</option></select></label></fieldset>
            {organizationAccount ? <fieldset className="border-t pt-8"><legend className="mb-4 text-lg font-semibold">Professional information</legend><div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Organization</span><Input name="organization" required className="h-11" /></label>
              <label><span className="mb-2 block text-sm font-semibold">Job title</span><Input name="jobTitle" required className="h-11" /></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">Service area</span><Input name="serviceArea" required placeholder="Counties or region served" className="h-11" /></label>
            </div></fieldset> : <><fieldset className="border-t pt-8"><legend className="mb-4 text-lg font-semibold">First property</legend><div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Farmer ID</span><Input name="farmerId" required maxLength={80} className="h-11" /></label>
              <span className="hidden sm:block" />
              <label><span className="mb-2 block text-sm font-semibold">Property name</span><Input name="propertyName" required className="h-11" /></label>
              <label><span className="mb-2 block text-sm font-semibold">County</span><Input name="county" required className="h-11" /></label>
              <PropertyAddressFields />
              <label><span className="mb-2 block text-sm font-semibold">Land use</span><select name="landType" className="h-11 w-full rounded-lg border bg-white px-3 text-sm"><option value="farm">Farm</option><option value="forest">Forest or woodlot</option><option value="both">Farm and forest</option></select></label>
              <label><span className="mb-2 block text-sm font-semibold">Approximate acres</span><Input name="acres" type="number" min="0" step="0.01" className="h-11" /></label>
            </div></fieldset><label className="flex items-start gap-3 rounded-2xl border bg-[var(--mist)] p-4"><input type="checkbox" checked={ownsLand} onChange={(event) => setOwnsLand(event.target.checked)} className="mt-1 size-4 accent-[var(--teal-dark)]" /><span><strong className="block text-sm">I confirm that I own or co-own this property.</strong><span className="mt-1 block text-sm text-muted-foreground">Keep your property information accurate and up to date.</span></span></label></>}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="border-t pt-6"><div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Button type="button" size="lg" variant="outline" disabled={busy || !isSupabaseConfigured} onClick={(event) => void registerWithGoogle(event.currentTarget.form!)} className="h-12 bg-white px-6"><span aria-hidden="true" className="grid size-6 place-items-center rounded-full border font-bold text-[#4285f4]">G</span> Create with Google</Button><Button type="submit" size="lg" disabled={busy || !isSupabaseConfigured || (accountType === 'landowner' && !ownsLand)} className="h-12 px-6">{busy ? 'Continuing…' : 'Submit with email'} <ArrowRight /></Button></div><p className="mt-3 text-right text-sm text-muted-foreground">Google sign-up uses your Gmail address and does not require a separate OARS password.</p></div>
          </form>
        </div>
      </div>
    </main>
  );
}

function textFromForm(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function PasswordChange({ user, onComplete, onLogout }: { user: DemoUser; onComplete: () => void; onLogout: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const submit = async () => {
    if (password.length < 10 || password !== confirm) { setError('Use at least 10 characters and make both passwords match.'); return; }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); return; }
    const response = await fetch('/api/account-management', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password_changed' }) });
    if (!response.ok) { setError('The password changed, but the profile could not be updated. Sign in again.'); return; }
    onComplete();
  };
  return <main className="grid min-h-screen place-items-center bg-[var(--mist)] px-5"><section className="w-full max-w-lg rounded-[28px] border bg-white p-8 shadow-lg"><KeyRound className="size-10 text-[var(--teal-dark)]" /><h1 className="mt-5 font-heading text-3xl font-semibold">Create your private password</h1><p className="mt-3 text-muted-foreground">{user.name}, your temporary password can only be used for this first sign-in.</p><div className="mt-7 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">New password</span><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={10} /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Confirm password</span><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<Button className="w-full" onClick={() => void submit()}>Save password</Button><Button variant="outline" className="w-full" onClick={onLogout}>Sign out</Button></div></section></main>;
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
            <Link href="/faqs" className="text-sm underline">FAQs</Link>
            <Link href="/programs" className="text-sm underline">Programs</Link>
            <Link href="/gis" className="text-sm underline">GIS explorer</Link>
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
            {user.role === 'landowner' && user.farmerId && <p className="text-xs text-white/55">Farmer ID: {user.farmerId}</p>}
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
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const db = createBrowserSupabaseClient();
    if (!db || !user.userId) { setLoadingProperties(false); return; }
    void db.from('properties').select('*').eq('owner_id', user.userId).order('created_at').then(({ data, error }) => {
      if (cancelled) return;
      if (error) setLoadError('Could not load saved properties. Please refresh and try again.');
      else { const rows = (data || []).map(p => ({ id: p.id, name: p.name, county: p.county, location: p.address, acres: String(p.approximate_acres ?? ''), cadastralNumber: p.cadastral_number || '', latitude: p.latitude ?? 38.08, longitude: p.longitude ?? -75.63, landType: p.land_type as LandType, status: 'Not assessed' })); setProperties(rows); setSelectedPropertyId(rows[0]?.id ?? null); }
      setLoadingProperties(false);
    });
    return () => { cancelled = true; };
  }, [user.userId]);
  const emptyProperty: Omit<Property, 'id' | 'status'> = {
    county: '',
    name: '',
    location: '',
    acres: '',
    cadastralNumber: '',
    latitude: 38.08,
    longitude: -75.63,
    landType: 'farm',
  };
  const [propertyDraft, setPropertyDraft] = useState(emptyProperty);
  const [propertyValidationError, setPropertyValidationError] = useState('');
  const [savingProperty, setSavingProperty] = useState(false);
  const selectedProperty = properties.find(
    (property) => property.id === selectedPropertyId,
  );
  const openPropertyForm = (property?: Property) => {
    setEditingPropertyId(property?.id ?? null);
    setPropertyDraft(
      property
        ? {
            name: property.name,
            county: property.county,
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
      {loadingProperties && <p className="p-4" role="status">Loading saved properties…</p>}
      {loadError && <p className="p-4 text-red-700" role="alert">{loadError}</p>}
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
          <PersonalGis initialPropertyId={selectedProperty?.id} />
        </>
      ) : section === 'property' ? (
        <section className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
          <Button variant="ghost" onClick={() => setSection('home')}>
            <ArrowLeft /> Property dashboard
          </Button>
          <form
            className="mt-6 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
            onSubmit={async (event) => {
              event.preventDefault();
              setSavingProperty(true);
              setPropertyValidationError('');
              try {
              const response = await fetch('/api/validate-address', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: propertyDraft.location }),
              });
              const verified = await response.json() as { address?: string; latitude?: number; longitude?: number; error?: string };
              if (!response.ok || !verified.address || typeof verified.latitude !== 'number' || typeof verified.longitude !== 'number') {
                setPropertyValidationError(verified.error ?? 'The address could not be verified.');
                setSavingProperty(false);
                return;
              }
              const verifiedDraft = { ...propertyDraft, location: verified.address, latitude: verified.latitude, longitude: verified.longitude };
              const db = createBrowserSupabaseClient();
              if (!db || !user.userId) { setPropertyValidationError('Sign in to save properties.'); setSavingProperty(false); return; }
              const record = { name: verifiedDraft.name, county: verifiedDraft.county, address: verifiedDraft.location, approximate_acres: verifiedDraft.acres ? Number(verifiedDraft.acres) : null, cadastral_number: verifiedDraft.cadastralNumber, latitude: verifiedDraft.latitude, longitude: verifiedDraft.longitude, land_type: verifiedDraft.landType, address_verified_at: new Date().toISOString(), address_provider: 'nominatim' };
              const result = editingPropertyId
                ? await db.from('properties').update(record).eq('id', editingPropertyId).eq('owner_id', user.userId).select('id').single()
                : await db.from('properties').insert({ ...record, owner_id: user.userId, created_by: user.userId }).select('id').single();
              if (result.error || !result.data) { setPropertyValidationError('Could not save the property. Check the database migration and connection.'); setSavingProperty(false); return; }
              const id = result.data.id;
              setProperties(current => editingPropertyId ? current.map(p => p.id === id ? { ...p, ...verifiedDraft } : p) : [...current, { id, ...verifiedDraft, status: 'Not assessed' }]);
              setSelectedPropertyId(id);
              setSavingProperty(false);
              setSection('home');
              } catch { setPropertyValidationError('Could not connect. Your property has not been saved; please retry.'); } finally { setSavingProperty(false); }
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
                ['county', 'County', 'text'],
                ['location', 'Complete property address', 'text'],
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
              OARS verifies the address and updates its map coordinates before saving.
            </p>
            {propertyValidationError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{propertyValidationError}</p>}
            <div className="mt-7 flex justify-end gap-2 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => setSection('home')}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingProperty}>{savingProperty ? 'Verifying address…' : 'Save property'}</Button>
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
                            onClick={async () => {
                              const db = createBrowserSupabaseClient();
                              if (!db) return;
                              const { error, data } = await db.from('properties').delete().eq('id', property.id).eq('owner_id', user.userId!).select('id');
                              if (error || !data?.length) { setLoadError('Could not delete the property. Please try again.'); return; }
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

function LegacyAdminPortal({
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
              ownership. Access begins after email verification.
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

type ManagementData = {
  profiles?: AccountProfile[];
  landowners?: AccountProfile[];
  agencies?: AccountProfile[];
  properties?: Array<Record<string, string>>;
  assignments?: Array<Record<string, string | boolean>>;
  applications?: Array<Record<string, string | null>>;
  auditEvents?: Array<Record<string, string | null>>;
};

function useManagementData() {
  const [data, setData] = useState<ManagementData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = async () => {
    setLoading(true);
    const response = await fetch('/api/account-management', { cache: 'no-store' });
    const payload = await response.json() as ManagementData & { error?: string };
    if (!response.ok) setError(payload.error ?? 'Unable to load account data.');
    else { setData(payload); setError(''); }
    setLoading(false);
  };
  useEffect(() => { void refresh(); }, []);
  return { data, loading, error, refresh };
}

async function accountAction(payload: Record<string, unknown>) {
  const response = await fetch('/api/account-management', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Action failed.');
  return data;
}

function ExtensionOfficerPortal({ user, onLogout }: { user: DemoUser; onLogout: () => void }) {
  const { data, loading, error, refresh } = useManagementData();
  const [notice, setNotice] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [selectedLandowner, setSelectedLandowner] = useState('');
  const [busy, setBusy] = useState(false);

  const execute = async (payload: Record<string, unknown>) => {
    setBusy(true); setNotice('');
    try { const result = await accountAction(payload); if (typeof result.temporaryPassword === 'string') setTemporaryPassword(result.temporaryPassword); setNotice('Changes saved.'); await refresh(); }
    catch (actionError) { setNotice(actionError instanceof Error ? actionError.message : 'Action failed.'); }
    setBusy(false);
  };

  const landowners = data.landowners ?? [];
  const applications = data.applications ?? [];
  return <main className="min-h-screen bg-background"><PortalHeader user={user} onLogout={onLogout} /><section className="mx-auto max-w-[1400px] px-5 py-9 lg:px-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-semibold text-[var(--teal-dark)]">Extension Officer workspace</p><h1 className="mt-2 font-heading text-4xl font-semibold">Landowner assistance</h1><p className="mt-3 text-muted-foreground">Manage only the landowners assigned to your portfolio, from first property through program application.</p></div><Button variant="outline" onClick={() => void refresh()}>Refresh portfolio</Button></div>
    {notice && <output className="mt-6 block rounded-xl bg-[var(--teal-soft)] px-4 py-3 text-sm text-[var(--teal-dark)]">{notice}</output>}{error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <Tabs defaultValue="portfolio" className="mt-8"><TabsList className="h-auto flex-wrap"><TabsTrigger value="portfolio">Portfolio</TabsTrigger><TabsTrigger value="new-landowner">Create landowner</TabsTrigger><TabsTrigger value="applications">Program applications</TabsTrigger></TabsList>
      <TabsContent value="portfolio" className="mt-6"><div className="grid gap-4 lg:grid-cols-3">{loading ? <p>Loading assigned landowners…</p> : landowners.map((landowner) => { const property = data.properties?.find((item) => item.owner_id === landowner.user_id); const landownerApplications = applications.filter((item) => item.landowner_id === landowner.user_id); return <article key={landowner.user_id} className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[var(--teal-soft)] text-[var(--teal-dark)]"><UserRound /></span><div><h2 className="font-semibold">{landowner.display_name}</h2><p className="text-sm text-muted-foreground">{landowner.email}</p></div></div><dl className="mt-5 space-y-2 text-sm"><div><dt className="text-muted-foreground">Property</dt><dd className="font-medium">{property?.name ?? 'No property recorded'}</dd></div><div><dt className="text-muted-foreground">Assessment</dt><dd className="font-medium">Ready to continue</dd></div><div><dt className="text-muted-foreground">Applications</dt><dd className="font-medium">{landownerApplications.length}</dd></div></dl><Button className="mt-5 w-full" variant="outline" onClick={() => setSelectedLandowner(landowner.user_id)}>Prepare application</Button></article>; })}{!loading && !landowners.length && <div className="col-span-full rounded-2xl border border-dashed p-10 text-center"><BriefcaseBusiness className="mx-auto size-8 text-[var(--teal-dark)]" /><p className="mt-3 font-semibold">No assigned landowners yet</p><p className="mt-1 text-sm text-muted-foreground">Create a landowner or ask an administrator to assign an existing account.</p></div>}</div></TabsContent>
      <TabsContent value="new-landowner" className="mt-6"><form className="max-w-3xl rounded-2xl border bg-white p-6" onSubmit={(event) => { event.preventDefault(); const f = new FormData(event.currentTarget); void execute({ action:'create_landowner', displayName:textFromForm(f,'displayName'), email:textFromForm(f,'email'), phone:textFromForm(f,'phone'), farmerId:textFromForm(f,'farmerId'), propertyName:textFromForm(f,'propertyName'), county:textFromForm(f,'county'), address:textFromForm(f,'address'), landType:textFromForm(f,'landType'), acres:textFromForm(f,'acres') }); }}><h2 className="font-heading text-2xl font-semibold">Create an approved landowner</h2><p className="mt-2 text-sm text-muted-foreground">This assisted registration is recorded in the audit log and the account is automatically assigned to you.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Full name</span><Input name="displayName" required /></label><label><span className="mb-2 block text-sm font-semibold">Email</span><Input name="email" type="email" required /></label><label><span className="mb-2 block text-sm font-semibold">Phone</span><Input name="phone" type="tel" /></label><label><span className="mb-2 block text-sm font-semibold">Farmer ID</span><Input name="farmerId" required maxLength={80} /></label><label><span className="mb-2 block text-sm font-semibold">Property name</span><Input name="propertyName" required /></label><label><span className="mb-2 block text-sm font-semibold">County</span><Input name="county" required /></label><PropertyAddressFields /><label><span className="mb-2 block text-sm font-semibold">Land use</span><select name="landType" className="h-10 w-full rounded-lg border px-3"><option value="farm">Farm</option><option value="forest">Forest or woodlot</option><option value="both">Farm and forest</option></select></label><label><span className="mb-2 block text-sm font-semibold">Approximate acres</span><Input name="acres" type="number" min="0" step="0.01" /></label></div><Button type="submit" disabled={busy} className="mt-6"><Plus /> Create and approve</Button></form>{temporaryPassword && <div role="status" className="mt-5 max-w-3xl rounded-2xl border-2 border-[var(--teal-dark)] bg-[var(--teal-soft)] p-6"><div className="flex gap-3"><ClipboardCopy className="mt-1 size-5" /><div><h3 className="font-semibold">Temporary password — shown once</h3><p className="mt-2 font-mono text-lg">{temporaryPassword}</p><p className="mt-2 text-sm">Give this password to the landowner securely. They must replace it at first sign-in.</p></div></div></div>}</TabsContent>
      <TabsContent value="applications" className="mt-6"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><form className="rounded-2xl border bg-white p-6" onSubmit={(event) => { event.preventDefault(); const f = new FormData(event.currentTarget); void execute({ action:'create_application', landownerId:textFromForm(f,'landownerId'), agencyId:textFromForm(f,'agencyId'), programName:textFromForm(f,'programName'), assessmentReference:textFromForm(f,'assessmentReference'), notes:textFromForm(f,'notes') }); }}><h2 className="font-heading text-2xl font-semibold">Prepare application</h2><div className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-sm font-semibold">Landowner</span><select name="landownerId" required value={selectedLandowner} onChange={(e) => setSelectedLandowner(e.target.value)} className="h-11 w-full rounded-lg border px-3"><option value="">Select landowner</option>{landowners.map((item) => <option key={item.user_id} value={item.user_id}>{item.display_name}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-semibold">Agency</span><select name="agencyId" required className="h-11 w-full rounded-lg border px-3"><option value="">Select agency</option>{(data.agencies ?? []).map((agency) => <option key={agency.user_id} value={agency.user_id}>{agency.organization ?? agency.display_name}</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-semibold">Agency program</span><Input name="programName" required placeholder="Program name" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Assessment reference</span><Input name="assessmentReference" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">Preparation notes</span><textarea name="notes" className="min-h-24 w-full rounded-lg border p-3 text-sm" /></label><Button type="submit" disabled={busy}><FileText /> Save draft</Button></div></form><div className="space-y-3">{applications.map((application) => <article key={application.id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{application.program_name}</h3><p className="mt-1 text-sm text-muted-foreground">Status: {application.status?.replaceAll('_',' ')}</p></div><div className="flex flex-wrap gap-2">{!application.consented_at && <Button size="sm" variant="outline" onClick={() => { const note = window.prompt('Document how and when the landowner gave consent:'); if (note) void execute({ action:'record_consent', applicationId:application.id, consentNote:note }); }}>Record consent</Button>}<Button size="sm" disabled={!application.consented_at || application.status === 'submitted'} onClick={() => void execute({ action:'submit_application', applicationId:application.id })}>Mark submitted</Button></div></div>{application.notes && <p className="mt-3 text-sm">{application.notes}</p>}</article>)}{!applications.length && <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No program applications have been prepared.</div>}</div></div></TabsContent>
    </Tabs>
  </section></main>;
}

function AccountLifecycleAction({ action, account, disabled, onConfirm }: { action: 'deactivate' | 'reactivate'; account: AccountProfile; disabled: boolean; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const deactivating = action === 'deactivate';
  return <AlertDialog><AlertDialogTrigger render={<Button size="sm" variant="outline" disabled={disabled} />}><Trash2 /> {deactivating ? 'Deactivate' : 'Reactivate'}</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{deactivating ? 'Deactivate' : 'Reactivate'} {account.display_name}?</AlertDialogTitle><AlertDialogDescription>{deactivating ? 'Access will stop immediately, while account records remain available for audit and future reactivation.' : 'This restores access under the account’s existing role and assignments.'}</AlertDialogDescription></AlertDialogHeader><label htmlFor={`reason-${account.user_id}`} className="block text-sm font-semibold">Reason</label><textarea id={`reason-${account.user_id}`} value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-24 w-full rounded-lg border p-3 text-sm" placeholder="Required for the audit record" /><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>{deactivating ? 'Deactivate account' : 'Reactivate account'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function AdminPortal({ user, onLogout }: { user: DemoUser; onLogout: () => void }) {
  const { data, loading, error, refresh } = useManagementData();
  const [notice, setNotice] = useState('');
  const [inviteNotice, setInviteNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const execute = async (payload: Record<string, unknown>) => { setBusy(true); try { await accountAction(payload); setNotice('Changes saved and recorded in the audit log.'); await refresh(); } catch (actionError) { setNotice(actionError instanceof Error ? actionError.message : 'Action failed.'); } setBusy(false); };
  const profiles = data.profiles ?? [];
  const pending = profiles.filter((profile) => profile.status === 'pending');
  const officers = profiles.filter((profile) => profile.role === 'extension_officer' && profile.status === 'active');
  const landowners = profiles.filter((profile) => profile.role === 'landowner' && profile.status === 'active');
  return <main className="min-h-screen bg-background"><PortalHeader user={user} onLogout={onLogout} /><section className="mx-auto max-w-[1400px] px-5 py-9 lg:px-8"><div><p className="text-sm font-semibold text-[var(--teal-dark)]">Administrator dashboard</p><h1 className="mt-2 font-heading text-4xl font-semibold">Accounts, assignments, and audit</h1><p className="mt-3 text-muted-foreground">Approve public registrations, coordinate Extension Officer portfolios, and manage access without erasing account history.</p></div>
  {notice && <output className="mt-6 block rounded-xl bg-[var(--teal-soft)] px-4 py-3 text-sm text-[var(--teal-dark)]">{notice}</output>}{error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
  <div className="mt-7 grid gap-4 sm:grid-cols-4">{[[String(profiles.filter(p=>p.status==='active').length),'Active accounts'],[String(pending.length),'Pending approvals'],[String(officers.length),'Extension Officers'],[String(profiles.filter(p=>p.status==='inactive').length),'Inactive accounts']].map(([value,label])=><div key={label} className="rounded-2xl border bg-white p-5"><p className="text-3xl font-bold text-[var(--navy)]">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}</div>
  <Tabs defaultValue="approvals" className="mt-8"><TabsList className="h-auto flex-wrap"><TabsTrigger value="approvals">Approvals</TabsTrigger><TabsTrigger value="accounts">All accounts</TabsTrigger><TabsTrigger value="assignments">Officer assignments</TabsTrigger><TabsTrigger value="admins">Administrators</TabsTrigger><TabsTrigger value="audit">Audit log</TabsTrigger></TabsList>
    <TabsContent value="approvals" className="mt-6 space-y-3">{loading ? <p>Loading registrations…</p> : pending.map(account => <article key={account.user_id} className="rounded-2xl border bg-white p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="flex items-center gap-2"><h2 className="font-semibold">{account.display_name}</h2><span className="rounded-full bg-[var(--amber)]/20 px-2 py-1 text-xs font-semibold">{account.role.replaceAll('_',' ')}</span></div><p className="mt-1 text-sm text-muted-foreground">{account.email}{account.organization ? ` · ${account.organization}` : ''}</p></div><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => { const reason = window.prompt('Reason for declining this account:'); if (reason) void execute({ action:'decline', targetUserId:account.user_id, reason }); }}>Decline</Button><Button disabled={busy} onClick={() => void execute({ action:'approve', targetUserId:account.user_id })}><BadgeCheck /> Approve</Button></div></div></article>)}{!loading && !pending.length && <div className="rounded-2xl border border-dashed p-10 text-center"><BadgeCheck className="mx-auto size-8 text-[var(--teal-dark)]" /><p className="mt-3 font-semibold">No registrations waiting</p></div>}</TabsContent>
    <TabsContent value="accounts" className="mt-6"><div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead className="border-b bg-[var(--mist)]"><tr><th className="p-4">Account</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{profiles.map(account => <tr key={account.user_id} className="border-b last:border-0"><td className="p-4"><strong>{account.display_name}</strong><br/><span className="text-muted-foreground">{account.email}</span></td><td className="p-4 capitalize">{account.role.replaceAll('_',' ')}</td><td className="p-4 capitalize">{account.status}</td><td className="p-4">{account.status === 'active' ? <AccountLifecycleAction action="deactivate" account={account} disabled={account.user_id===user.userId || busy} onConfirm={(reason) => void execute({action:'deactivate',targetUserId:account.user_id,reason})} /> : account.status === 'inactive' ? <AccountLifecycleAction action="reactivate" account={account} disabled={busy} onConfirm={(reason) => void execute({action:'reactivate',targetUserId:account.user_id,reason})} /> : null}</td></tr>)}</tbody></table></div></TabsContent>
    <TabsContent value="assignments" className="mt-6"><div className="grid gap-4 lg:grid-cols-2">{landowners.map(landowner => { const assignment=data.assignments?.find(item=>item.landowner_id===landowner.user_id && item.active); return <article key={landowner.user_id} className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">{landowner.display_name}</h2><p className="text-sm text-muted-foreground">{landowner.email}</p><label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Assigned Extension Officer</span><select defaultValue={String(assignment?.extension_officer_id ?? '')} onChange={(e)=>{ if(e.target.value) void execute({action:'assign',targetUserId:landowner.user_id,officerId:e.target.value}); }} className="h-10 w-full rounded-lg border px-3"><option value="">Unassigned</option>{officers.map(officer=><option key={officer.user_id} value={officer.user_id}>{officer.display_name}</option>)}</select></label></article>; })}</div></TabsContent>
    <TabsContent value="admins" className="mt-6"><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><form className="rounded-2xl border bg-white p-6" onInvalid={()=>setInviteNotice('Enter a full name and a valid email address.')} onSubmit={async(event)=>{event.preventDefault();const form=event.currentTarget;const f=new FormData(form);setBusy(true);setInviteNotice('Sending invitation…');try{await accountAction({action:'invite_admin',displayName:textFromForm(f,'displayName'),email:textFromForm(f,'email')});form.reset();setInviteNotice('Invitation sent. The new administrator must accept the email before signing in.');await refresh();}catch(actionError){setInviteNotice(actionError instanceof Error?actionError.message:'Invitation could not be sent.');}finally{setBusy(false);}}}><h2 className="font-heading text-2xl font-semibold">Invite administrator</h2><p className="mt-2 text-sm text-muted-foreground">The recipient creates their own password from a secure email invitation.</p><label className="mt-5 block"><span className="mb-2 block text-sm font-semibold">Full name</span><Input name="displayName" required /></label><label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Email</span><Input name="email" type="email" required placeholder="name@example.com" /></label><Button type="submit" className="mt-5" disabled={busy}><Plus /> {busy?'Sending…':'Send invitation'}</Button>{inviteNotice&&<output aria-live="polite" className="mt-4 block rounded-xl bg-[var(--teal-soft)] px-4 py-3 text-sm text-[var(--teal-dark)]">{inviteNotice}</output>}</form><div className="space-y-3">{profiles.filter(p=>p.role==='admin').map(admin=><article key={admin.user_id} className="rounded-2xl border bg-white p-5"><div className="flex items-center gap-3"><ShieldCheck className="text-[var(--teal-dark)]"/><div><h3 className="font-semibold">{admin.display_name}{admin.user_id===user.userId?' (you)':''}</h3><p className="text-sm text-muted-foreground">{admin.email} · {admin.status}</p></div></div></article>)}</div></div></TabsContent>
    <TabsContent value="audit" className="mt-6"><div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead className="border-b bg-[var(--mist)]"><tr><th className="p-4">Time</th><th className="p-4">Action</th><th className="p-4">Target</th><th className="p-4">Reason</th></tr></thead><tbody>{(data.auditEvents??[]).map(event=><tr key={event.id} className="border-b last:border-0"><td className="p-4">{event.created_at ? new Date(event.created_at).toLocaleString() : ''}</td><td className="p-4 capitalize">{event.action?.replaceAll('_',' ')}</td><td className="p-4 font-mono text-xs">{event.target_user_id}</td><td className="p-4">{event.reason || '—'}</td></tr>)}</tbody></table></div></TabsContent>
  </Tabs></section></main>;
}

export default function Home() {
  const [publicView, setPublicView] = useState<PublicView>('landing');
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(isSupabaseConfigured);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [authNotice, setAuthNotice] = useState('');

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const query = new URLSearchParams(window.location.search);
    setForcePasswordChange(query.has('update-password'));
    if (query.get('google-registration') === 'active') {
      setAuthNotice('Your Google registration is complete. No administrator approval is required.');
      window.history.replaceState({}, '', '/');
    } else if (query.get('google-registration') === 'pending') {
      setAuthNotice('Your Google account was verified and your OARS registration was submitted. An administrator must approve it before you can sign in.');
      setPublicView('login');
      window.history.replaceState({}, '', '/');
    } else if (query.get('google-registration') === 'error') {
      setAuthNotice('Google verified your identity, but OARS could not finish the registration. Please try again or create the account with email and password.');
      setPublicView('login');
      window.history.replaceState({}, '', '/');
    }
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', data.user.id).single<AccountProfile>();
        if (profile?.status === 'active') {
          setUser({ userId: profile.user_id, name: profile.display_name, email: profile.email, role: profile.role, status: profile.status, mustChangePassword: profile.must_change_password, organization: profile.organization ?? undefined, farmerId: profile.farmer_id ?? undefined });
        } else {
          await supabase.auth.signOut();
        }
      }
      setLoadingSession(false);
    };
    void load();
  }, []);

  if (loadingSession) return <main className="grid min-h-screen place-items-center bg-[var(--mist)]"><div className="text-center"><OarsMark className="mx-auto size-14" /><p className="mt-4 font-semibold">Opening your secure OARS workspace…</p></div></main>;
  if (!user) {
    if (publicView === 'login')
      return <LoginPage onNavigate={setPublicView} onLogin={setUser} initialMessage={authNotice} />;
    if (publicView === 'register')
      return <RegistrationPage onNavigate={setPublicView} />;
    return <LandingPage onNavigate={setPublicView} />;
  }
  const logout = () => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) void supabase.auth.signOut();
    setUser(null);
    setPublicView('landing');
  };
  if (user.mustChangePassword || forcePasswordChange) return <PasswordChange user={user} onLogout={logout} onComplete={() => { setUser({ ...user, mustChangePassword: false }); setForcePasswordChange(false); window.history.replaceState({}, '', '/'); }} />;
  if (user.role === 'agency')
    return <AgencyPortal user={user} onLogout={logout} />;
  if (user.role === 'extension_officer')
    return <ExtensionOfficerPortal user={user} onLogout={logout} />;
  if (user.role === 'admin')
    return <AdminPortal user={user} onLogout={logout} />;
  return <LandownerPortal user={user} onLogout={logout} />;
}
