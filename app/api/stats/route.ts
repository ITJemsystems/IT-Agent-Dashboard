import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase"

// ==============================================================
// GET /api/stats
// ==============================================================
// Calcula tres coisas, todas respeitando os mesmos filtros de
// ambiente/data da tela principal:
//
//   1. topApplications  -> aplicacao mais usada (como ja existia)
//   2. usageOverview    -> usuarios unicos, quantos responderam
//                          Resolvido vs Nao Resolvido
//   3. metricTotals     -> soma de cada metrica numerica registrada
//                          (ex: total de GB liberados na limpeza de
//                          cache, total de entradas de registro
//                          removidas) - ver metric_value/metric_unit
//                          no schema (agent_events_metrics.sql)
//
// Agregacao feita aqui no servidor (nao no navegador) - busca ate
// 5000 eventos que batem com o filtro. Suficiente para o volume de
// um time de TI interno; se o volume crescer muito no futuro, isso
// pode evoluir para uma view/funcao agregada no Postgres.
// ==============================================================
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const environment = searchParams.get("environment")
  const dateFrom = searchParams.get("date_from")
  const dateTo = searchParams.get("date_to")

  try {
    const supabase = getSupabaseServerClient()

    // --- 1. Top aplicacoes ---
    let appsQuery = supabase.from("agent_events").select("application").not("application", "is", null).limit(5000)
    if (environment) appsQuery = appsQuery.eq("environment", environment)
    if (dateFrom) appsQuery = appsQuery.gte("occurred_at", dateFrom)
    if (dateTo) appsQuery = appsQuery.lte("occurred_at", dateTo)

    const { data: appsData, error: appsError } = await appsQuery
    if (appsError) throw appsError

    const appCounts = new Map<string, number>()
    for (const row of appsData ?? []) {
      const app = row.application as string
      appCounts.set(app, (appCounts.get(app) ?? 0) + 1)
    }
    const topApplications = Array.from(appCounts.entries())
      .map(([application, count]) => ({ application, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // --- 2. Visao geral de uso (usuarios unicos + resolvido/nao resolvido) ---
    let usersQuery = supabase.from("agent_events").select("username").limit(5000)
    if (environment) usersQuery = usersQuery.eq("environment", environment)
    if (dateFrom) usersQuery = usersQuery.gte("occurred_at", dateFrom)
    if (dateTo) usersQuery = usersQuery.lte("occurred_at", dateTo)

    const { data: usersData, error: usersError } = await usersQuery
    if (usersError) throw usersError

    const uniqueUsers = new Set((usersData ?? []).map((r) => r.username as string)).size

    let feedbackQuery = supabase.from("agent_events").select("status").eq("function_name", "USER_FEEDBACK").limit(5000)
    if (environment) feedbackQuery = feedbackQuery.eq("environment", environment)
    if (dateFrom) feedbackQuery = feedbackQuery.gte("occurred_at", dateFrom)
    if (dateTo) feedbackQuery = feedbackQuery.lte("occurred_at", dateTo)

    const { data: feedbackData, error: feedbackError } = await feedbackQuery
    if (feedbackError) throw feedbackError

    let resolvedCount = 0
    let notResolvedCount = 0
    for (const row of feedbackData ?? []) {
      if (row.status === "RESOLVED") resolvedCount++
      else if (row.status === "NOT_RESOLVED") notResolvedCount++
    }

    const usageOverview = { uniqueUsers, resolvedCount, notResolvedCount }

    // --- 3. Totais de metricas numericas (GB limpos, entradas removidas, etc.) ---
    let metricsQuery = supabase.from("agent_events").select("metric_value, metric_unit").not("metric_value", "is", null).limit(5000)
    if (environment) metricsQuery = metricsQuery.eq("environment", environment)
    if (dateFrom) metricsQuery = metricsQuery.gte("occurred_at", dateFrom)
    if (dateTo) metricsQuery = metricsQuery.lte("occurred_at", dateTo)

    const { data: metricsData, error: metricsError } = await metricsQuery
    if (metricsError) throw metricsError

    const metricTotalsMap = new Map<string, number>()
    for (const row of metricsData ?? []) {
      const unit = (row.metric_unit as string) ?? "unidade"
      const value = Number(row.metric_value) || 0
      metricTotalsMap.set(unit, (metricTotalsMap.get(unit) ?? 0) + value)
    }
    const metricTotals = Array.from(metricTotalsMap.entries())
      .map(([unit, total]) => ({ unit, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({ topApplications, usageOverview, metricTotals })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
