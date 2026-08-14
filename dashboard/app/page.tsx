import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Dashboard from "@/components/Dashboard"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userName = session.user?.name ?? session.user?.email ?? "Usuario"

  return <Dashboard userName={userName} />
}
