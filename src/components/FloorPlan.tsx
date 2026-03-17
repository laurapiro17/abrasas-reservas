'use client'

import { useState } from 'react'
import { Users, Clock, Info } from 'lucide-react'

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

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  // Check if a table is occupied at the selected time (with a 90 min window)
  const getTableStatus = (tableId: string) => {
    const selMins = timeToMinutes(selectedTime)
    const activeRes = reservations.find(r => {
      if (r.table_id !== tableId) return false
      if (['cancelled', 'no_show'].includes(r.status)) return false
      
      const resMins = timeToMinutes(r.reservation_time)
      // Assume 90 mins duration for visual check
      return selMins >= resMins && selMins < resMins + 90
    })

    return activeRes
  }

  // Generate times for the selector (13:00 - 16:00 and 20:00 - 23:30)
  const times = [
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-brand" />
          <span className="text-sm font-medium text-zinc-300">Select Time to View Occupancy:</span>
          <select 
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-brand"
          >
            {times.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
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

      <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl p-8 min-h-[500px] overflow-auto flex items-center justify-center">
        {/* The "Floor" grid */}
        <div className="relative w-[800px] h-[400px] border border-zinc-800/30 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] rounded-xl shadow-inner">
          
          {tables.map(table => {
            const reservation = getTableStatus(table.id)
            const isOccupied = !!reservation

            return (
              <div 
                key={table.id}
                className={`absolute transition-all duration-500 group cursor-help
                  ${isOccupied 
                    ? 'bg-orange-500/10 border-orange-500/40 shadow-[0_0_15px_-5px_#f97316]' 
                    : 'bg-green-500/5 border-zinc-800 hover:border-green-500/40 hover:bg-green-500/5'}
                  border-2 rounded-2xl flex flex-col items-center justify-center
                `}
                style={{ 
                  left: `${(table.x_pos || 0) * 1.5}px`, 
                  top: `${(table.y_pos || 0) * 1.5}px`,
                  width: '70px',
                  height: '70px'
                }}
              >
                <span className={`text-xs font-bold ${isOccupied ? 'text-orange-400' : 'text-zinc-500'}`}>
                  {table.name}
                </span>
                <span className="text-[10px] text-zinc-600">({table.capacity})</span>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-2xl">
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
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
        <Info className="w-5 h-5 text-orange-400 shrink-0" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          <strong>Ajusta tu mapa:</strong> Puedes cambiar la posici&oacute;n de las mesas (X e Y) desde **Ajustes**. 
          Valores m&aacute;s altos mueven la mesa a la derecha y abajo.
        </p>
      </div>
    </div>
  )
}
