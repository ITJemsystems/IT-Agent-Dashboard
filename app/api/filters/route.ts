import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSupabaseServerClient } from "@/lib/supabase"

// ==============================================================
// GET /api/filters
// ==============================================================
// Retorna os valores unicos existentes hoje na tabela, para montar
// os dropdowns de filtro (aplicacao, tipo de evento, status) sem
// precisar hardcodar uma lista fixa no frontend - se um app novo
// for adicionado ao Agent IT (como o ClickUp foi), ele aparece
// aqui automaticamente assim que o primeiro evento dele chegar.
// ==============================================================
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseServerClient()

    const [appsResult, funcsResult, statusResult] = await Promise.all([
      supabase.from("agent_events").select("application").not("application", "is", null).limit(5000),
      supabase.from("agent_events").select("function_name").limit(5000),
      supabase.from("agent_events").select("status").limit(5000),
    ])

    const applications = Array.from(
      new Set((appsResult.data ?? []).map((r) => r.application as string))
    ).sort()

    const functionNames = Array.from(
      new Set((funcsResult.data ?? []).map((r) => r.function_name as string))
    ).sort()

    const statuses = Array.from(
      new Set((statusResult.data ?? []).map((r) => r.status as string))
    ).sort()

    return NextResponse.json({
      applications,
      function_names: functionNames,
      statuses,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
