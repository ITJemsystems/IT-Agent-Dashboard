export { default } from "next-auth/middleware"

// ==============================================================
// PROTECAO GLOBAL DE ROTAS
// ==============================================================
// Qualquer pagina/rota nao listada na excecao abaixo exige sessao
// valida (login Microsoft) antes de carregar. Isso e a PRIMEIRA
// camada de defesa - a segunda camada esta em cada API route
// (app/api/events/route.ts, etc.), que tambem confere a sessao de
// forma independente, para o caso de o middleware falhar ou ser
// contornado por algum motivo (defesa em profundidade).
// ==============================================================
export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
}
