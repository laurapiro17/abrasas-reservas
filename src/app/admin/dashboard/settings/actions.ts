'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export async function updateRestaurant(formData: FormData) {
  const supabase = createServiceClient()
  const name = formData.get('name') as string
  const phone_contact = formData.get('phone_contact') as string
  const is_monday_closed = formData.get('is_monday_closed') === 'on'

  const { error } = await supabase
    .from('restaurants')
    .update({ name, phone_contact, is_monday_closed })
    .eq('id', RESTAURANT_ID)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/dashboard/settings')
  revalidatePath('/')
}

export async function updateService(formData: FormData) {
  const supabase = createServiceClient()
  
  const id = formData.get('id') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string
  const duration = parseInt(formData.get('duration_minutes') as string)
  const is_active = formData.get('is_active') === 'on'

  const { error } = await supabase
    .from('services')
    .update({ 
      start_time: startTime, 
      end_time: endTime, 
      duration_minutes: duration,
      is_active
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/dashboard/settings')
}

export async function updateTable(formData: FormData) {
  const supabase = createServiceClient()
  
  const id = formData.get('id') as string
  const capacity = parseInt(formData.get('capacity') as string)
  const name = formData.get('name') as string

  const { error } = await supabase
    .from('restaurant_tables')
    .update({ capacity, name })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/dashboard/settings')
}

export async function createTable(formData: FormData) {
  const supabase = createServiceClient()
  
  const name = formData.get('name') as string
  const capacity = parseInt(formData.get('capacity') as string)

  const { error } = await supabase
    .from('restaurant_tables')
    .insert([{ 
      restaurant_id: RESTAURANT_ID,
      name, 
      capacity 
    }])

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/dashboard/settings')
}

export async function deleteTable(id: string) {
  const supabase = await createServiceClient()
  
  const { error } = await supabase
    .from('restaurant_tables')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/dashboard/settings')
}
