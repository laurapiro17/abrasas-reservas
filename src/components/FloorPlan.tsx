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

  useEffect(() => {
    setLocalTables(tables)
  }, [tables])

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

  const times = [
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
  ]

  const handleStart = (clientX: number, clientY: number, tableId: string) => {
    if (!isEditMode) return
    const table = localTables.find(t => t.id === tableId)
    if (!table || !floorRef.current) return

    const rect = floorRef.current.getBoundingClientRect()
    // Calculate where inside the table (70x70) the user clicked
    const currentX = (table.x_pos || 0) * 1.5
    const currentY = (table.y_pos || 0) * 1.5
    const offsetX = (clientX - rect.left) - currentX
    const offsetY = (clientY - rect.top) - currentY

    setDraggingTableId(tableId)
    setDragOffset({ x: offsetX, y: offsetY })
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!draggingTableId || !floorRef.current) return

    const rect = floorRef.current.getBoundingClientRect()
    // Calculate new position using the original offset to avoid jumping
    const newX = Math.round((clientX - rect.left - dragOffset.x) / 1.5)
    const newY = Math.round((clientY - rect.top - dragOffset.y) / 1.5)

    // Constrain to grid (800x400 area / 1.5 scale - table size)
    const boundedX = Math.max(0, Math.min(newX, 480))
    const boundedY = Math.max(0, Math.min(newY, 220))

    setLocalTables(prev => prev.map(t => 
      t.id === draggingTableId ? { ...t, x_pos: boundedX, y_pos: boundedY } : t
    ))
  }

  const handleEnd = async () => {
    if (!draggingTableId) return
    const table = localTables.find(t => t.id === draggingTableId)
    if (table) {
      await updateTablePosition(table.id, table.x_pos, table.y_pos)
    }
    setDraggingTableId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-brand" />
            <span className="text-sm font-medium text-zinc-300">Occupancy at:</span>
            <select 
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={isEditMode}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
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
            {isEditMode ? 'GUARDAR PLANO' : 'EDITAR PLANO'}
          </button>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            <span className="text-zinc-400">Libre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500/50" />
            <span className="text-zinc-400">Ocupada</span>
          </div>
        </div>
      </div>

      <div 
        className={`relative bg-zinc-950 border border-zinc-800 rounded-3xl p-8 min-h-[500px] overflow-hidden flex items-center justify-center ${isEditMode ? 'cursor-crosshair bg-brand/5 touch-none' : ''}`}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
      >
        <div 
          ref={floorRef}
          className="relative w-[800px] h-[400px] border border-zinc-800/30 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] rounded-xl shadow-inner"
        >
          {localTables.map(table => {
            const reservation = getTableStatus(table.id)
            const isOccupied = !!reservation
            const isDragging = draggingTableId === table.id

            return (
              <div 
                key={table.id}
                onMouseDown={(e) => { handleStart(e.clientX, e.clientY, table.id); e.preventDefault(); }}
                onTouchStart={(e) => { handleStart(e.touches[0].clientX, e.touches[0].clientY, table.id); }}
                className={`absolute transition-all ${isEditMode ? 'cursor-move hover:scale-105 active:scale-110 z-30' : 'cursor-help duration-500 group'}
                  ${isOccupied && !isEditMode
                    ? 'bg-orange-500/10 border-orange-500/40 shadow-[0_0_15px_-5px_#f97316]' 
                    : 'bg-green-500/5 border-zinc-800 hover:border-brand/40 hover:bg-brand/5'}
                  ${isDragging ? 'bg-brand/20 border-brand scale-110 z-50' : ''}
                  border-2 rounded-2xl flex flex-col items-center justify-center select-none
                `}
                style={{ 
                  left: `${(table.x_pos || 0) * 1.5}px`, 
                  top: `${(table.y_pos || 0) * 1.5}px`,
                  width: '70px',
                  height: '70px',
                  transitionProperty: isDragging ? 'none' : 'all'
                }}
              >
                <span className={`text-xs font-bold ${isDragging ? 'text-brand' : isOccupied && !isEditMode ? 'text-orange-400' : 'text-zinc-500'}`}>
                  {table.name}
                </span>
                <span className="text-[10px] text-zinc-600">({table.capacity})</span>

                {!isEditMode && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-40 shadow-2xl">
                    <div className="text-xs font-bold text-white mb-1 flex items-center justify-between">
                      <span>Mesa {table.name}</span>
                      <span className="text-zinc-500">Cap. {table.capacity}</span>
                    </div>
                    {isOccupied ? (
                      <div className="space-y-1">
                        <p className="text-orange-400 font-bold uppercase text-[9px]">OCUPADA @ {reservation.reservation_time.slice(0, 5)}</p>
                        <p className="text-zinc-300 text-xs truncate">Cliente: {reservation.customer_name}</p>
                        <p className="text-zinc-400 text-[10px] flex items-center gap-1">
                          <Users className="w-3 h-3" /> {reservation.party_size} personas
                        </p>
                      </div>
                    ) : (
                      <p className="text-green-500 text-[10px] uppercase font-bold">Disponible</p>
                    )}
                  </div>
                )}
                
                {isEditMode && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full flex items-center justify-center text-[10px] text-white animate-pulse">
                    <Move className="w-2.5 h-2.5" />
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
          <p className="text-xs text-zinc-400 leading-relaxed font-bold text-brand">
            EDITOR TÁCTIL DE MAPA
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Pulsa **EDITAR PLANO** y arrastra las mesas. Funciona con rat&oacute;n y pantallas t&aacute;ctiles (m&oacute;viles/tablets). 
            Los cambios se guardan autom&aacute;ticamente.
          </p>
        </div>
      </div>
    </div>
  )
}
