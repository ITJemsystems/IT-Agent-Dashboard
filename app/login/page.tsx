"use client"

import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-sm w-full text-center shadow-xl">
        <div className="w-12 h-12 rounded-lg bg-purple-700 flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-lg">IT</span>
        </div>
        <h1 className="text-xl font-semibold text-white mb-1">Agent IT — Dashboard</h1>
        <p className="text-slate-400 text-sm mb-6">
          Acesso restrito ao time de TI da JEM Systems
        </p>
        <button
          onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Entrar com Microsoft
        </button>
      </div>
    </div>
  )
}
