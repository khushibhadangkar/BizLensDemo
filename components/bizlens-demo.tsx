'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Database,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { copilotAnswers, novaRetail, parsedLedgerData, rawCsvDatasets, workflowSteps, type Claim, type LedgerRow } from '@/lib/bizlens-data'

type TimeFilter = 'all' | 'jul' | 'aug' | 'sep'
type MetricKey = 'revenue' | 'margin' | 'records' | 'conflicts' | 'expenses'
type ProcessingState = 'idle' | 'loading' | 'success' | 'error'
type VerificationState = 'idle' | 'checking' | 'verified' | 'conflict'

const questions = Object.keys(copilotAnswers)
const departmentOptions = ['All', ...Array.from(new Set(parsedLedgerData.map((row) => row.department)))]
const sourceOptions = ['All', ...Array.from(new Set(parsedLedgerData.map((row) => row.source_file)))]
const pipelineCopy = [
  'Files enter the workspace with source names preserved.',
  'BizLens parses sheets, dates, rows, categories, and record IDs.',
  'The system understands business meaning across finance, CRM, and reports.',
  'KPIs, trends, conflicts, and opportunities are calculated from live records.',
  'Each claim is checked against evidence and source lineage.',
  'A decision brief turns the verified signal into action.',
]

function formatCurrency(value: number) {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`
  return `$${Math.round(value / 1000)}k`
}

function getMonthKey(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleString('en-US', { month: 'short' }).toLowerCase() as TimeFilter
}

function getSourceLine(row: LedgerRow) {
  return row.transaction_id === 'TX-1007' ? 'Line 8' : `Line ${Number(row.transaction_id.replace('TX-100', '')) + 1}`
}

function reveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.75, delay, ease: 'easeOut' },
  } as const
}

export function BizLensDemo() {
  const [files, setFiles] = useState<string[]>(['q3_finance_ledger.csv', 'crm_export_q3.csv', 'board_report.pdf'])
  const [activeStep, setActiveStep] = useState(3)
  const [selectedClaim, setSelectedClaim] = useState<Claim>(novaRetail.claims[1])
  const [verificationState, setVerificationState] = useState<VerificationState>('conflict')
  const [question, setQuestion] = useState('Which source is conflicting?')
  const [answer, setAnswer] = useState(copilotAnswers['Which source is conflicting?'])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('revenue')
  const [selectedRecordId, setSelectedRecordId] = useState('TX-1007')
  const [showEvidence, setShowEvidence] = useState(true)
  const [processingState, setProcessingState] = useState<ProcessingState>('success')
  const [processingMessage, setProcessingMessage] = useState('Sample workspace loaded')
  const [openedSource, setOpenedSource] = useState<keyof typeof rawCsvDatasets>('financialLedger')

  function loadDataset() {
    setProcessingState('loading')
    setProcessingMessage('Uploading files...')
    setFiles([])
    setActiveStep(0)
    window.setTimeout(() => {
      setProcessingMessage('Parsing records and building lineage...')
      setActiveStep(1)
    }, 650)
    window.setTimeout(() => {
      setProcessingMessage('Calculating KPIs and verifying conflicts...')
      setActiveStep(4)
    }, 1350)
    window.setTimeout(() => {
      setFiles(['q3_finance_ledger.csv', 'crm_export_q3.csv', 'board_report.pdf'])
      setTimeFilter('all')
      setDepartmentFilter('All')
      setSourceFilter('All')
      setSelectedMetric('revenue')
      setSelectedRecordId('TX-1007')
      setProcessingState('success')
      setProcessingMessage('Sample workspace loaded')
      setActiveStep(5)
    }, 2150)
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const names = Array.from(list).filter((file) => /\.(csv|xlsx?|pdf)$/i.test(file.name)).map((file) => file.name)
    if (names.length) {
      setFiles((current) => [...new Set([...current, ...names])])
      setProcessingState('success')
      setProcessingMessage(`${names.length} custom file${names.length === 1 ? '' : 's'} added`)
      setActiveStep(1)
    } else {
      setProcessingState('error')
      setProcessingMessage('Upload a CSV, XLSX, XLS, or PDF file')
    }
  }

  function openSourceFile(name: string) {
    if (name === 'crm_export_q3.csv') setOpenedSource('crmDeals')
    else if (name === 'ai_audit_log.csv') setOpenedSource('auditLog')
    else setOpenedSource('financialLedger')
    setSourceFilter(name)
    setSelectedMetric('records')
  }

  function runVerification(claim: Claim) {
    setSelectedClaim(claim)
    setShowEvidence(true)
    setVerificationState('checking')
    window.setTimeout(() => {
      setVerificationState(claim.status === 'conflict' ? 'conflict' : 'verified')
    }, 900)
  }

  const filteredLedger = useMemo(() => {
    if (processingState === 'loading' || files.length === 0) return []
    return parsedLedgerData.filter((row) => {
      const matchesTime = timeFilter === 'all' || getMonthKey(row.date) === timeFilter
      const matchesDepartment = departmentFilter === 'All' || row.department === departmentFilter
      const matchesSource = sourceFilter === 'All' || row.source_file === sourceFilter
      return matchesTime && matchesDepartment && matchesSource
    })
  }, [departmentFilter, files.length, processingState, sourceFilter, timeFilter])

  const kpiMetrics = useMemo(() => {
    const verifiedRows = filteredLedger.filter((row) => row.status === 'verified')
    const totalRev = verifiedRows.reduce((sum, row) => sum + row.revenue, 0)
    const totalExp = filteredLedger.reduce((sum, row) => sum + row.expense, 0)
    const netProfit = totalRev - totalExp
    const conflictRows = filteredLedger.filter((row) => row.status === 'conflict')

    return {
      totalRev,
      totalExp,
      netProfit,
      marginPct: totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : '0.0',
      conflictCount: conflictRows.length,
      conflictAmount: conflictRows.reduce((sum, row) => sum + row.revenue, 0),
      verifiedCount: verifiedRows.length,
      accuracy: filteredLedger.length ? Math.round((verifiedRows.length / filteredLedger.length) * 100) : 0,
    }
  }, [filteredLedger])

  const trendData = useMemo(() => {
    return ['Jul', 'Aug', 'Sep'].map((month) => {
      const rows = filteredLedger.filter((row) => getMonthKey(row.date) === month.toLowerCase())
      return {
        month,
        revenue: rows.filter((row) => row.status === 'verified').reduce((sum, row) => sum + row.revenue, 0) / 1000,
        expenses: rows.reduce((sum, row) => sum + row.expense, 0) / 1000,
        conflicts: rows.filter((row) => row.status === 'conflict').reduce((sum, row) => sum + row.revenue, 0) / 1000,
      }
    })
  }, [filteredLedger])

  const departmentExpenseData = useMemo(() => {
    return departmentOptions.slice(1).map((department) => {
      const rows = filteredLedger.filter((row) => row.department === department)
      return {
        department,
        expense: rows.reduce((sum, row) => sum + row.expense, 0) / 1000,
        conflicts: rows.filter((row) => row.status === 'conflict').length,
      }
    }).filter((row) => row.expense > 0 || row.conflicts > 0)
  }, [filteredLedger])

  const selectedRecord = useMemo(() => {
    return filteredLedger.find((row) => row.transaction_id === selectedRecordId) ?? filteredLedger[0] ?? parsedLedgerData[0]
  }, [filteredLedger, selectedRecordId])

  const drillRows = useMemo(() => {
    if (selectedMetric === 'conflicts') return filteredLedger.filter((row) => row.status === 'conflict')
    if (selectedMetric === 'expenses') return filteredLedger.filter((row) => row.expense > 0)
    if (selectedMetric === 'records') return filteredLedger
    if (selectedMetric === 'margin') return filteredLedger.filter((row) => row.revenue > 0 || row.expense > 0)
    return filteredLedger.filter((row) => row.revenue > 0 && row.status === 'verified')
  }, [filteredLedger, selectedMetric])

  const insightCopy = useMemo(() => {
    const largestExpense = [...filteredLedger].sort((a, b) => b.expense - a.expense)[0]
    const conflict = filteredLedger.find((row) => row.status === 'conflict')
    const lastTwo = trendData.filter((row) => row.revenue > 0).slice(-2)
    const trend = lastTwo.length === 2 ? lastTwo[1].revenue - lastTwo[0].revenue : 0
    const scope = [timeFilter === 'all' ? 'Q3' : timeFilter.toUpperCase(), departmentFilter === 'All' ? 'all departments' : departmentFilter].join(' / ')

    return {
      headline: trend > 0 ? `Revenue is accelerating across ${scope}.` : 'The current view has a narrower evidence base.',
      trend: trend > 0 ? `Verified revenue increased by ${formatCurrency(trend * 1000)} between the last two active months.` : 'Filters are limiting verified revenue records, so the view is more diagnostic than directional.',
      risk: conflict ? `${formatCurrency(conflict.revenue)} is still unresolved because ${conflict.source_file} conflicts with board timing.` : 'No conflict remains under the active filters.',
      opportunity: largestExpense ? `${largestExpense.department} carries the largest active expense at ${formatCurrency(largestExpense.expense)}.` : 'No active expense records are visible in this view.',
    }
  }, [departmentFilter, filteredLedger, timeFilter, trendData])

  const sourcePreview = rawCsvDatasets[openedSource]
  const appStatus = `${files.length} sources active / ${filteredLedger.length} records in view / ${kpiMetrics.accuracy}% verified`
  const dashboardDisabled = processingState === 'loading' || files.length === 0

  return (
    <div className="relative bg-[#080808]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(59,130,246,0.10),transparent_18%,transparent_72%,rgba(59,130,246,0.08))]" />

      <section id="upload" className="relative mx-auto max-w-7xl px-6 py-24 md:px-12 lg:py-32">
        <motion.div {...reveal()} className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="eyebrow">Upload</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-normal leading-[1.05] text-white md:text-6xl">
              Start with the files your business already trusts.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Drop a ledger, CRM export, or board report. BizLens keeps every file attached to the numbers it creates.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#101116]/70 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <div className={`rounded-[1.5rem] border border-dashed p-7 transition ${processingState === 'error' ? 'border-red-400/45 bg-red-500/10' : processingState === 'loading' ? 'border-blue-300/50 bg-blue-500/15' : 'border-blue-400/30 bg-blue-500/10'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-full bg-white text-black">
                    {processingState === 'loading' ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                  </span>
                  <div>
                    <p className="text-xl font-normal text-white">Upload workspace</p>
                    <p className={`mt-1 text-sm ${processingState === 'error' ? 'text-red-300' : 'text-zinc-400'}`}>{processingMessage} / {appStatus}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={processingState === 'loading'} onClick={loadDataset} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60">
                    {processingState === 'loading' ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />} {processingState === 'loading' ? 'Processing' : 'Load sample'}
                  </button>
                  <label className={`inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-white transition hover:bg-zinc-900 ${processingState === 'loading' ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                    <input className="sr-only" type="file" multiple accept=".csv,.xlsx,.xls,.pdf" onChange={(event) => addFiles(event.target.files)} />
                    <FileSpreadsheet className="size-4" /> Add files
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {files.map((file, index) => (
                <motion.div
                  key={file}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-[#15161d]/75 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <FileText className="size-5 text-blue-300" />
                    <button aria-label={`Remove ${file}`} onClick={() => setFiles(files.filter((item) => item !== file))}>
                      <X className="size-4 text-zinc-500 hover:text-white" />
                    </button>
                  </div>
                  <p className="mt-4 truncate text-sm text-white">{file}</p>
                  <p className="mt-1 text-xs text-zinc-500">Queued for parsing and lineage</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="pipeline" className="relative border-y border-white/5 bg-[#0a0a0b] px-6 py-20 md:px-12">
        <motion.div {...reveal()} className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow">Analyze</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-normal leading-[1.05] text-white md:text-6xl">
                The workflow stays visible from ingestion to decision.
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-zinc-400">
              Click any step to see how BizLens turns raw rows into verified business language.
            </p>
          </div>

          <div className="mt-12 grid gap-3 lg:grid-cols-6">
            {workflowSteps.map((step, index) => (
              <button
                key={step}
                onClick={() => setActiveStep(index)}
                className={`group min-h-32 rounded-[1.5rem] border p-5 text-left transition duration-300 hover:-translate-y-0.5 ${activeStep === index ? 'border-white bg-white text-black shadow-[0_22px_70px_rgba(255,255,255,0.08)]' : 'border-white/10 bg-[#121319]/70 text-white hover:border-blue-400/45 hover:bg-[#151720]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-inherit opacity-60">{String(index + 1).padStart(2, '0')}</span>
                  {index < workflowSteps.length - 1 && <ChevronRight className="size-4 opacity-50 transition group-hover:translate-x-1" />}
                </div>
                <p className="mt-8 text-2xl font-normal">{step}</p>
                <p className={`mt-3 text-sm leading-6 ${activeStep === index ? 'text-zinc-700' : 'text-zinc-500'}`}>{pipelineCopy[index]}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="dashboard" className="relative px-12 py-20 md:px-16">
        <motion.div {...reveal()} className="mx-auto flex h-[680px] max-w-[1200px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c0d11]/92 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#111218]/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-white text-black"><Database className="size-4" /></span>
              <div>
                <p className="text-lg font-normal text-white">BizLens Intelligence Workspace</p>
                <p className="text-xs text-zinc-500">{appStatus}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="status-pill"><ShieldCheck className="size-3.5" /> {processingState === 'loading' ? 'Processing' : 'Live verified'}</span>
              <a href="#verify" className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900 hover:text-white">
                Evidence trail <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>

          <div className="relative grid gap-4 overflow-y-auto p-5 xl:grid-cols-[220px_1fr_280px]">
            {dashboardDisabled && (
              <div className="absolute inset-5 z-20 grid place-items-center rounded-[1.5rem] border border-white/10 bg-[#0c0d11]/85 backdrop-blur-md">
                <div className="text-center">
                  {processingState === 'loading' ? <Loader2 className="mx-auto size-8 animate-spin text-blue-300" /> : <Database className="mx-auto size-8 text-zinc-500" />}
                  <p className="mt-4 text-2xl text-white">{processingMessage}</p>
                  <p className="mt-2 text-sm text-zinc-500">Load a sample or add files to populate the workspace.</p>
                </div>
              </div>
            )}
            <aside className="rounded-[1.5rem] border border-white/10 bg-[#111218]/60 p-4">
              <div className="flex items-center gap-2 text-xs uppercase text-zinc-500">
                <Filter className="size-4" /> Live filters
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="mb-2 text-xs text-zinc-500">Period</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['all', 'jul', 'aug', 'sep'] as TimeFilter[]).map((item) => (
                      <button disabled={dashboardDisabled} key={item} onClick={() => setTimeFilter(item)} className={`rounded-full px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${timeFilter === item ? 'bg-white text-black' : 'border border-white/10 bg-[#0c0d11]/70 text-zinc-300 hover:border-blue-400/50'}`}>
                        {item === 'all' ? 'Q3' : item.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-zinc-500">Department</p>
                  <select disabled={dashboardDisabled} value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="w-full rounded-full border border-white/10 bg-[#0c0d11]/70 px-4 py-2 text-sm text-zinc-200 outline-none disabled:opacity-40">
                    {departmentOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-2 text-xs text-zinc-500">Source</p>
                  <select disabled={dashboardDisabled} value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="w-full rounded-full border border-white/10 bg-[#0c0d11]/70 px-4 py-2 text-sm text-zinc-200 outline-none disabled:opacity-40">
                    {sourceOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-4">
                <p className="text-xs uppercase text-zinc-500">Connected files</p>
                <div className="mt-3 space-y-2">
                  {novaRetail.sources.map((source) => (
                    <button disabled={dashboardDisabled} key={source.name} onClick={() => openSourceFile(source.name)} className={`w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${sourceFilter === source.name ? 'border-blue-400/50 bg-blue-500/10' : 'border-white/10 bg-[#0c0d11]/70 hover:border-zinc-600'}`}>
                      <p className="truncate text-sm text-white">{source.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{source.rows} rows / {source.status}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-500">Opened source</p>
                  <p className="mt-1 text-sm text-white">
                    {openedSource === 'financialLedger' ? 'q3_finance_ledger.csv' : openedSource === 'crmDeals' ? 'crm_export_q3.csv' : 'ai_audit_log.csv'}
                  </p>
                  <p className="mt-2 truncate text-xs text-zinc-500">{sourcePreview.split('\n')[0]}</p>
                </div>
              </div>
            </aside>

            <main className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { key: 'revenue' as const, label: 'Revenue', value: formatCurrency(kpiMetrics.totalRev), meta: `${kpiMetrics.verifiedCount} verified records` },
                  { key: 'margin' as const, label: 'Margin', value: `${kpiMetrics.marginPct}%`, meta: `${formatCurrency(kpiMetrics.netProfit)} net` },
                  { key: 'records' as const, label: 'Accuracy', value: `${kpiMetrics.accuracy}%`, meta: `${filteredLedger.length} rows in view` },
                  { key: 'conflicts' as const, label: 'Conflicts', value: String(kpiMetrics.conflictCount), meta: `${formatCurrency(kpiMetrics.conflictAmount)} at risk` },
                ].map((metric) => (
                  <button disabled={dashboardDisabled} key={metric.key} onClick={() => setSelectedMetric(metric.key)} className={`rounded-[1.5rem] border p-4 text-left transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${selectedMetric === metric.key ? 'border-white bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.08)]' : 'border-white/10 bg-[#111218]/60 text-white hover:border-blue-400/45'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase opacity-60">{metric.label}</p>
                      <Eye className="size-4 opacity-50" />
                    </div>
                    <p className="mt-3 text-2xl font-normal">{metric.value}</p>
                    <p className={`mt-2 text-xs ${selectedMetric === metric.key ? 'text-zinc-700' : 'text-zinc-500'}`}>{metric.meta}</p>
                  </button>
                ))}
              </div>

              <div className="grid flex-1 gap-4 xl:grid-cols-[1.25fr_.75fr]">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#111218]/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">Revenue, expense, and conflict movement</p>
                    <span className="text-xs text-zinc-500">Click a month</span>
                  </div>
                  <div className="h-[220px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} onClick={(state) => {
                        const month = String(state?.activeLabel ?? '').toLowerCase() as TimeFilter
                        if (month) setTimeFilter(month)
                        setSelectedMetric('revenue')
                      }}>
                        <defs>
                          <linearGradient id="dashRevenue" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                        <XAxis dataKey="month" stroke="#71717a" tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" tickLine={false} axisLine={false} width={38} />
                        <Tooltip contentStyle={{ background: '#101116', border: '1px solid #3f3f46', borderRadius: 8, color: '#ffffff' }} formatter={(value, name) => [`$${value}k`, name]} />
                        <Area type="monotone" dataKey="revenue" stroke="#60a5fa" fill="url(#dashRevenue)" strokeWidth={2.5} name="Verified revenue" />
                        <Area type="monotone" dataKey="expenses" stroke="#f4f4f5" fill="none" strokeWidth={1.6} name="Expenses" />
                        <Area type="monotone" dataKey="conflicts" stroke="#f59e0b" fill="none" strokeDasharray="5 5" strokeWidth={2} name="Conflict value" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-[#111218]/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white">Department expenses</p>
                    <span className="text-xs text-zinc-500">Click a bar</span>
                  </div>
                  <div className="h-[220px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentExpenseData} onClick={(state) => {
                        const department = state?.activeLabel
                        if (department) setDepartmentFilter(String(department))
                        setSelectedMetric('expenses')
                      }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                        <XAxis dataKey="department" stroke="#71717a" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis stroke="#71717a" tickLine={false} axisLine={false} width={34} />
                        <Tooltip contentStyle={{ background: '#101116', border: '1px solid #3f3f46', borderRadius: 8, color: '#ffffff' }} formatter={(value, name) => [`$${value}k`, name]} />
                        <Bar dataKey="expense" radius={[5, 5, 0, 0]} name="Expense">
                          {departmentExpenseData.map((entry) => (
                            <Cell key={entry.department} fill={entry.conflicts ? '#f59e0b' : departmentFilter === entry.department ? '#ffffff' : '#60a5fa'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </main>

            <aside className="grid gap-4">
              <button disabled={dashboardDisabled} onClick={() => { runVerification(novaRetail.claims[1]); document.getElementById('verify')?.scrollIntoView({ behavior: 'smooth' }) }} className="rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-40">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="size-4" /> Flagged conflict
                </div>
                <p className="mt-3 text-2xl font-normal text-white">{formatCurrency(kpiMetrics.conflictAmount || 184000)}</p>
                <p className="mt-2 text-xs leading-5 text-amber-100/75">CRM records place the renewal in Q3 while the board report pushes it into Q4.</p>
              </button>

              <div className="rounded-[1.5rem] border border-white/10 bg-[#111218]/60 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-blue-300" />
                  <p className="text-sm text-white">What&apos;s happening?</p>
                </div>
                <h3 className="mt-3 text-xl font-normal leading-tight text-white">{insightCopy.headline}</h3>
                <div className="mt-3 space-y-2 text-xs leading-5 text-zinc-400">
                  <p><span className="text-blue-300">Signal:</span> {insightCopy.trend}</p>
                  <p><span className="text-amber-300">Risk:</span> {insightCopy.risk}</p>
                  <p><span className="text-white">Opportunity:</span> {insightCopy.opportunity}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-[#111218]/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white">Source records</p>
                  <span className="text-xs text-zinc-500">{selectedMetric}</span>
                </div>
                <div className="mt-3 max-h-[180px] overflow-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-zinc-800/80">
                      {drillRows.length ? drillRows.map((row) => (
                        <tr key={row.transaction_id} onClick={() => setSelectedRecordId(row.transaction_id)} className={`cursor-pointer transition hover:bg-white/5 ${selectedRecord.transaction_id === row.transaction_id ? 'bg-white/10' : ''}`}>
                          <td className="px-3 py-2 text-zinc-400">{row.transaction_id}</td>
                          <td className="px-3 py-2 text-white">{row.department}</td>
                          <td className="px-3 py-2 text-right text-zinc-300">{formatCurrency(row.revenue || row.expense)}</td>
                        </tr>
                      )) : (
                        <tr><td className="px-3 py-6 text-center text-zinc-500" colSpan={3}>No records match this view.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className={`mt-3 rounded-2xl border p-3 ${selectedRecord.status === 'conflict' ? 'border-amber-500/30 bg-amber-500/10' : 'border-blue-400/20 bg-blue-500/10'}`}>
                  <p className="text-xs text-white">{selectedRecord.transaction_id} / {selectedRecord.source_file} / {getSourceLine(selectedRecord)}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    {formatCurrency(selectedRecord.revenue)} revenue - {formatCurrency(selectedRecord.expense)} expense = {formatCurrency(selectedRecord.revenue - selectedRecord.expense)} net.
                  </p>
                  <button onClick={() => openSourceFile(selectedRecord.source_file)} className="mt-3 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-blue-300/50 hover:text-white">
                    Open source records
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </section>

      <section id="verify" className="relative mx-auto max-w-7xl px-6 py-24 md:px-12 lg:py-32">
        <motion.div {...reveal()} className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="eyebrow">Verify</p>
            <h2 className="mt-5 text-4xl font-normal leading-[1.05] text-white md:text-6xl">
              Every insight opens into evidence.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
              Click a claim and BizLens shows the files, records, and calculation logic behind it.
            </p>
            <div className="mt-8 grid gap-3">
              {novaRetail.claims.map((claim) => {
                const isSelected = selectedClaim.id === claim.id
                const isChecking = isSelected && verificationState === 'checking'
                const isComplete = isSelected && verificationState !== 'idle' && verificationState !== 'checking'

                return (
                <button key={claim.id} disabled={isChecking} onClick={() => runVerification(claim)} className={`rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-75 ${isSelected ? 'border-white bg-white text-black' : 'border-white/10 bg-[#111218]/70 text-white hover:border-blue-400/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-normal">{claim.label}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${isSelected ? 'border-black/10 text-zinc-700' : claim.status === 'conflict' ? 'border-amber-400/20 text-amber-300' : 'border-blue-400/20 text-blue-300'}`}>
                      {isChecking && <Loader2 className="size-3 animate-spin" />}
                      {isComplete && <CheckCircle2 className="size-3" />}
                      {isChecking ? 'Checking' : `${claim.confidence}%`}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>{claim.detail}</p>
                </button>
              )})}
            </div>
          </div>

          <motion.div layout className="rounded-[2rem] border border-white/10 bg-[#101116]/70 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <p className="text-sm text-zinc-500">Evidence trail</p>
                <h3 className="mt-1 text-3xl font-normal text-white">{selectedClaim.label}</h3>
                <p className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${verificationState === 'checking' ? 'border-blue-400/30 text-blue-300' : verificationState === 'conflict' ? 'border-amber-400/30 text-amber-300' : 'border-emerald-400/30 text-emerald-300'}`}>
                  {verificationState === 'checking' && <Loader2 className="size-3 animate-spin" />}
                  {verificationState === 'verified' && <CheckCircle2 className="size-3" />}
                  {verificationState === 'conflict' && <AlertTriangle className="size-3" />}
                  {verificationState === 'checking' ? 'Verifying against sources' : verificationState === 'conflict' ? 'Conflict requires review' : 'Verified against evidence'}
                </p>
              </div>
              <button disabled={verificationState === 'checking'} onClick={() => setShowEvidence((current) => !current)} className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-wait disabled:opacity-50">
                {showEvidence ? 'Collapse' : 'Open'} evidence
              </button>
            </div>

            {showEvidence && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className={`rounded-[1.5rem] border p-5 ${selectedClaim.status === 'conflict' ? 'border-amber-500/30 bg-amber-500/10' : 'border-blue-400/20 bg-blue-500/10'}`}>
                  <p className="text-sm text-zinc-400">Claim value</p>
                  <p className="mt-3 text-5xl font-normal text-white">{selectedClaim.value}</p>
                  <p className="mt-4 text-sm leading-6 text-zinc-300">{selectedClaim.detail}</p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-[#0c0d11]/70 p-5">
                  <p className="text-sm text-white">Source records</p>
                  <div className="mt-4 space-y-2">
                    {selectedClaim.evidence.map((item) => (
                      <button key={item} onClick={() => openSourceFile(item.includes('crm') ? 'crm_export_q3.csv' : item.includes('audit') ? 'ai_audit_log.csv' : 'q3_finance_ledger.csv')} className="flex w-full items-center gap-3 rounded-full border border-white/10 bg-[#111218]/70 px-4 py-3 text-left transition hover:border-blue-300/50">
                        <CheckCircle2 className={`size-4 ${selectedClaim.status === 'conflict' ? 'text-amber-300' : 'text-blue-300'}`} />
                        <span className="text-sm text-zinc-300">{item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <pre className="max-h-56 overflow-auto rounded-[1.5rem] border border-white/10 bg-black/35 p-5 text-xs leading-6 text-zinc-400 lg:col-span-2">
                  {sourcePreview}
                </pre>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </section>

      <section id="copilot" className="relative border-y border-zinc-900 bg-[#0a0a0b] px-6 py-24 md:px-12 lg:py-32">
        <motion.div {...reveal()} className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="eyebrow">Ask</p>
            <h2 className="mt-5 text-4xl font-normal leading-[1.05] text-white md:text-6xl">
              Ask the question behind the number.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
              Copilot answers in business language, then points back to verified records instead of vague summaries.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#101116]/70 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
              <span className="grid size-11 place-items-center rounded-full bg-white text-black"><MessageCircle className="size-5" /></span>
              <div>
                <p className="text-xl font-normal text-white">BizLens Copilot</p>
                <p className="text-sm text-zinc-500">Grounded in the filtered dashboard and evidence trail</p>
              </div>
            </div>

            <div className="min-h-40 py-8">
              <p className="text-2xl font-normal leading-9 text-white">{answer}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {questions.map((item) => (
                <button key={item} onClick={() => { setQuestion(item); setAnswer(copilotAnswers[item]) }} className={`rounded-full border px-5 py-2.5 text-sm transition hover:-translate-y-0.5 ${question === item ? 'border-white bg-white text-black' : 'border-white/10 bg-[#0c0d11]/70 text-zinc-300 hover:border-blue-400/50'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="architecture" className="relative mx-auto max-w-7xl px-6 py-24 md:px-12 lg:py-32">
        <motion.div {...reveal()} className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="eyebrow">System Architecture</p>
            <h2 className="mt-5 text-4xl font-normal leading-[1.05] text-white md:text-6xl">
              A cleaner path from file systems to decisions.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
              The architecture stays visible without becoming the product. Each layer supports traceability, confidence, and fast drill-down.
            </p>
            <a href="#dashboard" className="mt-8 inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-white transition hover:bg-zinc-900">
              Return to workspace <ChevronRight className="size-4" />
            </a>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#101116]/60 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: 'Source layer', body: 'CSV, XLSX, PDFs, CRM exports, and board documents enter with durable lineage.' },
                { title: 'Semantic layer', body: 'Dates, departments, categories, and business definitions are normalized into a single model.' },
                { title: 'Verification layer', body: 'Claims are checked against records, conflicting files, and calculation logic before display.' },
                { title: 'Decision layer', body: 'Copilot and briefs translate verified evidence into business actions.' },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-[#0c0d11]/55 p-5">
                  <p className="text-xl text-white">{item.title}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-full border border-blue-400/20 bg-blue-500/10 px-5 py-3 text-sm text-blue-100/80">
              <ShieldCheck className="size-4 text-blue-300" />
              Upload / Parse / Understand / Analyze / Verify / Ask / Decide
            </div>
          </div>
        </motion.div>
      </section>

      <section id="decide" className="relative mx-auto max-w-7xl px-6 py-24 md:px-12 lg:py-32">
        <motion.div {...reveal()} className="rounded-[2rem] border border-white/10 bg-[#101116]/70 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.42)] md:p-10">
          <p className="eyebrow">Decide</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {[
              { label: 'Signal', value: insightCopy.trend, icon: Sparkles },
              { label: 'Risk', value: insightCopy.risk, icon: AlertTriangle },
              { label: 'Action', value: 'Approve expansion planning, hold the flagged renewal out of Q3 forecast, and review the largest cost center before reallocating budget.', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-[#0c0d11]/60 p-6">
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-blue-300" />
                    <p className="text-sm uppercase text-zinc-500">{item.label}</p>
                  </div>
                  <p className="mt-8 text-2xl font-normal leading-9 text-white">{item.value}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      </section>

      <section className="relative px-6 pb-28 pt-10 md:px-12">
        <motion.div {...reveal()} className="mx-auto max-w-5xl text-center">
          <p className="eyebrow">Start making decisions</p>
          <h2 className="mt-5 text-5xl font-normal leading-[1.02] text-white md:text-7xl">
            Move from static reporting to verified intelligence.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Upload the files, inspect the evidence, ask the follow-up, and leave with a defensible business decision.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#upload" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-black transition hover:-translate-y-0.5 hover:bg-zinc-200">
              Start making decisions <ChevronRight className="size-4" />
            </a>
            <a href="#dashboard" className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-7 py-3 text-white transition hover:-translate-y-0.5 hover:bg-zinc-900">
              Explore dashboard
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
