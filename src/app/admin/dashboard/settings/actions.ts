'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export async function updateService(formData: FormData) {
  const supabase = await createClient()
  
  const id = formData.get('id') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string
  const duration = parseInt(formData.get('duration_minutes') as string)

  const { error } = await supabase
    .from('services')
    .update({ 
      start_time: startTime, 
      end_time: endTime, 
      duration_minutes: duration 
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/dashboard/settings')
}

export async function updateTable(formData: FormData) {
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('restaurant_tables')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/dashboard/settings')
}
