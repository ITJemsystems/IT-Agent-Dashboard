"use client"

import { useEffect, useState, useCallback } from "react"
import { signOut } from "next-auth/react"

type AgentEvent = {
  id: number
  environment: string
  computername: string
  username: string
  function_name: string
  application: string | null
  action: string
  status: string
  details: string | null
  occurred_at: string
}

type FilterOptions = {
  applications: string[]
  function_names: string[]
  statuses: string[]
}

type TopApplication = {
  application: string
  count: number
}

// Traduz o "function_name" tecnico para um rotulo amigavel na tela
const FUNCTION_NAME_LABELS: Record<string, string> = {
  APPLICATIONS: "Reinicio de Aplicativo",
  ADMIN: "Acao Admin",
  NETWORK: "Diagnostico de Rede",
  SYSTEM: "Diagnostico / Sistema",
  USER_FEEDBACK: "Feedback do Usuario",
  TICKET: "Abertura de Ticket",
}

function statusBadgeClasses(status: string): string {
  const s = status.toUpperCase()
  if (s === "SUCCESS" || s === "RESOLVED") return "bg-emerald-900 text-emerald-300 border border-emerald-700"
  if (s === "ERROR" || s === "FAIL") return "bg-red-900 text-red-300 border border-red-700"
  if (s === "WARNING" || s === "NOT_RESOLVED") return "bg-amber-900 text-amber-300 border border-amber-700"
  return "bg-slate-800 text-slate-300 border border-slate-700"
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function Dashboard({ userName }: { userName: string }) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    applications: [],
    function_names: [],
    statuses: [],
  })
  const [topApplications, setTopApplications] = useState<TopApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado dos filtros
  const [environment, setEnvironment] = useState("")
  const [application, setApplication] = useState("")
  const [functionName, setFunctionName] = useState("")
  const [status, setStatus] = useState("")
  const [username, setUsername] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Carrega as opcoes de filtro uma vez, ao montar a tela
  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then((data) => setFilterOptions(data))
      .catch(() => {})
  }, [])

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    if (environment) params.set("environment", environment)
    if (application) params.set("application", application)
    if (functionName) params.set("function_name", functionName)
    if (status) params.set("status", status)
    if (username) params.set("username", username)
    if (dateFrom) params.set("date_from", new Date(dateFrom).toISOString())
    if (dateTo) params.set("date_to", new Date(dateTo).toISOString())
    return params.toString()
  }, [environment, application, functionName, status, username, dateFrom, dateTo])

  const loadEvents = useCallback(() => {
    setLoading(true)
    setError(null)
    const qs = buildQueryString()

    Promise.all([
      fetch(`/api/events?${qs}`).then((r) => r.json()),
      fetch(`/api/stats?${qs}`).then((r) => r.json()),
    ])
      .then(([eventsData, statsData]) => {
        if (eventsData.error) throw new Error(eventsData.error)
        setEvents(eventsData.events ?? [])
        setTopApplications(statsData.topApplications ?? [])
      })
      .catch((err) => setError(String(err.message ?? err)))
      .finally(() => setLoading(false))
  }, [buildQueryString])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const clearFilters = () => {
    setEnvironment("")
    setApplication("")
    setFunctionName("")
    setStatus("")
    setUsername("")
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Cabecalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Agent IT — Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">JEM Systems - IT Support</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Ambiente (todos)</option>
            <option value="production">Producao</option>
            <option value="staging">Staging</option>
          </select>

          <select
            value={application}
            onChange={(e) => setApplication(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Aplicacao (todas)</option>
            {filterOptions.applications.map((app) => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>

          <select
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Tipo de evento (todos)</option>
            {filterOptions.function_names.map((fn) => (
              <option key={fn} value={fn}>{FUNCTION_NAME_LABELS[fn] ?? fn}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Status (todos)</option>
            {filterOptions.statuses.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
          />

          <input
            type="datetime-local"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            title="Data inicial"
          />

          <input
            type="datetime-local"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            title="Data final"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={clearFilters}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Resumo - aplicacoes mais usadas */}
      {topApplications.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-medium text-slate-400 mb-3">Aplicacoes mais usadas (no filtro atual)</h2>
          <div className="flex flex-wrap gap-2">
            {topApplications.map((item) => (
              <div
                key={item.application}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2"
              >
                <span className="text-slate-200">{item.application}</span>
                <span className="text-purple-400 font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de eventos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {error && (
          <div className="p-4 bg-red-950 border-b border-red-800 text-red-300 text-sm">
            Erro ao carregar dados: {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Ambiente</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Aplicacao</th>
                <th className="px-4 py-3 font-medium">Tipo de Evento</th>
                <th className="px-4 py-3 font-medium">Acao</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Nenhum evento encontrado com esses filtros.
                  </td>
                </tr>
              )}
              {!loading && events.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDateTime(ev.occurred_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${ev.environment === "production" ? "bg-purple-900 text-purple-300" : "bg-amber-900 text-amber-300"}`}>
                      {ev.environment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{ev.username}</td>
                  <td className="px-4 py-3 text-slate-300">{ev.application ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{FUNCTION_NAME_LABELS[ev.function_name] ?? ev.function_name}</td>
                  <td className="px-4 py-3 text-slate-300">{ev.action}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusBadgeClasses(ev.status)}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-md truncate" title={ev.details ?? ""}>
                    {ev.details ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
