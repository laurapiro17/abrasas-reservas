-- ABRASAS BLANES Reservation System Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Enums
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'no_show', 'completed');
CREATE TYPE service_type AS ENUM ('lunch', 'dinner');

-- 1. Restaurants
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone_contact TEXT,
    max_party_size INT DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tables
CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, name)
);

-- 3. Services (e.g. Lunch from 13:00 to 16:00, Dinner from 20:00 to 23:30)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    type service_type NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 120, -- Default duration for reservations in this service
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, type)
);

-- 4. Reservations
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INT NOT NULL,
    duration_minutes INT NOT NULL,
    status reservation_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure a table is not double-booked for the same time using a PostgreSQL Exclusion Constraint
-- Requires btree_gist extension. It guarantees server-side atomicity against overbooking.
ALTER TABLE reservations 
ADD CONSTRAINT prevent_double_booking 
EXCLUDE USING gist (
    table_id WITH =,
    tsrange(
        reservation_date + reservation_time,
        reservation_date + reservation_time + (duration_minutes * interval '1 minute')
    ) WITH &&
) WHERE (status IN ('pending', 'confirmed'));


-- 5. Profiles (Admin Roles)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Settings (Minimal for now, as API routes using service_role will handle logic)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow read access to public for basic info
CREATE POLICY "Public can read restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public can read active tables" ON restaurant_tables FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = true);

-- Reservations read logic:
-- Ideally public should only see anonymized availability, not rows. 
-- In our Next.js app, we will use Supabase Service Role key in API routes to calculate availability, 
-- thus bypassing RLS for the availability check logic, ensuring customer data is not exposed to the browser.

-- Seed initial data for ABRASAS BLANES
INSERT INTO restaurants (id, name, max_party_size)
VALUES ('00000000-0000-0000-0000-000000000001', 'ABRASAS BLANES', 8)
ON CONFLICT DO NOTHING;

-- Seed tables (Example capacities)
INSERT INTO restaurant_tables (restaurant_id, name, capacity) VALUES 
('00000000-0000-0000-0000-000000000001', 'T1', 2),
('00000000-0000-0000-0000-000000000001', 'T2', 2),
('00000000-0000-0000-0000-000000000001', 'T3', 4),
('00000000-0000-0000-0000-000000000001', 'T4', 4),
('00000000-0000-0000-0000-000000000001', 'T5', 4),
('00000000-0000-0000-0000-000000000001', 'T6', 6),
('00000000-0000-0000-0000-000000000001', 'T7', 6),
('00000000-0000-0000-0000-000000000001', 'T8', 8);

-- Seed services
INSERT INTO services (restaurant_id, type, start_time, end_time, duration_minutes) VALUES
('00000000-0000-0000-0000-000000000001', 'lunch', '13:00', '16:00', 90),
('00000000-0000-0000-0000-000000000001', 'dinner', '20:00', '23:30', 120);

