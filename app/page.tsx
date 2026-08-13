'use client'

import { useState } from 'react'
import { ChevronRight, Hexagon, Menu, ShieldCheck, X } from 'lucide-react'
import { BizLensScene } from '@/components/bizlens-scene'
import { BizLensDemo } from '@/components/bizlens-demo'

function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <main className="min-h-screen overflow-hidden bg-[#080808] text-foreground font-sans">
      {/* Navigation Header */}
      <header className="absolute inset-x-0 top-0 z-30 flex h-20 items-center justify-between px-6 md:px-12 lg:px-16">
        <a href="#top" className="flex items-center gap-2.5 text-xl font-normal text-white">
          <Hexagon className="size-6 text-white stroke-[1.75]" aria-hidden="true" />
          BizLens
        </a>
        <nav className="hidden items-center gap-10 text-[15px] font-normal text-zinc-400 lg:flex">
          <a href="#upload" className="transition hover:text-white">Upload</a>
          <a href="#pipeline" className="transition hover:text-white">Analyze</a>
          <a href="#dashboard" className="transition hover:text-white">Dashboard</a>
          <a href="#verify" className="transition hover:text-white">Verify</a>
          <a href="#architecture" className="transition hover:text-white">Architecture</a>
          <a href="#decide" className="transition hover:text-white">Decide</a>
        </nav>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => scrollTo('dashboard')} 
            className="hidden rounded-full border border-zinc-700/80 bg-[#18181c]/90 px-5 py-2 text-[14px] font-normal text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:border-zinc-600 sm:block"
          >
            Open Workspace
          </button>
          <button aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-zinc-800 p-2 text-zinc-300 lg:hidden">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="absolute left-0 right-0 top-20 flex flex-col gap-4 border-b border-zinc-800 bg-[#080808] px-8 py-6 text-sm lg:hidden">
            <a href="#upload" onClick={() => setMenuOpen(false)}>Upload</a>
            <a href="#pipeline" onClick={() => setMenuOpen(false)}>Analyze</a>
            <a href="#dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a>
            <a href="#verify" onClick={() => setMenuOpen(false)}>Verify</a>
            <a href="#architecture" onClick={() => setMenuOpen(false)}>Architecture</a>
            <a href="#decide" onClick={() => setMenuOpen(false)}>Decide</a>
          </nav>
        )}
      </header>

      {/* Hero Section */}
      <section id="top" className="relative isolate min-h-screen bg-[#080808] pt-20">
        <BizLensScene />
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-[1600px] flex-col justify-between px-6 pb-12 pt-14 md:px-12 lg:px-16">
          {/* Top Info Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
            {/* Left Signal List */}
            <div className="hidden flex-col gap-3.5 text-[12px] uppercase text-zinc-400 md:flex">
              <span>/ Upload</span>
              <span>/ Analyze</span>
              <span>/ Verify</span>
            </div>

            {/* Right Paragraph */}
            <div className="md:ml-auto md:max-w-[420px] md:text-right text-[19px] leading-[1.5] text-zinc-100">
              Static dashboards explain what happened. BizLens shows what changed, why it matters, and which source proves it.
            </div>
          </div>

          {/* Bottom Content Row */}
          <div className="mt-auto grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            {/* Main Headline & Subtext */}
            <div className="lg:col-span-8 max-w-[820px]">
              {/* Trusted Badge */}
              <div className="inline-flex items-center gap-3 rounded-full border border-zinc-800/80 bg-[#16171d]/90 py-1.5 pl-3 pr-4 text-[12px] uppercase text-zinc-300 backdrop-blur-md">
                <span className="h-3.5 w-[2px] rounded-full bg-white" />
                From raw file to verified decision
              </div>

              {/* Main Headline */}
              <h1 className="mt-5 text-5xl font-normal leading-[1.02] text-white sm:text-6xl md:text-7xl lg:text-[86px]">
                Business intelligence<br />
                that can defend itself.
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-[660px] text-lg leading-8 text-zinc-400 sm:text-xl">
                Upload CSV, XLSX, or PDF files. Watch BizLens analyze the records, open a live dashboard, surface conflicts, verify each claim, and turn the signal into a decision brief.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button 
                  onClick={() => scrollTo('upload')} 
                  className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-normal text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
                >
                  Start with a file <ChevronRight className="size-4 text-black" />
                </button>
                <button 
                  onClick={() => scrollTo('dashboard')} 
                  className="flex items-center gap-2 rounded-full border border-zinc-700/60 bg-[#222329] px-7 py-3.5 text-[15px] font-normal text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 hover:border-zinc-600"
                >
                  Open dashboard
                </button>
              </div>
            </div>

            {/* Right Trust Score Card */}
            <div className="lg:col-span-4 lg:flex lg:justify-end">
              <div className="w-full max-w-[360px] rounded-[2rem] border border-white/10 bg-[#121319]/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                <div className="flex items-center gap-2.5 text-[12px] uppercase text-zinc-400">
                  <ShieldCheck className="size-5 text-zinc-200 stroke-[1.75]" />
                  <span>TRUST SCORE</span>
                </div>
                <div className="mt-4 text-[68px] font-normal leading-none text-white">
                  96%
                </div>
                <p className="mt-2 text-[16px] text-zinc-400">
                  Verified Accuracy
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-[#1b1c24]/70 py-3.5 px-2 text-center">
                    <b className="text-xl font-normal text-white leading-none">3</b>
                    <span className="mt-1.5 text-[10px] uppercase text-zinc-400">SOURCES</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-[#1b1c24]/70 py-3.5 px-2 text-center">
                    <b className="text-xl font-normal text-white leading-none">7</b>
                    <span className="mt-1.5 text-[10px] uppercase text-zinc-400">STEPS</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-[#1b1c24]/70 py-3.5 px-2 text-center">
                    <b className="text-xl font-normal text-white leading-none">1</b>
                    <span className="mt-1.5 text-[10px] uppercase text-zinc-400">CONFLICT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BizLensDemo />

      <footer className="border-t border-zinc-800 bg-[#080808] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-zinc-400 sm:flex-row">
          <span>BizLens / Decision intelligence for teams</span>
          <span>Built for clarity, grounded in evidence.</span>
        </div>
      </footer>
    </main>
  )
}
