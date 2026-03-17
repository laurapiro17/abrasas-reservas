import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Inbox, Clock, Users, CheckCircle, MessageSquare, XCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { formatWhatsAppLink, getConfirmationMessage, getRejectionMessage } from '@/lib/whatsapp-utils'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const serviceClient = createServiceClient()

  // Fetch ALL pending reservations across all dates
  const { data: pendings, error } = await serviceClient
    .from('reservations')
    .select('*, restaurant_tables(name)')
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('status', 'pending')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black border border-zinc-800 rounded-lg flex items-center justify-center text-red-500">
            <Inbox className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Buzón de Pendientes</h1>
          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-black border border-red-500/20 rounded-full">
            {pendings?.length || 0} POR GESTIONAR
          </span>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        
        {pendings?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/50">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold">¡Todo al día!</h3>
              <p className="text-zinc-500 text-sm">No hay reservas pendientes de confirmar.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendings?.map((res) => (
              <div key={res.id} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all shadow-xl group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex flex-col items-center justify-center border border-zinc-800 group-hover:bg-brand/10 group-hover:border-brand/20 transition-colors">
                      <span className="text-[10px] font-black text-brand uppercase">{format(new Date(res.reservation_date), 'MMM', { locale: es })}</span>
                      <span className="text-lg font-black text-white leading-none">{format(new Date(res.reservation_date), 'd')}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white leading-none">{res.customer_name}</h3>
                        <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-bold text-zinc-400">
                          {res.restaurant_tables?.name || 'Mesa pendiente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand" /> {res.reservation_time.slice(0, 5)}h</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {res.party_size} cubiertos</span>
                        <span className="font-mono text-[10px] opacity-50">{res.customer_phone}</span>
                      </div>
                      {res.notes && (
                        <p className="mt-3 text-sm text-zinc-400 italic bg-zinc-900/50 p-2 rounded-xl border border-zinc-900">
                          "{res.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <form action={async () => {
                      'use server';
                      const sb = createServiceClient()
                      await sb.from('reservations').update({ status: 'confirmed' }).eq('id', res.id)
                    }}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-green-500 border border-zinc-800 rounded-xl text-xs font-bold transition-all">
                        <CheckCircle className="w-4 h-4" /> SOLO CONFIRMAR
                      </button>
                    </form>
                    
                    <a 
                      href={formatWhatsAppLink(res.customer_phone, getConfirmationMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-600/20"
                    >
                      <MessageSquare className="w-4 h-4" /> CONFIRMAR CON WHATSAPP
                    </a>

                    <a 
                      href={formatWhatsAppLink(res.customer_phone, getRejectionMessage(res.customer_name, format(new Date(res.reservation_date), 'dd/MM'), res.reservation_time.slice(0, 5)))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-zinc-900 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 border border-zinc-800 hover:border-red-500/20 rounded-xl transition-all"
                      title="Rechazar y Mandar WhatsApp"
                    >
                      <XCircle className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
