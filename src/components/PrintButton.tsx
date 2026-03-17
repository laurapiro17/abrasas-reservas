'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
    >
      <Printer className="w-4 h-4" />
      <span className="hidden sm:inline">Print List</span>
    </button>
  )
}
