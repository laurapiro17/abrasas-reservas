import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { format } from "date-fns";

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const partySizeStr = searchParams.get("partySize");

    if (!date || !partySizeStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const partySize = parseInt(partySizeStr, 10);
    const supabase = await createServiceClient();

    // 1. Fetch available active tables big enough for the party
    const { data: tables, error: tablesError } = await supabase
      .from("restaurant_tables")
      .select("id, capacity")
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("is_active", true)
      .gte("capacity", partySize);

    if (tablesError) throw tablesError;
    if (!tables || tables.length === 0) {
      return NextResponse.json({ availableTimes: [] });
    }

    // 1. Check if the restaurant is closed on Mondays
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('is_monday_closed')
      .eq('id', RESTAURANT_ID)
      .single()

    const dayOfWeek = new Date(date).getDay() // 0 = Sunday, 1 = Monday, ...
    if (dayOfWeek === 1 && restaurant?.is_monday_closed) {
      return NextResponse.json({ availableTimes: [] })
    }

    // 2. Fetch active services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('is_active', true)
      .eq("is_active", true);

    if (servicesError) throw servicesError;
    if (!services || services.length === 0) {
      return NextResponse.json({ availableTimes: [] });

    // 3. Fetch current reservations for that date to check overlaps
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select("table_id, reservation_time, duration_minutes")
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("reservation_date", date)
      .in("status", ["pending", "confirmed"]);

    if (reservationsError) throw reservationsError;

    // Helper: check if a specific table is free at `testTimeMins` for `durationMins`
    const isTableFree = (tableId: string, testTimeMins: number, durationMins: number) => {
      const reqStart = testTimeMins;
      const reqEnd = reqStart + durationMins;

      // Check against all existing reservations for this table
      const overlaps = reservations?.some((res) => {
        if (res.table_id !== tableId) return false;
        const resStart = timeToMinutes(res.reservation_time);
        const resEnd = resStart + res.duration_minutes;
        // overlap condition: request starts before reservation ends AND request ends after reservation starts
        return reqStart < resEnd && reqEnd > resStart;
      });

      return !overlaps; // true if NO overlaps
    };

    const availableSlots: string[] = [];
    const now = new Date();
    const isToday = date === format(now, "yyyy-MM-dd");
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // 4. Generate slots every 30 minutes for each service
    for (const service of services) {
      const startMins = timeToMinutes(service.start_time);
      const endMins = timeToMinutes(service.end_time);

      // Last seating must allow for the full duration before closing
      for (let t = startMins; t <= endMins - service.duration_minutes; t += 30) {
        // If it's today, don't show slots that have already passed (plus a 30 min buffer)
        if (isToday && t < currentMins + 15) continue;
        // Is there at least one table that is free at this time?
        const hasFreeTable = tables.some((table) => isTableFree(table.id, t, service.duration_minutes));
        
        if (hasFreeTable) {
          availableSlots.push(minutesToTime(t));
        }
      }
    }

    // 5. Sort times (though they should already be mostly sorted) and remove duplicates if any overlap occurred in bad service setup
    const uniqueSortedSlots = Array.from(new Set(availableSlots)).sort();

    return NextResponse.json({ availableTimes: uniqueSortedSlots });
  } catch (error: any) {
    console.error("Availability Error:", error);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
