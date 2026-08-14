import { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

// ==============================================================
// CONFIGURACAO DE AUTENTICACAO - Login Microsoft (SSO)
// ==============================================================
// Restringe o acesso a dashboard SOMENTE a contas da organizacao
// JEM Systems no Microsoft 365 / Entra ID. Duas camadas:
//
//   1. O App Registration no Azure foi criado como "single tenant"
//      (Accounts in this organizational directory only) - contas
//      de fora do tenant nem conseguem completar o login la.
//
//   2. Callback signIn() abaixo, como defesa adicional: confere se
//      o "tid" (tenant id) do token retornado bate com o esperado,
//      mesmo que a configuracao do Azure mude no futuro. Se por
//      algum motivo o "tid" nao vier no profile, ainda confia na
//      restricao do proprio Azure (nao bloqueia sem necessidade).
// ==============================================================
export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      const expectedTenant = process.env.AZURE_AD_TENANT_ID
      const tid = (profile as { tid?: string } | undefined)?.tid

      if (tid && expectedTenant) {
        return tid === expectedTenant
      }
      return true
    },

    async session({ session }) {
      return session
    },
  },

  session: {
    strategy: "jwt",
    // 8 horas - obriga novo login apos um dia de trabalho, em vez
    // de manter a sessao valida indefinidamente
    maxAge: 8 * 60 * 60,
  },

  pages: {
    signIn: "/login",
  },
}
