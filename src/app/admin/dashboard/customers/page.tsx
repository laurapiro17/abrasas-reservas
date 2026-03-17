import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Star, AlertTriangle, Search, Phone, Mail, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export default async function CustomersPage({ 
  searchParams 
}: { 
  searchParams: { q?: string } 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const resolvedParams = await searchParams;
  const query = resolvedParams.q || ''

  const serviceClient = createServiceClient()

  // 1. Fetch Customers
  let customersQuery = serviceClient
    .from('customers')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('name', { ascending: true })

  if (query) {
    customersQuery = customersQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
  }

  const { data: customers, error } = await customersQuery

  // If table doesn't exist yet, show a helpful message
  if (error && error.code === '42P01') {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-brand/10 border border-brand/20 rounded-full flex items-center justify-center mx-auto text-brand">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Configuración Requerida</h1>
          <p className="text-zinc-400">
            Falta crear la tabla de clientes en la base de datos. Por favor, ejecuta el script SQL proporcionado por el asistente en tu panel de Supabase.
          </p>
          <Link href="/admin/dashboard" className="inline-block px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Gestión de Clientes (CRM)</h1>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <form action="/admin/dashboard/customers" method="get">
            <input 
              type="text" 
              name="q"
              defaultValue={query}
              placeholder="Buscar por nombre o teléfono..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
            />
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers?.length === 0 ? (
            <div className="col-span-full py-20 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-3xl">
              No se han encontrado clientes.
            </div>
          ) : (
            customers?.map((customer) => (
              <div key={customer.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl group hover:border-brand/40 transition-all shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    {customer.is_vip && (
                      <span className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg" title="Cliente VIP">
                        <Star className="w-4 h-4 fill-current" />
                      </span>
                    )}
                    {customer.is_blacklisted && (
                      <span className="p-1.5 bg-red-500/10 text-red-500 rounded-lg" title="Blacklisted">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{customer.name}</h3>
                <div className="space-y-2 mb-6">
                  <p className="text-xs text-zinc-500 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> {customer.phone}
                  </p>
                  {customer.email && (
                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                      <Mail className="w-3 h-3" /> {customer.email}
                    </p>
                  )}
                </div>

                {customer.notes && (
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 mb-4">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Notas Internas</p>
                    <p className="text-xs text-zinc-300 italic">"{customer.notes}"</p>
                  </div>
                )}

                <Link 
                  href={`/admin/dashboard/customers/${customer.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Clock className="w-4 h-4" /> Ver Historial
                </Link>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
