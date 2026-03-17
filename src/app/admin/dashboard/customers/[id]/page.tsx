import { createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Calendar, Clock, Star, AlertTriangle, Phone, Mail, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export default async function CustomerDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const resolvedParams = await params;
  const customerId = resolvedParams.id

  const serviceClient = createServiceClient()

  // 1. Fetch Customer Detail
  const { data: customer, error: customerError } = await serviceClient
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (customerError || !customer) {
    notFound()
  }

  // 2. Fetch Customer History (Reservations)
  const { data: history } = await serviceClient
    .from('reservations')
    .select('*, restaurant_tables(name)')
    .eq('customer_phone', customer.phone) // Use phone as the unique identifier for history
    .order('reservation_date', { ascending: false })

  const totalVisits = history?.length || 0
  const noShows = history?.filter(r => r.status === 'no_show').length || 0
  const lastVisit = history?.[0]?.reservation_date

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/dashboard/customers" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Ficha de Cliente</h1>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl text-center shadow-xl">
              <div className="w-20 h-20 bg-brand/10 text-brand border border-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{customer.name}</h2>
              <div className="flex items-center justify-center gap-2 mb-6">
                {customer.is_vip && (
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> VIP
                  </span>
                )}
                {customer.is_blacklisted && (
                  <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Peligro
                  </span>
                )}
              </div>
              
              <div className="space-y-3 pt-6 border-t border-zinc-900">
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> {customer.phone}
                </p>
                {customer.email && (
                  <p className="text-xs text-zinc-500 flex items-center gap-2">
                    <Mail className="w-3 h-3 text-brand" /> {customer.email}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
              <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <FileText className="w-4 h-4" /> Notas Internas
              </h3>
              {customer.notes ? (
                <p className="text-sm text-zinc-300 italic leading-relaxed">"{customer.notes}"</p>
              ) : (
                <p className="text-xs text-zinc-500 italic">No hay notas sobre este cliente.</p>
              )}
            </div>
          </div>

          {/* History Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Visitas</p>
                <p className="text-2xl font-bold text-white">{totalVisits}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">No-Shows</p>
                <p className="text-2xl font-bold text-red-500">{noShows}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Última</p>
                <p className="text-xs font-bold text-zinc-300">{lastVisit ? format(new Date(lastVisit), 'dd/MM/yy') : '-'}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-brand" /> Historial de Reservas
                </h3>
              </div>
              <div className="divide-y divide-zinc-900">
                {history?.map((res) => (
                  <div key={res.id} className="p-6 hover:bg-zinc-900/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-white uppercase tracking-tighter">
                             {format(new Date(res.reservation_date), 'EEEE d MMMM yyyy')}
                           </span>
                           <span className="text-[10px] text-zinc-500 font-mono">ID: {res.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        res.status === 'completed' || res.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                        res.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                        res.status === 'no_show' ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 mt-4 opacity-70">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="w-3 h-3" /> {res.reservation_time.slice(0, 5)}h
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Users className="w-3 h-3" /> {res.party_size} pax
                      </div>
                      {res.restaurant_tables?.name && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className="font-bold text-brand text-[10px] border border-brand/30 px-1 rounded">{res.restaurant_tables.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
