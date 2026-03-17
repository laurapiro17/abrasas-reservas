export const revalidate = 0; // Disable full route caching for the dashboard

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, Check, Settings, Printer, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import AdminDateSelector from '@/components/AdminDateSelector'
import { toggleClosedDay } from './actions'
import PrintButton from '@/components/PrintButton'
import FloorPlan from '@/components/FloorPlan'
import CalendarView from '@/components/CalendarView'
import { LayoutList, Map as MapIcon, Calendar as CalendarIconView, MessageSquare } from 'lucide-react'
import { startOfMonth, endOfMonth, startOfDay } from 'date-fns'
import { formatWhatsAppLink, getConfirmationMessage, getReminderMessage, getRejectionMessage } from '@/lib/whatsapp-utils'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

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

  // Allow filtering by date, default to today
  // Await searchParams before using it in Next 15+
  const resolvedParams = await searchParams;
  const selectedDate = resolvedParams?.date || format(new Date(), 'yyyy-MM-dd')
  const view = resolvedParams?.view || 'list'

  // Fetch reservations for the selected date
  const serviceClient = createServiceClient()
  
  // Fetch Restaurant Info (Selecting * to avoid crash if is_monday_closed is missing)
  const { data: restaurant } = await serviceClient
    .from('restaurants')
    .select('*')
    .eq('id', RESTAURANT_ID)
    .single()

  // Fetch closures for the selected date
  const { data: closedDay } = await serviceClient
    .from('closed_days')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('closed_date', selectedDate)
    .single()

  const dayOfWeek = new Date(selectedDate).getDay() // 0 = Sunday, 1 = Monday, ...
  const isMonday = dayOfWeek === 1
  const ruleSaysClosed = isMonday && restaurant?.is_monday_closed

  // If record exists, it overrides the rule.
  // If no record, we follow the rule.
  const isDayClosed = closedDay ? closedDay.is_closed : ruleSaysClosed

  // Fetch reservations
  // If in calendar view, fetch the whole month, otherwise just the selected day
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

  if (error) {
    console.error("Error fetching reservations:", error)
  }

  // Fetch all tables for the floor plan
  const { data: tables } = await serviceClient
    .from('restaurant_tables')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Calculate metrics
  const totalReservations = reservations?.length || 0;
  const totalCovers = reservations?.filter(r => r.status !== 'cancelled' && r.status !== 'no_show').reduce((sum, r) => sum + r.party_size, 0) || 0;

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
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight">ABRASAS <span className="text-brand">Admin</span></h1>
        
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-zinc-400 hidden sm:inline-block">{user.email}</span>
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/dashboard/reminders" 
              className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all relative"
              title="Recordatorios"
            >
              <MessageSquare className="w-5 h-5" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border-2 border-zinc-950" />
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
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Analytics</span>
            </Link>
            <Link 
              href="/admin/dashboard/customers"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">History</span>
            </Link>
            <Link 
              href="/admin/dashboard/settings"
              className="settings-btn flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Settings</span>
            </Link>
            <form action="/auth/signout" method="post">
              <button 
                type="submit"
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all text-xs font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

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
              <p className="text-sm text-zinc-500 font-medium mb-1">Status</p>
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

        {/* Reservations List */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <h2 className="text-lg font-semibold">Reservations for {format(new Date(selectedDate), 'MMMM d, yyyy')}</h2>
               <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 scale-90 sm:scale-100">
                  <Link 
                    href={`/admin/dashboard?date=${selectedDate}&view=list`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-brand text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <LayoutList className="w-4 h-4" /> List
                  </Link>
                   <Link 
                    href={`/admin/dashboard?date=${selectedDate}&view=map`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'map' ? 'bg-brand text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <MapIcon className="w-4 h-4" /> Map
                  </Link>
                  <Link 
                    href={`/admin/dashboard?date=${selectedDate}&view=calendar`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'calendar' ? 'bg-brand text-white' : 'text-zinc-500 hover:text-white'}`}
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
                New Reservation
              </Link>
            </div>
          </div>
          
          {view === 'map' ? (
            <div className="p-6">
               <FloorPlan tables={tables || []} reservations={reservations || []} />
            </div>
          ) : view === 'calendar' ? (
            <div className="p-6">
              <CalendarView 
                reservations={reservations || []} 
                onDateSelect={async (date) => {
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
                  <th className="px-6 py-4 font-medium">Party Size</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {reservations?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No reservations found for this date.
                    </td>
                  </tr>
                ) : (
                  reservations?.map((res) => (
                    <tr key={res.id} className="hover:bg-zinc-900/30 transition-colors group">
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
                        <p className="text-zinc-500 text-xs">{res.customer_phone}</p>
                        {res.notes && (
                          <p className="text-brand text-xs mt-1 max-w-[200px] truncate" title={res.notes}>
                            "{res.notes}"
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Users className="w-4 h-4 text-zinc-500" />
                          <span>{res.party_size}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={res.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* Status Toggle Actions */}
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {res.status === 'pending' && (
                            <form action={async () => {
                              'use server';
                              const sb = createServiceClient()
                              await sb.from('reservations').update({ status: 'confirmed' }).eq('id', res.id)
                            }}>
                              <button title="Confirm" className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-md transition-colors">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                          {res.status === 'pending' && (
                             <a 
                               href={formatWhatsAppLink(res.customer_phone, getConfirmationMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                               target="_blank"
                               rel="noopener noreferrer"
                               title="Confirm & WhatsApp"
                               className="p-1.5 bg-brand/10 text-brand hover:bg-brand/20 rounded-md transition-colors"
                             >
                               <MessageSquare className="w-4 h-4" />
                             </a>
                          )}
                          {res.status === 'confirmed' && (
                             <a 
                               href={formatWhatsAppLink(res.customer_phone, getReminderMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                               target="_blank"
                               rel="noopener noreferrer"
                               title="Send Reminder WhatsApp"
                               className="p-1.5 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 rounded-md transition-colors"
                             >
                               <MessageSquare className="w-4 h-4" />
                             </a>
                          )}
                          {res.status === 'cancelled' && (
                             <a 
                               href={formatWhatsAppLink(res.customer_phone, getRejectionMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                               target="_blank"
                               rel="noopener noreferrer"
                               title="Send Rejection WhatsApp"
                               className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                             >
                               <MessageSquare className="w-4 h-4" />
                             </a>
                          )}
                          {(res.status === 'pending' || res.status === 'confirmed') && (
                            <form action={async () => {
                              'use server';
                              const sb = createServiceClient()
                              await sb.from('reservations').update({ status: 'no_show' }).eq('id', res.id)
                            }}>
                              <button title="Mark No Show" className="p-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 rounded-md transition-colors">
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                           {(res.status === 'pending' || res.status === 'confirmed') && (
                            <form action={async () => {
                              'use server';
                              const sb = createServiceClient()
                              await sb.from('reservations').update({ status: 'cancelled' }).eq('id', res.id)
                            }}>
                              <button title="Cancel" className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                          {res.status === 'confirmed' && (
                            <form action={async () => {
                              'use server';
                              const sb = createServiceClient()
                              await sb.from('reservations').update({ status: 'completed' }).eq('id', res.id)
                            }}>
                              <button title="Mark Completed" className="p-1.5 bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 rounded-md transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                            </form>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    no_show: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    completed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  }
  
  const className = styles[status] || styles.pending;

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border capitalize inline-flex items-center ${className}`}>
      {status.replace('_', '-')}
    </span>
  )
}
