import { createServiceClient } from '@/lib/supabase/server'
import { format, addDays } from 'date-fns'
import Link from 'next/link'
import { ChevronLeft, MessageSquare, Calendar, Users, Clock } from 'lucide-react'
import { formatWhatsAppLink, getReminderMessage } from '@/lib/whatsapp-utils'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const serviceClient = createServiceClient()

  const { data: reservations, error } = await serviceClient
    .from('reservations')
    .select('*, restaurant_tables(name)')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('reservation_date', tomorrow)
    .eq('status', 'confirmed')
    .order('reservation_time', { ascending: true })

  if (error) {
    console.error("Error fetching tomorrow's reservations:", error)
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/dashboard" className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-brand">Recordatorios de Mañana</h1>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <p className="text-zinc-400 text-sm mb-6">
            Aquí tienes todas las reservas **confirmadas** para mañana. Envía el mensaje de recordatorio a cada cliente para confirmar su asistencia y evitar mesas vacías.
          </p>

          <div className="space-y-4">
            {reservations?.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                No hay reservas confirmadas para mañana todavía.
              </div>
            ) : (
              reservations?.map((res) => (
                <div key={res.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-zinc-700 transition-colors shadow-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-white font-bold text-lg">{res.customer_name}</span>
                       <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-xs font-mono">
                         {res.reservation_time.slice(0, 5)}h
                       </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {res.party_size} pax
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {res.restaurant_tables?.name || 'Mesa?'}
                      </div>
                      <div className="text-zinc-400 font-medium">
                        {res.customer_phone}
                      </div>
                    </div>
                  </div>
                  
                  <a 
                    href={formatWhatsAppLink(res.customer_phone, getReminderMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-brand/10 hover:shadow-brand/20 active:scale-95"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Enviar Recordatorio
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-brand/5 border border-brand/20 p-6 rounded-3xl">
           <h3 className="text-brand font-bold mb-2 flex items-center gap-2">
             <Clock className="w-4 h-4" /> Consejo de eficiencia
           </h3>
           <p className="text-zinc-400 text-sm leading-relaxed">
             Te recomendamos enviar estos mensajes **mañana por la mañana** (alrededor de las 10:00 - 11:00) para que los clientes tengan fresco el plan del día. ¡Si cancelan temprano, tendrás tiempo de reasignar la mesa!
           </p>
        </div>
      </main>
    </div>
  )
}
