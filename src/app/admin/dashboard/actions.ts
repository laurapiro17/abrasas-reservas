import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export async function toggleClosedDay(date: string, currentlyClosed: boolean) {
  const supabase = createServiceClient()
  
  // Fetch Restaurant Info to know the rule
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('is_monday_closed')
    .eq('id', RESTAURANT_ID)
    .single()

  const dayOfWeek = new Date(date).getDay() // 0 = Sunday, 1 = Monday, ...
  const isMonday = dayOfWeek === 1
  const ruleSaysClosed = isMonday && restaurant?.is_monday_closed

  if (currentlyClosed) {
    // Current: Closed -> Action: Open (Abrir)
    if (ruleSaysClosed) {
      // If it's closed by rule, we need an explicit "is_closed: false" record to open it
      await supabase.from('closed_days').upsert({
        restaurant_id: RESTAURANT_ID,
        closed_date: date,
        is_closed: false
      }, { onConflict: 'restaurant_id,closed_date' })
    } else {
      // If it was closed by a manual record, just delete it to reopen
      await supabase.from('closed_days').delete().eq('restaurant_id', RESTAURANT_ID).eq('closed_date', date)
    }
  } else {
    // Current: Open -> Action: Close (Cerrar)
    if (!ruleSaysClosed) {
      // If it's open by rule, we need an explicit "is_closed: true" record to close it
      await supabase.from('closed_days').upsert({
        restaurant_id: RESTAURANT_ID,
        closed_date: date,
        is_closed: true
      }, { onConflict: 'restaurant_id,closed_date' })
    } else {
      // If it was open by a force-open record, delete it to return to rule-closed
      await supabase.from('closed_days').delete().eq('restaurant_id', RESTAURANT_ID).eq('closed_date', date)
    }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/')
}

export async function updateTablePosition(tableId: string, x: number, y: number) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from('restaurant_tables')
    .update({ x_pos: x, y_pos: y })
    .eq('id', tableId)

  if (error) {
    console.error("Error updating table position:", error)
    return { success: false, error }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}
