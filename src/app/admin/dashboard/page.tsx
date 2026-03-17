export const revalidate = 0; // Disable full route caching for the dashboard

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Check, Settings, Printer, BarChart3, LayoutList, Map as MapIcon, Calendar as CalendarIconView, MessageSquare, Inbox, Plus, ArrowLeft } from 'lucide-react'
import { startOfMonth, endOfMonth, startOfDay, format } from 'date-fns'
import { formatWhatsAppLink, getConfirmationMessage, getReminderMessage, getRejectionMessage } from '@/lib/whatsapp-utils'
import AdminDateSelector from '@/components/AdminDateSelector'
import { toggleClosedDay } from './actions'
import PrintButton from '@/components/PrintButton'
import FloorPlan from '@/components/FloorPlan'
import CalendarView from '@/components/CalendarView'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

// Status Badge Component for the List view
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    no_show: "bg-zinc-800 text-zinc-500 border-zinc-700",
    completed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  }
  
  const className = styles[status] || styles.pending;

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${className}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { date?: string, view?: 'list' | 'map' | 'calendar' }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const resolvedParams = await searchParams;
  const selectedDate = resolvedParams?.date || format(new Date(), 'yyyy-MM-dd')
  const view = resolvedParams?.view || 'list'

  const serviceClient = createServiceClient()
  
  const { data: restaurant } = await serviceClient
    .from('restaurants')
    .select('*')
    .eq('id', RESTAURANT_ID)
    .single()

  const { data: closedDay } = await serviceClient
    .from('closed_days')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('closed_date', selectedDate)
    .single()

  const dayOfWeek = new Date(selectedDate).getDay()
  const isMonday = dayOfWeek === 1
  const ruleSaysClosed = isMonday && restaurant?.is_monday_closed
  const isDayClosed = closedDay ? closedDay.is_closed : ruleSaysClosed

  const monthStart = startOfMonth(new Date(selectedDate))
  const monthEnd = endOfMonth(new Date(selectedDate))
  
  const fetchStart = view === 'calendar' ? format(monthStart, 'yyyy-MM-dd') : selectedDate
  const fetchEnd = view === 'calendar' ? format(monthEnd, 'yyyy-MM-dd') : selectedDate

  const { data: reservations, error } = await serviceClient
    .from('reservations')
    .select('*, restaurant_tables(name)')
    .eq('restaurant_id', RESTAURANT_ID)
    .gte('reservation_date', fetchStart)
    .lte('reservation_date', fetchEnd)
    .order('reservation_time', { ascending: true })

  const { data: tables } = await serviceClient
    .from('restaurant_tables')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const totalReservations = reservations?.length || 0;
  const totalCovers = reservations?.filter(r => r.status !== 'cancelled' && r.status !== 'no_show').reduce((sum, r) => sum + r.party_size, 0) || 0;
  
  const { count: pendingCount } = await serviceClient
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('status', 'pending')

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header, .date-selector, .metrics, .actions-column, button, .new-btn, .settings-btn { display: none !important; }
          body, .min-h-screen { background: white !important; color: black !important; }
          .max-w-7xl { max-width: 100% !important; padding: 0 !important; }
          .bg-zinc-950, .bg-zinc-900 { border: none !important; background: transparent !important; }
          .text-white, .text-zinc-100 { color: black !important; }
          .text-zinc-500, .text-zinc-400 { color: #666 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border-bottom: 1px solid #eee !important; padding: 12px 6px !important; }
          .print-header { display: block !important; margin-bottom: 20px; text-align: center; }
          .print-header h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .print-header p { font-size: 14px; color: #666; }
        }
        .print-header { display: none; }
      `}} />
      
      {/* Top Nav */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <h1 className="text-xl font-bold tracking-tight">
          ABRASAS <span className="text-brand hidden sm:inline">Admin</span>
        </h1>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-3">
            <Link 
              href="/admin/dashboard/inbox" 
              className={`flex items-center gap-2 p-2 rounded-xl transition-all relative ${pendingCount && pendingCount > 0 ? 'bg-red-500/10 text-red-500 border border-red-500/20 px-3' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
              title="Buzón de Pendientes"
            >
              <Inbox className="w-5 h-5" />
              <span className="text-[10px] font-black tracking-widest hidden xs:inline uppercase">Buzón</span>
              {pendingCount && pendingCount > 0 ? (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 animate-bounce">
                  {pendingCount}
                </div>
              ) : null}
            </Link>

            <Link 
              href="/admin/dashboard/reminders" 
              className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"
              title="Recordatorios"
            >
              <MessageSquare className="w-5 h-5" />
            </Link>

            <Link 
              href="/admin/dashboard/customers" 
              className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"
              title="Clientes (CRM)"
            >
              <Users className="w-5 h-5" />
            </Link>

            <Link 
              href="/admin/dashboard/analytics"
              className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"
              title="Estadísticas"
            >
              <BarChart3 className="w-5 h-5" />
            </Link>

            <Link 
              href="/admin/dashboard/settings"
              className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"
              title="Ajustes"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800 mx-1 hidden xs:block" />

          <form action="/auth/signout" method="post">
            <button 
              type="submit"
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
      </header>
      
      {pendingCount && pendingCount > 0 ? (
        <Link href="/admin/dashboard/inbox" className="bg-red-500 text-white px-6 py-2.5 flex items-center justify-between group overflow-hidden relative z-20">
          <div className="flex items-center gap-3 text-sm font-bold relative z-10">
            <div className="bg-white/20 p-1 rounded-lg">
              <Inbox className="w-4 h-4 animate-pulse" />
            </div>
            <span>TIENES {pendingCount} RESERVAS PENDIENTES DE CONFIRMAR</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black tracking-widest relative z-10 bg-black/10 px-2 py-1 rounded-md">
            IR A GESTIONAR <ArrowLeft className="w-3 h-3 rotate-180" />
          </div>
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </Link>
      ) : null}

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        <div className="print-header">
           <h1>ABRASAS BLANES</h1>
           <p>Reservas para el d&iacute;a {format(new Date(selectedDate), 'dd/MM/yyyy')}</p>
        </div>
        
        {/* Date Selector & Metrics */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <AdminDateSelector initialDate={selectedDate} />

          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-w-[140px] flex-1">
              <p className="text-sm text-zinc-500 font-medium mb-1 flex items-center gap-2"><Calendar className="w-4 h-4"/> Bookings</p>
              <p className="text-3xl font-bold">{totalReservations}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-w-[140px] flex-1">
              <p className="text-sm text-zinc-500 font-medium mb-1 flex items-center gap-2"><Users className="w-4 h-4 text-brand"/> Covers</p>
              <p className="text-3xl font-bold text-brand">{totalCovers}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-w-[140px] flex-1 flex flex-col justify-between">
              <p className="text-sm text-zinc-500 font-medium mb-1 group-hover:scale-105 transition-all">Status</p>
              <form action={async () => {
                'use server'
                await toggleClosedDay(selectedDate, isDayClosed)
              }}>
                <button 
                  type="submit"
                  className={`w-full py-1 text-xs font-bold rounded-lg border transition-all ${
                    isDayClosed 
                      ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
                      : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                  }`}
                >
                  {isDayClosed ? 'CERRADO (Abrir)' : 'ABIERTO (Cerrar d\xEDa)'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Dash/Map Area */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <h2 className="text-lg font-semibold">Dashboard - {format(new Date(selectedDate), 'MMMM d, yyyy')}</h2>
               <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 scale-90 sm:scale-100">
                  <Link 
                    href={`/admin/dashboard?date=${selectedDate}&view=list`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <LayoutList className="w-4 h-4" /> List
                  </Link>
                  <Link 
                    href={`/admin/dashboard?date=${selectedDate}&view=map`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'map' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <MapIcon className="w-4 h-4" /> Map
                  </Link>
                  <Link 
                    href={`/admin/dashboard?date=${selectedDate}&view=calendar`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'calendar' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <CalendarIconView className="w-4 h-4" /> Calendar
                  </Link>
               </div>
            </div>
            <div className="flex items-center gap-3">
              <PrintButton />
              <Link
                href="/admin/dashboard/new"
                className="new-btn flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Reserva
              </Link>
            </div>
          </div>
          
          {view === 'map' ? (
            <div className="p-6">
               <FloorPlan 
                 tables={tables || []} 
                 reservations={reservations?.filter(r => r.status === 'confirmed' || r.status === 'completed') || []} 
               />
               <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-xs text-zinc-500 italic text-center">
                 DATO: El mapa muestra solo reservas **CONFIRMADAS**. Gestiona las pendientes desde el buz&oacute;n.
               </div>
            </div>
          ) : view === 'calendar' ? (
            <div className="p-6">
              <CalendarView 
                reservations={reservations?.filter(r => r.status === 'confirmed' || r.status === 'completed') || []} 
                onDateSelect={async (date: string) => {
                  'use server'
                  redirect(`/admin/dashboard?date=${date}&view=list`)
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Time / Table</th>
                    <th className="px-6 py-4 font-medium">Customer Details</th>
                    <th className="px-6 py-4 font-medium text-center">Inbox / Pendientes</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {reservations?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                        No hay reservas para este d&iacute;a.
                      </td>
                    </tr>
                  ) : (
                    reservations?.map((res) => (
                      <tr key={res.id} className={`hover:bg-zinc-900/30 transition-colors group ${res.status === 'pending' ? 'bg-red-500/5' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-medium text-white mb-1">
                            <Clock className="w-4 h-4 text-zinc-500" />
                            {res.reservation_time.slice(0, 5)}
                          </div>
                          <div className="text-zinc-500 text-xs font-mono bg-zinc-900 inline-block px-1.5 py-0.5 rounded border border-zinc-800">
                            {res.restaurant_tables?.name || 'Unassigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-white mb-1">{res.customer_name}</p>
                          <p className="text-zinc-500 text-xs">{res.customer_phone} ({res.party_size} cub.)</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                           {res.status === 'pending' ? (
                             <Link href="/admin/dashboard/inbox" className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] font-black uppercase tracking-tighter hover:bg-red-500/20 transition-all">
                               <Inbox className="w-3 h-3" /> Pendiente
                             </Link>
                           ) : (
                             <span className="text-zinc-700 font-mono text-[10px]">—</span>
                           )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={res.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             {res.status === 'pending' && (
                               <>
                                 <form action={async () => {
                                   'use server';
                                   const sb = createServiceClient()
                                   await sb.from('reservations').update({ status: 'confirmed' }).eq('id', res.id)
                                 }}>
                                   <button title="Confirmar en DB" className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-md transition-colors">
                                     <CheckCircle className="w-4 h-4" />
                                   </button>
                                 </form>
                                 <a 
                                   href={formatWhatsAppLink(res.customer_phone, getConfirmationMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   title="Confirmar con WhatsApp"
                                   className="p-1.5 bg-green-500 text-white hover:bg-green-600 rounded-md transition-colors shadow-lg shadow-green-500/20"
                                 >
                                   <MessageSquare className="w-4 h-4" />
                                 </a>
                               </>
                             )}

                             {res.status === 'confirmed' && (
                               <>
                                 <a 
                                   href={formatWhatsAppLink(res.customer_phone, getReminderMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   title="Recordatorio WhatsApp"
                                   className="p-1.5 bg-zinc-700 text-white hover:bg-zinc-600 rounded-md transition-colors"
                                 >
                                   <Clock className="w-4 h-4" />
                                 </a>
                                 <form action={async () => {
                                   'use server';
                                   const sb = createServiceClient()
                                   await sb.from('reservations').update({ status: 'completed' }).eq('id', res.id)
                                 }}>
                                   <button title="Completada (Sentados)" className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors">
                                     <Check className="w-4 h-4" />
                                   </button>
                                 </form>
                               </>
                             )}

                             {(res.status === 'pending' || res.status === 'confirmed') && (
                               <a 
                                 href={formatWhatsAppLink(res.customer_phone, getRejectionMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 title="Rechazar/Cancelar con WhatsApp"
                                 className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors shadow-lg shadow-red-500/20"
                               >
                                 <XCircle className="w-4 h-4" />
                               </a>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
