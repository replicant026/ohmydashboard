import { useState, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Search,
  User,
  Bot,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react'
import type { Session, SessionMessage } from '../../types/opencode'
import {
  formatTimeAgo,
  getAgentColor,
  getAgentChartColor,
  truncateId,
} from '../../lib/utils'

interface SessionTableProps {
  sessions: Session[]
  loading: boolean
}

const multiValueFilter: FilterFn<Session> = (row, columnId, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true
  const agents = row.getValue<string[]>(columnId)
  return filterValue.some((v) => agents.includes(v))
}

const columnHelper = createColumnHelper<Session>()

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (!sorted) return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
  if (sorted === 'asc') return <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
  return <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
}

export default function SessionTable({ sessions, loading }: SessionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updated', desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [agentFilterOpen, setAgentFilterOpen] = useState(false)

  // Collect all unique agents for the filter dropdown
  const allAgents = useMemo(() => {
    const set = new Set<string>()
    sessions.forEach((s) => s.agents.forEach((a) => set.add(a)))
    return Array.from(set).sort()
  }, [sessions])

  // Get selected agents from column filter
  const selectedAgents = useMemo(() => {
    const filter = columnFilters.find((f) => f.id === 'agents')
    return (filter?.value as string[]) || []
  }, [columnFilters])

  const toggleAgent = useCallback(
    (agent: string) => {
      setColumnFilters((prev) => {
        const existing = prev.find((f) => f.id === 'agents')
        const current = (existing?.value as string[]) || []
        const next = current.includes(agent)
          ? current.filter((a) => a !== agent)
          : [...current, agent]
        const without = prev.filter((f) => f.id !== 'agents')
        if (next.length === 0) return without
        return [...without, { id: 'agents', value: next }]
      })
    },
    []
  )

  const clearAgentFilter = useCallback(() => {
    setColumnFilters((prev) => prev.filter((f) => f.id !== 'agents'))
  }, [])

  const toggleExpand = useCallback(async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setMessages([])
      return
    }
    setExpandedId(id)
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/sessions/${id}/messages`)
      const data = await res.json()
      setMessages(data)
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [expandedId])

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'expand',
        size: 32,
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(row.original.id)
            }}
            className="p-1 hover:bg-zinc-700 rounded transition-colors"
          >
            {expandedId === row.original.id ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        ),
      }),
      columnHelper.accessor('title', {
        header: 'Session',
        size: 300,
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-200 truncate max-w-[280px]">
                {s.title || truncateId(s.id, 16)}
              </div>
              <div className="text-xs text-zinc-500 truncate max-w-[280px]">
                {s.directory.replace(/^\/Users\/[^/]+/, '~')}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('agents', {
        header: 'Agents',
        size: 200,
        filterFn: multiValueFilter,
        cell: ({ getValue }) => (
          <div className="flex flex-wrap gap-1">
            {getValue().map((agent) => {
              const color = getAgentColor(agent)
              return (
                <span
                  key={agent}
                  className={`text-xs px-1.5 py-0.5 rounded ${color}`}
                >
                  {agent}
                </span>
              )
            })}
          </div>
        ),
      }),
      columnHelper.accessor('messageCount', {
        header: 'Messages',
        size: 90,
        cell: ({ getValue }) => (
          <span className="text-sm text-zinc-300 tabular-nums">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.time.updated, {
        id: 'updated',
        header: 'Last Active',
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm text-zinc-400">
            {formatTimeAgo(getValue())}
          </span>
        ),
      }),
    ],
    [expandedId, toggleExpand]
  )

  const table = useReactTable({
    data: sessions,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-zinc-800 rounded w-1/3" />
          <div className="h-8 bg-zinc-800 rounded" />
          <div className="h-8 bg-zinc-800 rounded" />
          <div className="h-8 bg-zinc-800 rounded" />
          <div className="h-8 bg-zinc-800 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-zinc-100">
            Sessions
            <span className="text-sm font-normal text-zinc-500 ml-2">
              {table.getFilteredRowModel().rows.length} of {sessions.length}
            </span>
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Global search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 pr-8 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-56"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Agent filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setAgentFilterOpen(!agentFilterOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  selectedAgents.length > 0
                    ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Agents
                {selectedAgents.length > 0 && (
                  <span className="bg-emerald-600 text-white text-xs px-1.5 rounded-full">
                    {selectedAgents.length}
                  </span>
                )}
              </button>

              {agentFilterOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-2 min-w-[180px]">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs text-zinc-400 font-medium">
                      Filter by agent
                    </span>
                    {selectedAgents.length > 0 && (
                      <button
                        onClick={clearAgentFilter}
                        className="text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
                    {allAgents.map((agent) => {
                      const selected = selectedAgents.includes(agent)
                      return (
                        <button
                          key={agent}
                          onClick={() => toggleAgent(agent)}
                          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-left text-sm transition-colors ${
                            selected
                              ? 'bg-zinc-700 text-zinc-100'
                              : 'text-zinc-300 hover:bg-zinc-700/50'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                              selected
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-zinc-600'
                            }`}
                          >
                            {selected && (
                              <svg
                                className="w-2 h-2 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getAgentChartColor(agent) }}
                          />
                          {agent}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Click-outside to close */}
              {agentFilterOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAgentFilterOpen(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {(selectedAgents.length > 0 || globalFilter) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-zinc-500">Active filters:</span>
            {globalFilter && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-300">
                Search: "{globalFilter}"
                <button
                  onClick={() => setGlobalFilter('')}
                  className="hover:text-zinc-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedAgents.map((agent) => {
              const color = getAgentColor(agent)
              return (
                <span
                  key={agent}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${color}`}
                >
                  {agent}
                  <button
                    onClick={() => toggleAgent(agent)}
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
            <button
              onClick={() => {
                setGlobalFilter('')
                clearAgentFilter()
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <SortIcon
                          sorted={header.column.getIsSorted()}
                        />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-zinc-500"
                >
                  No sessions found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <SessionRow
                  key={row.original.id}
                  row={row}
                  expandedId={expandedId}
                  messages={messages}
                  loadingMessages={loadingMessages}
                  onToggleExpand={toggleExpand}
                  colSpan={columns.length}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-400 mr-2">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Separated row component to avoid re-rendering entire table on expand
function SessionRow({
  row,
  expandedId,
  messages,
  loadingMessages,
  onToggleExpand,
  colSpan,
}: {
  row: ReturnType<ReturnType<typeof useReactTable<Session>>['getRowModel']>['rows'][0]
  expandedId: string | null
  messages: SessionMessage[]
  loadingMessages: boolean
  onToggleExpand: (id: string) => void
  colSpan: number
}) {
  const isExpanded = expandedId === row.original.id

  return (
    <>
      <tr
        className={`border-b border-zinc-800/50 cursor-pointer transition-colors ${
          isExpanded
            ? 'bg-zinc-800/50'
            : 'hover:bg-zinc-800/30'
        }`}
        onClick={() => onToggleExpand(row.original.id)}
      >
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} className="px-4 py-3">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>

      {/* Expanded messages panel */}
      {isExpanded && (
        <tr>
          <td colSpan={colSpan} className="px-4 py-0">
            <div className="py-3 pl-8 border-l-2 border-emerald-600/30 ml-4 my-2">
              {loadingMessages ? (
                <div className="flex items-center gap-2 text-sm text-zinc-500 py-4">
                  <div className="w-4 h-4 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4">
                  No messages found
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      ) : (
                        <Bot className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-zinc-300">
                            {msg.role === 'user'
                              ? 'You'
                              : msg.agent || 'Assistant'}
                          </span>
                          {msg.model && (
                            <span className="text-xs text-zinc-500">
                              {msg.model}
                            </span>
                          )}
                          <span className="text-xs text-zinc-600">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-zinc-400 mt-0.5 line-clamp-3">
                          {msg.content || '(no content)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
