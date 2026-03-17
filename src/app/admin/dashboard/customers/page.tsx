import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Search, User, Phone, Calendar, Hash } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const query = searchParams.q || ''
  const serviceClient = createServiceClient()

  let customers: any[] = []

  if (query) {
    // Search reservations by name or phone
    const { data } = await serviceClient
      .from('reservations')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
      .order('reservation_date', { ascending: false })
    
    customers = data || []
  }

  // Group by customer (unique phone/name) to show "profiles" roughly
  // In a real CRM we'd have a customers table, but here we derive from reservations
  const customerMap = new Map()
  customers.forEach(res => {
    const key = res.customer_phone
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        name: res.customer_name,
        phone: res.customer_phone,
        bookings: [],
        total: 0
      })
    }
    const c = customerMap.get(key)
    c.bookings.push(res)
    c.total++
  })

  const uniqueCustomers = Array.from(customerMap.values())

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Customer History</h1>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        <section className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
          <form action="" method="get" className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              name="q"
              defaultValue={query}
              placeholder="Search by name or phone number..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
            />
          </form>
        </section>

        {query && (
          <div className="space-y-6">
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
              Results for "{query}" — Found {uniqueCustomers.length} customers
            </h2>

            {uniqueCustomers.length === 0 ? (
              <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-3xl">
                <User className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500">No customers found with that name or phone.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {uniqueCustomers.map((customer) => (
                  <div key={customer.phone} className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <User className="w-5 h-5 text-brand" /> {customer.name}
                        </h3>
                        <p className="text-zinc-500 flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4" /> {customer.phone}
                        </p>
                      </div>
                      <div className="bg-brand/10 border border-brand/20 px-4 py-2 rounded-2xl">
                        <p className="text-brand text-sm font-bold">{customer.total} Total Bookings</p>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <table className="w-full text-left text-sm">
                        <thead className="text-zinc-500 border-b border-zinc-800">
                          <tr>
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Time</th>
                            <th className="pb-3 font-medium">Party</th>
                            <th className="pb-3 font-medium text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {customer.bookings.map((b: any) => (
                            <tr key={b.id}>
                              <td className="py-3 text-zinc-300">{format(new Date(b.reservation_date), 'dd/MM/yyyy')}</td>
                              <td className="py-3 text-zinc-300">{b.reservation_time.slice(0, 5)}</td>
                              <td className="py-3 text-zinc-300">{b.party_size} pers.</td>
                              <td className="py-3 text-right">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                  b.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                                  b.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                  b.status === 'no-show' ? 'bg-zinc-500/10 text-zinc-400' :
                                  'bg-orange-500/10 text-orange-500'
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-3xl">
            <Search className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">Start typing to search for customers and their history.</p>
          </div>
        )}
      </main>
    </div>
  )
}
