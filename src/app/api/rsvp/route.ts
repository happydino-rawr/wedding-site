import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: Save (Insert) or Update existing RSVPs
export async function POST(request: Request) {
  try {
    const { guests } = await request.json();

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json({ error: "No guest data provided" }, { status: 400 });
    }

    // 1. Check for duplicate guests within the incoming array payload
    const seen = new Set();
    for (const g of guests) {
      const firstName = g.firstName?.trim().toLowerCase() || '';
      const lastName = g.lastName?.trim().toLowerCase() || '';
      const email = g.email?.trim().toLowerCase() || '';
      
      const identifier = `${firstName}_${lastName}_${email}`;
      if (seen.has(identifier)) {
        return NextResponse.json(
          { error: `Duplicate entry found in your list for ${g.firstName} ${g.lastName}. Each guest must be unique.` },
          { status: 400 }
        );
      }
      seen.add(identifier);
    }

    // 2. Check for collisions against OTHER existing database records
    for (const g of guests) {
      const firstName = g.firstName?.trim();
      const lastName = g.lastName?.trim();
      const email = g.email?.trim();

      if (firstName && lastName && email) {
        let query = supabase
          .from('rsvp_list')
          .select('*')
          .ilike('first_name', firstName)
          .ilike('last_name', lastName)
          .ilike('email', email);

        // If the guest object has a numeric/UUID ID, exclude itself from the duplicate check (so editing works!)
        if (g.id && typeof g.id !== 'string') {
          query = query.neq('id', g.id);
        }

        const { data: existingRsvps, error: searchError } = await query;

        if (searchError) {
          console.error("Supabase search error:", searchError);
          return NextResponse.json({ error: searchError.message }, { status: 500 });
        }

        // If a match belongs to ANOTHER record in the DB, block it as a duplicate
        if (existingRsvps && existingRsvps.length > 0) {
          return NextResponse.json(
            { 
              error: `An RSVP for ${firstName} ${lastName} (${email}) already exists in our system. Please use the lookup tool below to search and edit your existing response.` 
            }, 
            { status: 409 }
          );
        }
      }
    }

    // 3. Upsert (Update existing records if ID exists, or Insert new ones)
    const payload = guests.map((g: any) => {
      const record: any = {
        first_name: g.firstName.trim(),
        last_name: g.lastName.trim(),
        email: g.email.trim(),
        attending: g.attending,
        dietary_requirements: g.attending === 'Declining' ? null : (g.dietary?.trim() || null),
      };

      // Only pass ID if it's a valid existing database primary key (e.g. UUID or integer ID from GET lookup)
      if (g.id && typeof g.id === 'number' && g.id < 1000000000000) {
        record.id = g.id;
      }

      return record;
    });

    const { data, error } = await supabase
      .from('rsvp_list')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const formattedData = data.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email || '',
      attending: row.attending,
      dietary: row.dietary_requirements || '',
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: Look up guest by name case-insensitively
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get('firstName');
  const lastName = searchParams.get('lastName');

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Missing name parameters" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('rsvp_list')
      .select('*')
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim());

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    const formattedGuests = data.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email || '',
      attending: row.attending,
      dietary: row.dietary_requirements || '',
    }));

    return NextResponse.json({ found: true, guests: formattedGuests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}