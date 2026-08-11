'use client'

import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Clock3,
  Database,
  Gauge,
  Layers,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

const COLORS = {
  cyan: '#62e6d7',
  blue: '#78a7ff',
  amber: '#f2b56b',
  red: '#f27b82',
  violet: '#b69cff',
  grid: '#263342'
}

const chartConfig = {
  p50: { label: 'P50 (ms)', color: COLORS.cyan },
  p95: { label: 'P95 (ms)', color: COLORS.amber },
  p99: { label: 'P99 (ms)', color: COLORS.red },
  requests: { label: 'Requests', color: COLORS.blue },
  errors: { label: 'Errors', color: COLORS.red },
  tokens: { label: 'Tokens', color: COLORS.violet },
  cost: { label: 'Cost ($)', color: COLORS.amber },
  quality: { label: 'Quality Score', color: COLORS.cyan }
}

interface MetricsSummary {
  totalRequests: number
  avgTrafficRate: number
  p50: number
  p95: number
  p99: number
  totalErrors: number
  errorRatePct: number
  totalCost: number
  totalTokens: number
  meanQuality: number
  status: string
  is6Of6Valid: boolean
}

interface MinuteDataItem {
  time: string
  p50: number
  p95: number
  p99: number
  requests: number
  errors: number
  tokens: number
  cost: number
  quality: number
}

interface ErrorBreakdownItem {
  error_type: string
  count: number
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  badgeText = 'contract',
  children,
  className = ''
}: {
  title: string
  subtitle?: string
  icon: typeof Activity
  badgeText?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`panel ${className}`}>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-tight">
            <Icon className="size-4 text-primary" />
            {title}
          </CardTitle>
          {subtitle && <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{badgeText}</span>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Metric({
  label,
  value,
  delta,
  icon: Icon,
  tone = 'cyan'
}: {
  label: string
  value: string
  delta: string
  icon: typeof Activity
  tone?: 'cyan' | 'amber' | 'red' | 'violet'
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`size-4 text-${tone}`} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <strong className="font-mono text-2xl font-semibold tracking-tight">{value}</strong>
        <span className={`flex items-center gap-1 text-xs ${delta.includes('PASS') || delta.startsWith('+') ? 'text-cyan' : 'text-amber'}`}>
          {delta.startsWith('+') ? <ArrowUpRight className="size-3" /> : delta.startsWith('-') ? <ArrowDownRight className="size-3" /> : null}
          {delta}
        </span>
      </div>
    </div>
  )
}

export default function Page() {
  const [range, setRange] = useState('1h')
  const [autoRefresh, setAutoRefresh] = useState('30')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const [minuteData, setMinuteData] = useState<MinuteDataItem[]>([])
  const [errorBreakdown, setErrorBreakdown] = useState<ErrorBreakdownItem[]>([])
  const [summary, setSummary] = useState<MetricsSummary>({
    totalRequests: 0,
    avgTrafficRate: 0,
    p50: 0,
    p95: 0,
    p99: 0,
    totalErrors: 0,
    errorRatePct: 0,
    totalCost: 0,
    totalTokens: 0,
    meanQuality: 0,
    status: 'Initializing',
    is6Of6Valid: true
  })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  const fetchRealMetrics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/metrics')
      if (!res.ok) throw new Error('Failed to fetch real data metrics')
      const json = await res.json()
      if (json.minuteData) setMinuteData(json.minuteData)
      if (json.summary) setSummary(json.summary)
      if (json.errorBreakdown) setErrorBreakdown(json.errorBreakdown)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching real data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealMetrics()
  }, [])

  useEffect(() => {
    if (autoRefresh === 'off') return
    const timer = window.setInterval(() => {
      fetchRealMetrics()
    }, Number.parseInt(autoRefresh) * 1000)
    return () => window.clearInterval(timer)
  }, [autoRefresh])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="brand-mark">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-lg font-semibold tracking-tight">
                  Day 13 AI Observability Dashboard
                </h1>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  6/6 CONTRACT PANELS
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Real-time monitoring source: `data/logs.jsonl` | Contract: `config/dashboard.yaml`
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-9 w-[100px] bg-card text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last 1h (60m)</SelectItem>
                <SelectItem value="6h">Last 6h</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
              </SelectContent>
            </Select>
            <Select value={autoRefresh} onValueChange={setAutoRefresh}>
              <SelectTrigger className="h-9 w-[110px] bg-card text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Auto 15s</SelectItem>
                <SelectItem value="30">Auto 30s</SelectItem>
                <SelectItem value="60">Auto 60s</SelectItem>
                <SelectItem value="off">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 bg-card"
              onClick={fetchRealMetrics}
              disabled={loading}
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh now
            </Button>
          </div>
        </header>

        {/* Status Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="status-dot" />
            All systems operational <Separator orientation="vertical" className="mx-1 h-4" />
            <span suppressHydrationWarning>
              Updated {mounted ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="size-1.5 rounded-full bg-cyan" />
            HỢP LỆ: 6/6 panel có trong dashboard contract
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="Total Requests" value={`${summary.totalRequests}`} delta={`${summary.avgTrafficRate} req/min`} icon={Zap} />
          <Metric label="P95 Latency" value={`${summary.p95}ms`} delta={summary.p95 <= 3000 ? 'SLO PASS' : 'SLO FAIL'} icon={Clock3} tone={summary.p95 <= 3000 ? 'cyan' : 'red'} />
          <Metric label="Error Rate" value={`${summary.errorRatePct}%`} delta={summary.errorRatePct <= 2 ? 'SLO PASS' : 'SLO FAIL'} icon={AlertTriangle} tone={summary.errorRatePct <= 2 ? 'cyan' : 'red'} />
          <Metric label="Cumulative Cost" value={`$${summary.totalCost}`} delta="Target ≤ $2.5" icon={CircleDollarSign} tone="amber" />
          <Metric label="Total Tokens" value={`${summary.totalTokens}`} delta="Target ≤ 50k" icon={Layers} tone="violet" />
          <Metric label="Mean Quality" value={`${summary.meanQuality}`} delta={summary.meanQuality >= 0.75 ? 'SLO PASS' : 'SLO FAIL'} icon={ShieldCheck} tone={summary.meanQuality >= 0.75 ? 'cyan' : 'red'} />
        </div>

        {/* EXACT 6 CONTRACT PANELS (2 COLUMNS x 3 ROWS) */}
        <section className="grid gap-4 lg:grid-cols-2">
          {/* PANEL 1: Latency percentiles */}
          <Panel
            title="1. Latency percentiles"
            subtitle="Response time percentiles P50, P95, P99 (Unit: ms) | Threshold P95 ≤ 3000ms"
            icon={Clock3}
            badgeText="panel: latency"
          >
            <ChartContainer config={chartConfig} className="h-[225px] w-full">
              {minuteData.length > 0 ? (
                <LineChart data={minuteData}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} width={36} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="p50" stroke="var(--color-p50)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p95" stroke="var(--color-p95)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p99" stroke="var(--color-p99)" strokeWidth={2} dot={false} />
                  <ReferenceLine y={3000} stroke={COLORS.red} strokeDasharray="5 5" label={{ value: 'SLO P95 (3000ms)', fill: COLORS.red, fontSize: 10 }} />
                </LineChart>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No latency data in logs</div>
              )}
            </ChartContainer>
          </Panel>

          {/* PANEL 2: Request traffic */}
          <Panel
            title="2. Request traffic"
            subtitle="Incoming request count & rate per minute (Unit: requests_per_minute) | Threshold ≥ 1"
            icon={Activity}
            badgeText="panel: traffic"
          >
            <ChartContainer config={chartConfig} className="h-[225px] w-full">
              {minuteData.length > 0 ? (
                <BarChart data={minuteData}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} width={28} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="requests" fill="var(--color-requests)" radius={[2, 2, 0, 0]} />
                  <ReferenceLine y={1} stroke={COLORS.cyan} strokeDasharray="5 5" label={{ value: 'Traffic Threshold (1 req/m)', fill: COLORS.cyan, fontSize: 10 }} />
                </BarChart>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No traffic data in logs</div>
              )}
            </ChartContainer>
          </Panel>

          {/* PANEL 3: Error rate and breakdown */}
          <Panel
            title="3. Error rate and breakdown"
            subtitle="Error rate percentage & count by error_type (Unit: percent) | Threshold ≤ 2%"
            icon={AlertTriangle}
            badgeText="panel: errors"
          >
            {errorBreakdown.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[225px] w-full">
                <BarChart data={errorBreakdown}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="error_type" tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} width={28} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill={COLORS.red} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[225px] w-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-8 text-cyan" />
                <span>0.0% Error Rate — No errors recorded in selected window ✅</span>
                <span className="font-mono text-[10px] text-primary">SLO Threshold: ≤ 2.0%</span>
              </div>
            )}
          </Panel>

          {/* PANEL 4: Cost over time */}
          <Panel
            title="4. Cost over time"
            subtitle={`API cost sum by minute & total (Unit: usd) | Current: $${summary.totalCost.toFixed(4)} | Threshold ≤ $2.5`}
            icon={CircleDollarSign}
            badgeText="panel: cost"
          >
            <ChartContainer config={chartConfig} className="h-[225px] w-full">
              {minuteData.length > 0 ? (
                <AreaChart data={minuteData}>
                  <defs>
                    <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} width={36} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="cost" stroke="var(--color-cost)" fill="url(#costFill)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No cost data in logs</div>
              )}
            </ChartContainer>
          </Panel>

          {/* PANEL 5: Input and output tokens */}
          <Panel
            title="5. Input and output tokens"
            subtitle={`Total tokens_in & tokens_out sum by field (Unit: tokens) | Current: ${summary.totalTokens} | Threshold ≤ 50,000`}
            icon={Layers}
            badgeText="panel: tokens"
          >
            <ChartContainer config={chartConfig} className="h-[225px] w-full">
              {minuteData.length > 0 ? (
                <AreaChart data={minuteData}>
                  <defs>
                    <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.violet} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.violet} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} width={36} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="tokens" stroke="var(--color-tokens)" fill="url(#tokenFill)" strokeWidth={2} />
                  <ReferenceLine y={50000} stroke={COLORS.red} strokeDasharray="5 5" label={{ value: 'Token Limit 50k', fill: COLORS.red, fontSize: 10 }} />
                </AreaChart>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No token data in logs</div>
              )}
            </ChartContainer>
          </Panel>

          {/* PANEL 6: Quality proxy */}
          <Panel
            title="6. Quality proxy"
            subtitle={`Mean quality_score (Unit: score_0_to_1) | Current Mean: ${summary.meanQuality} | Threshold ≥ 0.75`}
            icon={ShieldCheck}
            badgeText="panel: quality"
          >
            <ChartContainer config={chartConfig} className="h-[225px] w-full">
              {minuteData.length > 0 ? (
                <LineChart data={minuteData}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tickLine={false} axisLine={false} tick={{ fill: '#8492a6', fontSize: 10 }} width={28} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <ReferenceLine y={0.75} stroke={COLORS.cyan} strokeDasharray="5 5" label={{ value: 'SLO Quality 0.75', fill: COLORS.cyan, fontSize: 10 }} />
                  <Line type="monotone" dataKey="quality" stroke="var(--color-quality)" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No quality data in logs</div>
              )}
            </ChartContainer>
          </Panel>
        </section>

        {/* Topology / System Status Footer */}
        <div className="mt-6 border-t border-border/70 pt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="topology-item">
              <div className="flex items-center gap-2">
                <div className="node-icon">
                  <Database className="size-4" />
                </div>
                <span className="text-sm font-medium">Log Data Source</span>
              </div>
              <span className="text-xs text-cyan">`data/logs.jsonl` · Active</span>
            </div>
            <div className="topology-item">
              <div className="flex items-center gap-2">
                <div className="node-icon">
                  <Bot className="size-4" />
                </div>
                <span className="text-sm font-medium">Dashboard Contract</span>
              </div>
              <span className="text-xs text-cyan">`config/dashboard.yaml` · Validated</span>
            </div>
            <div className="topology-item">
              <div className="flex items-center gap-2">
                <div className="node-icon">
                  <Server className="size-4" />
                </div>
                <span className="text-sm font-medium">API Endpoint</span>
              </div>
              <span className="text-xs text-cyan">`GET /api/metrics` · Operational</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
