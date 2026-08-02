import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: Save or Update RSVP
export async function POST(request: Request) {
  try {
    const { guests } = await request.json();
    
    const payload = guests.map((g: any) => ({
      first_name: g.firstName.trim(),
      last_name: g.lastName.trim(),
      email: g.email.trim(), // Included email field
      attending: g.attending,
      dietary_requirements: g.dietary || null,
    }));

    const { data, error } = await supabase.from('rsvp_list').insert(payload).select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: Look up guest by name
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
      email: row.email || '', // Mapped email field
      attending: row.attending,
      dietary: row.dietary_requirements || '',
    }));

    return NextResponse.json({ found: true, guests: formattedGuests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}