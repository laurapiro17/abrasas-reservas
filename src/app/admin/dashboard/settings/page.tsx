import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Clock, Users, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import { updateService, updateTable, createTable, deleteTable, updateRestaurant } from './actions'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const serviceClient = createServiceClient()

  // Fetch Restaurant Info
  const { data: restaurant } = await serviceClient
    .from('restaurants')
    .select('*')
    .eq('id', RESTAURANT_ID)
    .single()
  // Fetch Services
  const { data: services } = await serviceClient
    .from('services')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('type', { ascending: true })

  // Fetch Tables
  const { data: tables } = await serviceClient
    .from('restaurant_tables')
    .select('*')
    .eq('restaurant_id', RESTAURANT_ID)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Restaurant Settings</h1>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-12">
        
        {/* Restaurant Info Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Restaurant Info</h2>
              <p className="text-sm text-zinc-500">Manage your business name and contact info.</p>
            </div>
          </div>

          <form action={updateRestaurant} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Restaurant Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={restaurant?.name} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">WhatsApp Phone (34600111222)</label>
                <input 
                  type="text" 
                  name="phone_contact" 
                  defaultValue={restaurant?.phone_contact || ''} 
                  placeholder="34..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-t border-zinc-900 mt-2">
              <input 
                type="checkbox" 
                name="is_monday_closed" 
                id="is_monday_closed"
                defaultChecked={restaurant?.is_monday_closed}
                className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
              />
              <label htmlFor="is_monday_closed" className="text-sm text-zinc-300">Cerrado los Lunes (Active closure)</label>
            </div>

            <button type="submit" className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
              <Save className="w-4 h-4" />
              Update Info
            </button>
          </form>
        </section>

        {/* Services Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Service Hours</h2>
              <p className="text-sm text-zinc-500">Configure opening times and reservation duration.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services?.map((service) => (
              <form key={service.id} action={updateService} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <input type="hidden" name="id" value={service.id} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">{service.type}</h3>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Activo</label>
                    <input 
                      type="checkbox" 
                      name="is_active" 
                      defaultChecked={service.is_active}
                      className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-brand focus:ring-brand"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Start</label>
                    <input 
                      type="time" 
                      name="start_time" 
                      defaultValue={service.start_time.slice(0, 5)} 
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider">End</label>
                    <input 
                      type="time" 
                      name="end_time" 
                      defaultValue={service.end_time.slice(0, 5)} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Duration (minutes)</label>
                  <input 
                    type="number" 
                    name="duration_minutes" 
                    defaultValue={service.duration_minutes} 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-2 rounded-lg text-sm transition-colors">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </form>
            ))}
          </div>
        </section>

        {/* Tables Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tables Configuration</h2>
                <p className="text-sm text-zinc-500">Add or edit tables and their seating capacity.</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/50 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Table Name</th>
                  <th className="px-6 py-3 font-medium">Capacity</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {tables?.map((table) => (
                  <tr key={table.id} className="group">
                    <td className="px-6 py-3">
                      <form id={`table-form-${table.id}`} action={updateTable} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={table.id} />
                        <input 
                          type="text" 
                          name="name" 
                          defaultValue={table.name} 
                          className="bg-transparent border-none p-0 focus:ring-0 w-24 font-medium text-white"
                        />
                      </form>
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        form={`table-form-${table.id}`}
                        type="number" 
                        name="capacity" 
                        defaultValue={table.capacity} 
                        className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 w-16 focus:ring-1 focus:ring-brand outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button form={`table-form-${table.id}`} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                          <Save className="w-4 h-4" />
                        </button>
                        <form action={async () => {
                          'use server';
                          await deleteTable(table.id)
                        }}>
                          <button className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Add New Table Row */}
                <tr className="bg-zinc-900/20">
                  <td className="px-6 py-4" colSpan={3}>
                    <form action={createTable} className="flex items-center gap-4">
                      <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
                        <Plus className="w-4 h-4 text-zinc-500" />
                        <input 
                          name="name" 
                          placeholder="New table name (e.g. T9)" 
                          className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm"
                          required
                        />
                      </div>
                      <div className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
                        <input 
                          type="number" 
                          name="capacity" 
                          placeholder="Cap" 
                          className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm"
                          required
                        />
                      </div>
                      <button type="submit" className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                        Add Table
                      </button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  )
}
