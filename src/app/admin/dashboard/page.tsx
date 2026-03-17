export const revalidate = 0; // Disable full route caching for the dashboard

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, Check } from 'lucide-react'
import { format } from 'date-fns'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { date?: string }
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

  // Fetch reservations for the selected date
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*, restaurant_tables(name)')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('reservation_date', selectedDate)
    .order('reservation_time', { ascending: true })

  if (error) {
    console.error("Error fetching reservations:", error)
  }

  // Calculate metrics
  const totalReservations = reservations?.length || 0;
  const totalCovers = reservations?.filter(r => r.status !== 'cancelled' && r.status !== 'no_show').reduce((sum, r) => sum + r.party_size, 0) || 0;

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      {/* Top Nav */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight">ABRASAS <span className="text-brand">Admin</span></h1>
        
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-zinc-400 hidden sm:inline-block">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors text-zinc-300">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Date Selector & Metrics */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-400 font-medium">Select Date</label>
            <form className="relative flex items-center">
              <Calendar className="absolute left-3 w-5 h-5 text-zinc-500" />
              <input 
                type="date" 
                name="date"
                defaultValue={selectedDate}
                onChange={(e) => e.target.form?.submit()}
                className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand"
                style={{ colorScheme: "dark" }}
              />
            </form>
          </div>

          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-w-[140px] flex-1">
              <p className="text-sm text-zinc-500 font-medium mb-1 flex items-center gap-2"><Calendar className="w-4 h-4"/> Bookings</p>
              <p className="text-3xl font-bold">{totalReservations}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-w-[140px] flex-1">
              <p className="text-sm text-zinc-500 font-medium mb-1 flex items-center gap-2"><Users className="w-4 h-4 text-brand"/> Covers</p>
              <p className="text-3xl font-bold text-brand">{totalCovers}</p>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Reservations for {format(new Date(selectedDate), 'MMMM d, yyyy')}</h2>
            <Link
              href="/admin/dashboard/new"
              className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Reservation
            </Link>
          </div>
          
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
                              const sb = await createClient()
                              await sb.from('reservations').update({ status: 'confirmed' }).eq('id', res.id)
                            }}>
                              <button title="Confirm" className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-md transition-colors">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </form>
                          )}
                          {(res.status === 'pending' || res.status === 'confirmed') && (
                            <form action={async () => {
                              'use server';
                              const sb = await createClient()
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
                              const sb = await createClient()
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
                              const sb = await createClient()
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
