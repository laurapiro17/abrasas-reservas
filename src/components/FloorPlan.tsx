"use client"

import { useState, useRef, useEffect } from 'react'
import { Users, Clock, Info, Move, Check } from 'lucide-react'
import { updateTablePosition } from '@/app/admin/dashboard/actions'

interface Table {
  id: string
  name: string
  capacity: number
  x_pos: number
  y_pos: number
}

interface Reservation {
  id: string
  table_id: string
  reservation_time: string
  party_size: number
  status: string
  customer_name: string
}

export default function FloorPlan({ tables, reservations }: { tables: Table[], reservations: Reservation[] }) {
  const [selectedTime, setSelectedTime] = useState<string>('13:00')
  const [isEditMode, setIsEditMode] = useState(false)
  const [localTables, setLocalTables] = useState<Table[]>(tables)
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const floorRef = useRef<HTMLDivElement>(null)

  // Sync with props
  useEffect(() => {
    setLocalTables(tables)
  }, [tables])

  // Global listeners for dragging to make it robust
  useEffect(() => {
    if (!draggingTableId) return

    const handleGlobalMove = (clientX: number, clientY: number) => {
      if (!floorRef.current) return
      const rect = floorRef.current.getBoundingClientRect()
      
      const newX = Math.round((clientX - rect.left - dragOffset.x) / 1.5)
      const newY = Math.round((clientY - rect.top - dragOffset.y) / 1.5)

      const boundedX = Math.max(0, Math.min(newX, 480))
      const boundedY = Math.max(0, Math.min(newY, 220))

      setLocalTables(prev => prev.map(t => 
        t.id === draggingTableId ? { ...t, x_pos: boundedX, y_pos: boundedY } : t
      ))
    }

    const onMouseMove = (e: MouseEvent) => handleGlobalMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleGlobalMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const onEnd = async () => {
      const table = localTables.find(t => t.id === draggingTableId)
      if (table) {
        await updateTablePosition(table.id, table.x_pos, table.y_pos)
      }
      setDraggingTableId(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [draggingTableId, dragOffset, localTables])

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const getTableStatus = (tableId: string) => {
    const selMins = timeToMinutes(selectedTime)
    return reservations.find(r => {
      if (r.table_id !== tableId) return false
      if (['cancelled', 'no_show'].includes(r.status)) return false
      const resMins = timeToMinutes(r.reservation_time)
      return selMins >= resMins && selMins < resMins + 90
    })
  }

  const handleStart = (clientX: number, clientY: number, tableId: string) => {
    if (!isEditMode) return
    const table = localTables.find(t => t.id === tableId)
    if (!table || !floorRef.current) return

    const rect = floorRef.current.getBoundingClientRect()
    const currentX = (table.x_pos || 0) * 1.5
    const currentY = (table.y_pos || 0) * 1.5
    
    setDraggingTableId(tableId)
    setDragOffset({
      x: (clientX - rect.left) - currentX,
      y: (clientY - rect.top) - currentY
    })
  }

  const times = [
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-brand" />
            <select 
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={isEditMode}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
            >
              {times.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isEditMode 
                ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {isEditMode ? <Check className="w-4 h-4" /> : <Move className="w-4 h-4" />}
            {isEditMode ? 'GUARDAR' : 'EDITAR PLANO'}
          </button>
        </div>

        <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <span className="text-zinc-500">Libre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <span className="text-zinc-500">Ocupada</span>
          </div>
        </div>
      </div>

      {/* Map Container - Scrollable on mobile */}
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-8 min-h-[450px] overflow-x-auto overflow-y-hidden shadow-inner custom-scrollbar">
        <div 
          ref={floorRef}
          className={`relative w-[800px] h-[400px] border border-zinc-800/30 bg-[radial-gradient(#27272a_1.5px,transparent_1.5px)] [background-size:24px_24px] rounded-2xl transition-colors ${isEditMode ? 'bg-brand/[0.02] touch-none' : ''}`}
        >
          {localTables.map(table => {
            const reservation = getTableStatus(table.id)
            const isOccupied = !!reservation
            const isDragging = draggingTableId === table.id

            return (
              <div 
                key={table.id}
                onMouseDown={(e) => handleStart(e.clientX, e.clientY, table.id)}
                onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY, table.id)}
                className={`absolute select-none flex flex-col items-center justify-center rounded-2xl border-2 transition-all 
                  ${isEditMode ? 'cursor-move active:scale-110 z-30' : 'cursor-help duration-500 group'}
                  ${isOccupied && !isEditMode
                    ? 'bg-orange-500/10 border-orange-500/40 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]' 
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-brand/40 hover:bg-brand/5'}
                  ${isDragging ? 'bg-brand/20 border-brand scale-110 z-50 shadow-2xl !transition-none' : ''}
                `}
                style={{ 
                  left: `${(table.x_pos || 0) * 1.5}px`, 
                  top: `${(table.y_pos || 0) * 1.5}px`,
                  width: '70px',
                  height: '70px',
                }}
              >
                <span className={`text-xs font-black ${isDragging ? 'text-brand' : isOccupied && !isEditMode ? 'text-orange-400' : 'text-zinc-400'}`}>
                  {table.name}
                </span>
                <span className="text-[10px] text-zinc-600 font-bold">({table.capacity}p)</span>

                {!isEditMode && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-44 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-y-2 group-hover:translate-y-0 z-40 shadow-2xl">
                    <div className="text-xs font-bold text-white mb-2 flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span>Mesa {table.name}</span>
                      <span className="text-brand">{table.capacity}p</span>
                    </div>
                    {isOccupied ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[9px] font-black text-orange-400 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" /> {reservation.reservation_time.slice(0, 5)}h
                        </div>
                        <p className="text-zinc-100 text-xs font-medium truncate">{reservation.customer_name}</p>
                        <p className="text-zinc-500 text-[10px] flex items-center gap-1">
                          <Users className="w-3 h-3" /> {reservation.party_size} pers.
                        </p>
                      </div>
                    ) : (
                      <p className="text-green-500 text-[10px] uppercase font-black tracking-widest">Libre</p>
                    )}
                  </div>
                )}
                
                {isEditMode && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
                    <Move className="w-3 h-3" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="flex items-start gap-3 p-4 bg-brand/5 border border-brand/10 rounded-2xl">
        <Info className="w-5 h-5 text-brand shrink-0" />
        <div className="space-y-1">
          <p className="text-xs text-brand font-black uppercase tracking-widest">
            Editor de Plano Pro
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Pulsa **EDITAR PLANO** y arrastra las mesas. Funciona en m&oacute;vil deslizando el dedo. 
            Mueve la mesa y su&eacute;ltala para guardar su posici&oacute;n.
          </p>
        </div>
      </div>
    </div>
  )
}

