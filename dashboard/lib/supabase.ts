import { createClient } from "@supabase/supabase-js"

// ==============================================================
// CLIENTE SUPABASE - SOMENTE SERVIDOR
// ==============================================================
// Usa a Service Role Key, que ignora Row Level Security (RLS).
//
// REGRA DE OURO: NUNCA importe este arquivo em um componente com
// "use client" ou em qualquer codigo que rode no navegador. Ele so
// pode ser usado dentro de API routes (app/api/**/route.ts) ou
// Server Components sem "use client" - codigo que roda
// exclusivamente no servidor da Vercel.
//
// A variavel SUPABASE_SERVICE_ROLE_KEY (sem prefixo NEXT_PUBLIC_)
// nunca e enviada ao navegador pelo Next.js - e assim que a
// protecao funciona. Combinado com a tabela "agent_events" ter
// RLS ativado e ZERO policies publicas, isso significa: mesmo que
// alguem inspecione o trafego de rede do navegador, nao ha nenhuma
// chave nem consulta direta ao Supabase visivel - tudo passa por
// aqui, atras do login Microsoft.
// ==============================================================
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurados. " +
      "Confira as variaveis de ambiente (.env.local ou Vercel)."
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
