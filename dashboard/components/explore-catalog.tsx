'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { programs, type Program } from '@/lib/programs';

import { communityProgram, type CommunityProgram } from '@/lib/community-programs';
export function ExploreCatalog() {
  const [added, setAdded] = useState<Program[]>([]);
  const [catalogError, setCatalogError] = useState('');
  useEffect(() => { let active = true; fetch('/api/programs', {cache:'no-store'}).then(async response => { const data = await response.json(); if (!response.ok) throw new Error('Contributor programs are temporarily unavailable. Workbook records are still shown.'); if(active) setAdded(data.programs.map((record: CommunityProgram) => communityProgram(record))); }).catch(error => {if(active) setCatalogError(error.message);}); return () => {active=false;}; }, []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [scope, setScope] = useState('all');
  const [kind, setKind] = useState('all');
  const [shortlist, setShortlist] = useState(false);
  const [page, setPage] = useState(1);
  const filtered = [...added, ...programs].filter((program) => {
    const matchesQuery =
      `${program.name} ${program.agency} ${program.description} ${program.tags.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesQuery && (scope === 'all' || program.scope === scope) && (kind === 'all' || program.type === kind) && (!shortlist || program.shortlisted) &&
      (filter === 'all' || program.land === filter || program.land === 'both')
    );
  });
  const visible = filtered.slice(0, page * 24);
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
            Browse the OARS-supplied program and practice records. Repeated names can represent different counties or source sections. Provider eligibility and funding details require confirmation.
          </p>
        </div>
        <div className="rounded-xl border bg-[var(--mist)] px-4 py-3 text-sm">
          <strong>{filtered.length}</strong> matching records
        </div>
      </div>
      {catalogError && <output className="mt-4 block text-sm text-amber-800">{catalogError}</output>}
      <div className="mt-8 grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
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
              onClick={() => { setFilter(value); setPage(1); }}
              className="capitalize"
            >
              {value === 'all' ? 'All land' : value}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-sm font-semibold">Location<select className="ml-2 rounded border bg-white p-2" value={scope} onChange={e => { setScope(e.target.value); setPage(1); }}><option value="all">All locations</option>{['Federal','MD','DE','NJ','VA','Private'].map(v => <option key={v} value={v}>{v}</option>)}</select></label>
        <label className="text-sm font-semibold">Resource type<select className="ml-2 rounded border bg-white p-2" value={kind} onChange={e => { setKind(e.target.value); setPage(1); }}><option value="all">All resources</option><option>Program</option><option>Practice</option></select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shortlist} onChange={e => { setShortlist(e.target.checked); setPage(1); }} /> OARS shortlist only</label>
      </div>
      <Tabs defaultValue="cards" className="mt-7">
        <TabsList>
          <TabsTrigger value="cards">Resource cards</TabsTrigger>
          <TabsTrigger value="compare">Compare details</TabsTrigger>
        </TabsList>
        <TabsContent value="cards">
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {visible.map((program) => (
              <article
                key={program.id}
                className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold text-[var(--teal-dark)]">
                    {program.scope} · {program.type}
                  </span>
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {program.land}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{program.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {program.agency}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{program.county || program.scope} · {program.sourceSheet}{program.shortlisted ? " · OARS shortlist" : ""}</p>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
                  {program.description}
                </p>
                <div className="mt-5 border-t pt-4">
                  <p className="text-sm">
                    <strong>Cost share:</strong> {program.costShare}
                  </p>
                  <Link href={`/programs/${program.id}`} className="mt-3 inline-block text-sm font-semibold text-[var(--teal-dark)] underline">View eligibility, contacts, and details →</Link>
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
                  {visible.map((program) => (
                    <tr key={program.id} className="border-t align-top">
                      <td className="p-4 font-semibold"><Link className="underline" href={`/programs/${program.id}`}>{program.name}</Link><p className="mt-1 text-xs font-normal">{program.scope} · {program.county}</p></td>
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
      {visible.length < filtered.length && <Button className="mt-6" variant="outline" onClick={() => setPage(n => n + 1)}>Show more · {visible.length} of {filtered.length}</Button>}
    </section>
  );
}
