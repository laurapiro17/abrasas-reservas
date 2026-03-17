import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const RESTAURANT_ID = "00000000-0000-0000-0000-000000000001";

function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, time, partySize, name, phone, email, notes } = body;

    if (!date || !time || !partySize || !name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const reqMins = timeToMinutes(time);

    // 1. Fetch active service for this time to get duration
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("is_active", true);

    if (servicesError) throw servicesError;

    let applicableService = null;
    for (const s of (services || [])) {
      const sStart = timeToMinutes(s.start_time);
      const sEnd = timeToMinutes(s.end_time);
      // Valid if requested time is between start_time and (end_time - duration)
      if (reqMins >= sStart && reqMins <= sEnd - s.duration_minutes) {
        applicableService = s;
        break;
      }
    }

    if (!applicableService) {
      return NextResponse.json({ error: "Selected time is outside of operational service hours" }, { status: 400 });
    }

    const duration = applicableService.duration_minutes;

    // 2. Fetch tables big enough, sort by capacity ASC to efficiently pack the restaurant
    const { data: tables, error: tablesError } = await supabase
      .from("restaurant_tables")
      .select("id, capacity")
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("is_active", true)
      .gte("capacity", partySize)
      .order("capacity", { ascending: true });

    if (tablesError) throw tablesError;
    if (!tables || tables.length === 0) {
      return NextResponse.json({ error: "No tables available for this party size" }, { status: 400 });
    }

    // 3. Try to book each table sequentially. The database EXCLUSION CONSTRAINT guarantees no double booking.
    for (const table of tables) {
      const { data, error } = await supabase
        .from("reservations")
        .insert({
          restaurant_id: RESTAURANT_ID,
          table_id: table.id,
          customer_name: name,
          customer_phone: phone,
          customer_email: email || null,
          reservation_date: date,
          reservation_time: time,
          party_size: partySize,
          duration_minutes: duration,
          notes: notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        // '23P04' is PostgreSQL Exclusion Constraint Violation
        if (error.code === '23P04' || error.message?.includes('prevent_double_booking')) {
          console.log(`Table ${table.id} was concurrently booked or unavailable. Trying next...`);
          continue;
        }
        // If it's another type of error, throw it
        throw error;
      }

      // Success!
      return NextResponse.json({ success: true, reservation: data });
    }

    // If loop finishes, no tables were available
    return NextResponse.json({ error: "No tables available for the selected time" }, { status: 409 });

  } catch (error: any) {
    console.error("Reservation Error:", error);
    return NextResponse.json({ error: "Failed to process reservation" }, { status: 500 });
  }
}
