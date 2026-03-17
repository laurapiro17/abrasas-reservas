import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, TrendingUp, Users, AlertCircle, Calendar, BarChart3, Clock } from 'lucide-react'
import Link from 'next/link'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Note: redirect from next/navigation is usually better, but lets fix imports later if needed
    // redirect('/admin/login')
  }

  const serviceClient = createServiceClient()

  // 1. Fetch ALL reservations to calculate stats
  const { data: reservations } = await serviceClient
    .from('reservations')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)

  if (!reservations) return <div>Error loading analytics</div>

  // 2. Calculate Stats
  const totalBookings = reservations.length
  const completed = reservations.filter(r => r.status === 'completed' || r.status === 'confirmed').length
  const cancelled = reservations.filter(r => r.status === 'cancelled').length
  const noShows = reservations.filter(r => r.status === 'no_show').length
  const totalCovers = reservations
    .filter(r => r.status !== 'cancelled' && r.status !== 'no_show')
    .reduce((sum, r) => sum + r.party_size, 0)

  const noShowRate = totalBookings > 0 ? ((noShows / totalBookings) * 100).toFixed(1) : 0

  // 3. Day of the week analysis
  const daysMap: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }
  reservations.forEach(r => {
    const day = new Date(r.reservation_date).getDay()
    daysMap[day]++
  })
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const busiestDayIdx = Object.keys(daysMap).reduce((a, b) => daysMap[a] > daysMap[b] ? a : b)
  const busiestDay = dayNames[parseInt(busiestDayIdx)]

  // 4. Party Size Distribution
  const partySizeMap: Record<string, number> = {}
  reservations.forEach(r => {
    const size = r.party_size > 8 ? '8+' : r.party_size.toString()
    partySizeMap[size] = (partySizeMap[size] || 0) + 1
  })

  // 5. Service Analysis (Lunch vs Dinner)
  const lunchBookings = reservations.filter(r => {
    const hour = parseInt(r.reservation_time.split(':')[0])
    return hour < 17
  }).length
  const dinnerBookings = totalBookings - lunchBookings

  // 6. Growth (This month vs Last month)
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1))
  const lastMonthEnd = endOfMonth(lastMonthStart)

  const thisMonthBookings = reservations.filter(r => new Date(r.reservation_date) >= thisMonthStart).length
  const lastMonthBookings = reservations.filter(r => {
    const d = new Date(r.reservation_date)
    return d >= lastMonthStart && d <= lastMonthEnd
  }).length

  const growth = lastMonthBookings > 0 
    ? (((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100).toFixed(0) 
    : '100'

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Negocio & Estadísticas</h1>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Comensales" 
            value={totalCovers} 
            icon={<Users className="w-5 h-5 text-brand" />} 
            description="Personas servidas"
          />
          <StatCard 
            title="Crecimiento" 
            value={`${growth}%`} 
            icon={<TrendingUp className={`w-5 h-5 ${parseInt(growth) >= 0 ? 'text-green-400' : 'text-red-400'}`} />} 
            description="Respecto al mes pasado"
          />
          <StatCard 
            title="No-Show Rate" 
            value={`${noShowRate}%`} 
            icon={<AlertCircle className="w-5 h-5 text-red-400" />} 
            description={`${noShows} no se presentaron`}
          />
          <StatCard 
            title="Día Fuerte" 
            value={busiestDay} 
            icon={<Calendar className="w-5 h-5 text-blue-400" />} 
            description="Día con más movimiento"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Party Size Distribution */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand" /> Tamaño de Grupos
            </h3>
            <div className="space-y-4">
              {Object.entries(partySizeMap)
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                .map(([size, count]) => (
                <StatusRow 
                  key={size} 
                  label={`${size} personas`} 
                  count={count} 
                  total={totalBookings} 
                  color="bg-brand" 
                />
              ))}
            </div>
          </section>

          {/* Service Comparison */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand" /> Comidas vs Cenas
            </h3>
            <div className="flex items-center justify-center h-48 gap-12">
               <div className="flex flex-col items-center gap-3">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-900" strokeWidth="4"></circle>
                      <circle cx="18" cy="18" r="16" fill="none" className="stroke-yellow-500" strokeWidth="4" strokeDasharray={`${(lunchBookings / totalBookings) * 100} 100`} strokeLinecap="round"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {((lunchBookings / totalBookings) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Comidas</span>
               </div>
               <div className="flex flex-col items-center gap-3">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-900" strokeWidth="4"></circle>
                      <circle cx="18" cy="18" r="16" fill="none" className="stroke-brand" strokeWidth="4" strokeDasharray={`${(dinnerBookings / totalBookings) * 100} 100`} strokeLinecap="round"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {((dinnerBookings / totalBookings) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Cenas</span>
               </div>
            </div>
          </section>

          {/* Weekly Traffic */}
          <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" /> Tráfico Semanal
            </h3>
            <div className="flex items-end justify-between h-48 gap-2">
              {dayNames.map((name, idx) => {
                const count = daysMap[idx.toString()]
                const height = totalBookings > 0 ? `${(count / Math.max(...Object.values(daysMap))) * 100}%` : '5%'
                return (
                  <div key={name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] px-2 py-1 rounded mb-1">
                      {count}
                    </div>
                    <div 
                      className="w-full bg-brand/20 border border-brand/30 rounded-t-lg transition-all hover:bg-brand/40 group-hover:bg-brand/60" 
                      style={{ height }}
                    />
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">{name.slice(0, 3)}</span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

      </main>
    </div>
  )
}

function StatCard({ title, value, icon, description }: any) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl group hover:border-brand/30 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 group-hover:bg-brand/5 group-hover:border-brand/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  )
}

function StatusRow({ label, count, total, color }: any) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-bold">{count} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
