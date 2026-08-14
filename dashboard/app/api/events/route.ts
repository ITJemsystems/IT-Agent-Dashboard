import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase"

// ==============================================================
// GET /api/events
// ==============================================================
// Retorna os eventos da tabela "agent_events", com filtros
// opcionais via query string. Esta e a UNICA rota que consulta a
// tabela - o navegador nunca fala com o Supabase diretamente.
//
// Filtros aceitos (todos opcionais):
//   environment    -> "production" | "staging"
//   application    -> nome exato do app (ex: "Microsoft Teams")
//   function_name  -> categoria/"tipo de evento" (ex: "APPLICATIONS")
//   status         -> ex: "ERROR", "RESOLVED", "SUCCESS"
//   username       -> busca parcial (case-insensitive)
//   date_from      -> ISO 8601, filtra occurred_at >= date_from
//   date_to        -> ISO 8601, filtra occurred_at <= date_to
//   limit          -> maximo de linhas (default 100, teto 500)
//
// SEGURANCA: exige sessao valida (login Microsoft). O middleware
// ja protege esta rota, mas a checagem e repetida aqui de proposito
// - defesa em profundidade, caso o middleware seja contornado.
// ==============================================================
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const environment = searchParams.get("environment")
  const application = searchParams.get("application")
  const functionName = searchParams.get("function_name")
  const status = searchParams.get("status")
  const username = searchParams.get("username")
  const dateFrom = searchParams.get("date_from")
  const dateTo = searchParams.get("date_to")
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 500)

  try {
    const supabase = getSupabaseServerClient()

    let query = supabase
      .from("agent_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(limit)

    if (environment) query = query.eq("environment", environment)
    if (application) query = query.eq("application", application)
    if (functionName) query = query.eq("function_name", functionName)
    if (status) query = query.eq("status", status)
    if (username) query = query.ilike("username", `%${username}%`)
    if (dateFrom) query = query.gte("occurred_at", dateFrom)
    if (dateTo) query = query.lte("occurred_at", dateTo)

    const { data, error } = await query

    if (error) {
      console.error("agent_events query failed:", error.message)
      return NextResponse.json({ error: "Query failed" }, { status: 500 })
    }

    return NextResponse.json({ events: data ?? [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
