import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: Save or Update RSVP with case-insensitive duplicate handling
export async function POST(request: Request) {
  try {
    const { guests } = await request.json();

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json({ error: "No guest data provided" }, { status: 400 });
    }

    // 1. Check for case-insensitive duplicates *within* the incoming submission payload itself
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

    // 2. Check database for existing records case-insensitively using .ilike and lowercase email matching
    for (const g of guests) {
      const firstName = g.firstName?.trim();
      const lastName = g.lastName?.trim();
      const email = g.email?.trim();

      if (firstName && lastName && email) {
        const { data: existingRsvp } = await supabase
          .from('rsvp_list')
          .select('*')
          .ilike('first_name', firstName)
          .ilike('last_name', lastName)
          .ilike('email', email)
          .maybeSingle();

        if (existingRsvp) {
          return NextResponse.json(
            { 
              error: `An RSVP for ${firstName} ${lastName} (${email}) already exists in our system (regardless of capitalization). Please use the lookup tool below to search and edit your existing response instead of creating a duplicate.` 
            }, 
            { status: 409 }
          );
        }
      }
    }

    const payload = guests.map((g: any) => ({
      first_name: g.firstName.trim(),
      last_name: g.lastName.trim(),
      email: g.email.trim(),
      attending: g.attending,
      dietary_requirements: g.dietary || null,
    }));

    const { data, error } = await supabase.from('rsvp_list').insert(payload).select();

    if (error) {
      console.error("Supabase insert error:", error);
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