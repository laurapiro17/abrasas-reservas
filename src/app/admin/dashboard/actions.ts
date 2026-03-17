import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

export async function toggleClosedDay(date: string, currentlyClosed: boolean) {
  const supabase = createServiceClient()

  if (currentlyClosed) {
    // Re-open: Delete the record
    await supabase
      .from('closed_days')
      .delete()
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('closed_date', date)
  } else {
    // Close: Add record
    await supabase
      .from('closed_days')
      .insert({
        restaurant_id: RESTAURANT_ID,
        closed_date: date,
        is_closed: true
      })
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/')
}
