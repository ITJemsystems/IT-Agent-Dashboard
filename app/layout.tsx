import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Agent IT - Dashboard",
  description: "Painel interno de acompanhamento do Agent IT - JEM Systems",
  robots: {
    // Nunca deixa buscadores indexarem essa dashboard - ela contem
    // dados internos e ja e protegida por login, mas isso evita
    // que a URL apareca em resultados de busca por engano
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  )
}
