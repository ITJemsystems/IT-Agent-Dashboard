import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase"

// ==============================================================
// GET /api/stats
// ==============================================================
// Calcula "aplicacao mais usada" respeitando os mesmos filtros de
// ambiente/data da tela principal. Agregacao feita aqui no servidor
// (nao no navegador) - busca ate 5000 eventos que batem com o
// filtro e conta por aplicacao. Suficiente para o volume de um
// time de TI interno; se o volume crescer muito no futuro, isso
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

    let query = supabase
      .from("agent_events")
      .select("application")
      .not("application", "is", null)
      .limit(5000)

    if (environment) query = query.eq("environment", environment)
    if (dateFrom) query = query.gte("occurred_at", dateFrom)
    if (dateTo) query = query.lte("occurred_at", dateTo)

    const { data, error } = await query

    if (error) {
      console.error("stats query failed:", error.message)
      return NextResponse.json({ error: "Query failed" }, { status: 500 })
    }

    const counts = new Map<string, number>()
    for (const row of data ?? []) {
      const app = row.application as string
      counts.set(app, (counts.get(app) ?? 0) + 1)
    }

    const topApplications = Array.from(counts.entries())
      .map(([application, count]) => ({ application, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return NextResponse.json({ topApplications })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
