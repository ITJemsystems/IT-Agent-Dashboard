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
//
// PAGINACAO (v1.4.0):
//   page       -> pagina atual, comeca em 1 (default 1)
//   page_size  -> linhas por pagina (default 50, teto 200)
//
// FIX (v1.4.0): antes esta rota so tinha um "limit" fixo (ate 500
// linhas) sem nenhuma forma de navegar alem disso - qualquer coisa
// depois da linha 500 simplesmente nunca aparecia na tela, sem
// nenhum aviso. Trocado por paginacao de verdade via .range(), com
// a contagem total de linhas retornada (totalCount) para a
// dashboard saber quantas paginas existem e habilitar/desabilitar
// os botoes Anterior/Proxima corretamente.
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

  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.min(Math.max(Number(searchParams.get("page_size")) || 50, 1), 200)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    const supabase = getSupabaseServerClient()

    // { count: "exact" } pede ao Postgres o total de linhas que batem
    // com o filtro (sem trazer todas elas) - e o que permite calcular
    // quantas paginas existem no total.
    let query = supabase
      .from("agent_events")
      .select("*", { count: "exact" })
      .order("occurred_at", { ascending: false })
      .range(from, to)

    if (environment) query = query.eq("environment", environment)
    if (application) query = query.eq("application", application)
    if (functionName) query = query.eq("function_name", functionName)
    if (status) query = query.eq("status", status)
    if (username) query = query.ilike("username", `%${username}%`)
    if (dateFrom) query = query.gte("occurred_at", dateFrom)
    if (dateTo) query = query.lte("occurred_at", dateTo)

    const { data, error, count } = await query

    if (error) {
      console.error("agent_events query failed:", error.message)
      return NextResponse.json({ error: "Query failed" }, { status: 500 })
    }

    return NextResponse.json({
      events: data ?? [],
      totalCount: count ?? 0,
      page,
      pageSize,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
