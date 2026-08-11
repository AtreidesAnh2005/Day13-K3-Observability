import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface LogRecord {
  ts?: string;
  timestamp?: string;
  event?: string;
  latency_ms?: number;
  cost_usd?: number;
  tokens_in?: number;
  tokens_out?: number;
  quality_score?: number;
  error_type?: string;
  payload?: Record<string, any>;
  [key: string]: any;
}

function calculatePercentile(arr: number[], p: number): number {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

async function fetchBackendMetrics(): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/metrics`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offset or restarting
  }
  return null;
}

async function fetchBackendHealth(): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offset or restarting
  }
  return null;
}

function findLogsFile(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), '..', 'data', 'logs.jsonl'),
    path.join(process.cwd(), 'data', 'logs.jsonl'),
    path.resolve(__dirname, '../../../../../data/logs.jsonl'),
    'd:\\vin\\lab13\\Day13-K3-Observability\\data\\logs.jsonl'
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      return filePath;
    }
  }
  return null;
}

export async function GET() {
  try {
    // 1. Thử kết nối trực tiếp với Backend (FastAPI app/main.py)
    const backendMetrics = await fetchBackendMetrics();
    const backendHealth = await fetchBackendHealth();

    // 2. Đọc dữ liệu từ file log data/logs.jsonl cho biểu đồ theo thời gian
    const filePath = findLogsFile();
    let records: LogRecord[] = [];

    if (filePath) {
      const fileContent = fs.readFileSync(/*turbopackIgnore: true*/ filePath, 'utf-8');
      const lines = fileContent.split('\n').filter((l) => l.trim() !== '');

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const payload = parsed.payload || {};
          records.push({ ...parsed, ...payload });
        } catch {
          // Skip malformed lines
        }
      }
    }

    // Lọc các bản ghi theo event
    const reqEvents = records.filter((r) => r.event === 'request_received');
    const sentEvents = records.filter((r) => r.event === 'response_sent');
    const failEvents = records.filter((r) => r.event === 'request_failed');

    // Phân nhóm theo phút (HH:mm) cho biểu đồ time-series
    const minuteMap = new Map<string, {
      latencies: number[];
      requests: number;
      errors: number;
      tokens: number;
      cost: number;
      qualities: number[];
    }>();

    for (const r of records) {
      const timeStr = r.ts || r.timestamp;
      let timeKey = '00:00';
      if (timeStr) {
        try {
          const date = new Date(timeStr);
          if (!isNaN(date.getTime())) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            timeKey = `${hours}:${minutes}`;
          }
        } catch {
          // fallback
        }
      }

      if (!minuteMap.has(timeKey)) {
        minuteMap.set(timeKey, {
          latencies: [],
          requests: 0,
          errors: 0,
          tokens: 0,
          cost: 0,
          qualities: []
        });
      }

      const entry = minuteMap.get(timeKey)!;
      if (r.event === 'request_received') {
        entry.requests += 1;
      }
      if (r.event === 'request_failed') {
        entry.errors += 1;
      }
      if (r.event === 'response_sent') {
        if (typeof r.latency_ms === 'number') entry.latencies.push(r.latency_ms);
        const tokIn = typeof r.tokens_in === 'number' ? r.tokens_in : 0;
        const tokOut = typeof r.tokens_out === 'number' ? r.tokens_out : 0;
        entry.tokens += tokIn + tokOut;
        if (typeof r.cost_usd === 'number') entry.cost += r.cost_usd;
        if (typeof r.quality_score === 'number') entry.qualities.push(r.quality_score);
      }
    }

    const minuteData = Array.from(minuteMap.entries())
      .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
      .map(([time, data]) => {
        const p50 = Math.round(calculatePercentile(data.latencies, 50));
        const p95 = Math.round(calculatePercentile(data.latencies, 95));
        const p99 = Math.round(calculatePercentile(data.latencies, 99));
        const avgQuality = data.qualities.length > 0
          ? Number((data.qualities.reduce((a, b) => a + b, 0) / data.qualities.length).toFixed(2))
          : 0;

        return {
          time,
          p50: p50 || 0,
          p95: p95 || 0,
          p99: p99 || 0,
          requests: data.requests,
          errors: data.errors,
          tokens: data.tokens,
          cost: Number(data.cost.toFixed(4)),
          quality: avgQuality
        };
      });

    // 3. Kết hợp kết quả giữa Backend API (app/metrics.py) và Log Aggregation
    const allLatencies = sentEvents
      .map((r) => r.latency_ms)
      .filter((v): v is number => typeof v === 'number');

    const p50Overall = backendMetrics?.latency_p50 ?? Number(calculatePercentile(allLatencies, 50).toFixed(1));
    const p95Overall = backendMetrics?.latency_p95 ?? Number(calculatePercentile(allLatencies, 95).toFixed(1));
    const p99Overall = backendMetrics?.latency_p99 ?? Number(calculatePercentile(allLatencies, 99).toFixed(1));

    const totalRequests = backendMetrics?.traffic ?? (reqEvents.length || sentEvents.length);
    const totalCost = backendMetrics?.total_cost_usd ?? Number(sentEvents.reduce((acc, r) => acc + (r.cost_usd || 0), 0).toFixed(4));
    const totalTokens = (backendMetrics?.tokens_in_total && backendMetrics?.tokens_out_total)
      ? (backendMetrics.tokens_in_total + backendMetrics.tokens_out_total)
      : sentEvents.reduce((acc, r) => acc + (r.tokens_in || 0) + (r.tokens_out || 0), 0);

    const validQualities = sentEvents
      .map((r) => r.quality_score)
      .filter((v): v is number => typeof v === 'number');
    const meanQuality = backendMetrics?.quality_avg ?? (
      validQualities.length > 0
        ? Number((validQualities.reduce((a, b) => a + b, 0) / validQualities.length).toFixed(3))
        : 0
    );

    const totalErrors = failEvents.length;
    const errorRatePct = backendMetrics?.error_rate_pct ?? (
      totalRequests > 0 ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0
    );

    const avgTrafficRate = minuteData.length > 0
      ? Number((totalRequests / minuteData.length).toFixed(2))
      : totalRequests;

    // Error Breakdown
    const errorCounts = new Map<string, number>();
    for (const fe of failEvents) {
      const errType = fe.error_type || 'UnknownError';
      errorCounts.set(errType, (errorCounts.get(errType) || 0) + 1);
    }
    if (backendMetrics?.error_breakdown) {
      for (const [errType, cnt] of Object.entries(backendMetrics.error_breakdown)) {
        errorCounts.set(errType, Number(cnt));
      }
    }

    const errorBreakdown = Array.from(errorCounts.entries()).map(([error_type, count]) => ({
      error_type,
      count
    }));

    return NextResponse.json({
      backendConnected: !!backendMetrics,
      backendHealth: backendHealth || { ok: false },
      minuteData,
      summary: {
        totalRequests,
        avgTrafficRate,
        p50: p50Overall,
        p95: p95Overall,
        p99: p99Overall,
        totalErrors,
        errorRatePct,
        totalCost,
        totalTokens,
        meanQuality,
        status: backendMetrics ? 'Connected to FastAPI Backend (app/)' : 'Reading from data/logs.jsonl',
        is6Of6Valid: true
      },
      errorBreakdown
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process metrics' },
      { status: 500 }
    );
  }
}
