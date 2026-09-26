import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side client using Service Role Key to bypass RLS policies safely
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: Look up guest by First & Last Name AND pull linked family members
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get('firstName')?.trim();
  const lastName = searchParams.get('lastName')?.trim();

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Missing name search parameters" }, { status: 400 });
  }

  try {
    // Step 1: Find guest(s) matching exact first & last name
    const { data: matchedGuests, error: searchError } = await supabase
      .from('rsvp_list')
      .select('*')
      .ilike('first_name', firstName)
      .ilike('last_name', lastName);

    if (searchError) throw searchError;

    if (!matchedGuests || matchedGuests.length === 0) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    // Step 2: Fetch any additional guests sharing the same email addresses (family members)
    const emails = matchedGuests.map((g) => g.email).filter(Boolean);
    let allGroupGuests = [...matchedGuests];

    if (emails.length > 0) {
      const { data: familyData, error: familyError } = await supabase
        .from('rsvp_list')
        .select('*')
        .in('email', emails);

      if (!familyError && familyData) {
        // Merge without duplicates by ID
        const guestMap = new Map();
        [...matchedGuests, ...familyData].forEach((g) => guestMap.set(g.id, g));
        allGroupGuests = Array.from(guestMap.values());
      }
    }

    const formattedGuests = allGroupGuests.map((row: any) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email || '',
      attending: row.attending,
      dietary: row.dietary_requirements || '',
    }));

    return NextResponse.json({ found: true, guests: formattedGuests });
  } catch (err: any) {
    console.error("GET Lookup Error:", err);
    return NextResponse.json({ error: err.message || "Failed to search RSVP" }, { status: 500 });
  }
}

// POST: Save or update RSVP records
export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const { guests } = body;

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json({ error: "No guest data provided" }, { status: 400 });
    }

    const payload = guests.map((g: any) => {
      const guestRow: Record<string, any> = {
        first_name: g.firstName?.trim(),
        last_name: g.lastName?.trim(),
        email: g.email?.trim(),
        attending: g.attending,
        dietary_requirements: g.attending === 'Declining' ? null : (g.dietary?.trim() || null),
      };

      // CRITICAL: Only attach 'id' if it's a non-empty string!
      // If it's a new entry, do NOT attach the 'id' key at all so DB uses DEFAULT gen_random_uuid()
      if (g.id && typeof g.id === 'string' && g.id.trim().length > 0 && g.id !== 'undefined') {
        guestRow.id = g.id;
      }

      return guestRow;
    });

    // Upsert using unique identity constraint
    const { data, error } = await supabase
      .from('rsvp_list')
      .upsert(payload, { 
        onConflict: 'first_name,last_name,email',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error("Supabase Upsert Error:", error);
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
    console.error("POST RSVP Error:", err);
    return NextResponse.json({ error: err.message || "Server error while saving RSVP" }, { status: 500 });
  }
}