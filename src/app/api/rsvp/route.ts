import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

function escapeSqlWildcards(str: string): string {
  return str.replace(/[%_]/g, '\\$&');
}

// GET: Exact Name Search
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawFirst = searchParams.get('firstName')?.trim();
  const rawLast = searchParams.get('lastName')?.trim();

  if (!rawFirst || !rawLast) {
    return NextResponse.json({ error: "First name and last name are required for lookup" }, { status: 400 });
  }

  const cleanFirst = escapeSqlWildcards(rawFirst);
  const cleanLast = escapeSqlWildcards(rawLast);

  try {
    const { data: matchedGuests, error: searchError } = await supabase
      .from('rsvp_list')
      .select('*')
      .ilike('first_name', cleanFirst)
      .ilike('last_name', cleanLast);

    if (searchError) throw searchError;

    if (!matchedGuests || matchedGuests.length === 0) {
      return NextResponse.json({ found: false, guests: [] }, { status: 200 });
    }

    const emails = matchedGuests.map((g) => g.email).filter(Boolean);
    let allGroupGuests = [...matchedGuests];

    if (emails.length > 0) {
      const { data: familyData, error: familyError } = await supabase
        .from('rsvp_list')
        .select('*')
        .in('email', emails);

      if (!familyError && familyData) {
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

// POST: Save or Update RSVP Entries
export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const { guests, forceCreate } = body;

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json({ error: "No guest data provided" }, { status: 400 });
    }

    // 1. Pre-deduplicate incoming payload within the same request batch
    const uniquePayloadMap = new Map<string, any>();
    for (const g of guests) {
      const cleanFirst = g.firstName?.trim() || '';
      const cleanLast = g.lastName?.trim() || '';
      const cleanEmail = g.email?.trim().toLowerCase() || '';

      if (!cleanFirst || !cleanLast || !cleanEmail) {
        return NextResponse.json(
          { error: "First name, last name, and email address are required for all guests." },
          { status: 400 }
        );
      }

      const dedupeKey = `${cleanFirst.toLowerCase()}-${cleanLast.toLowerCase()}-${cleanEmail}`;
      uniquePayloadMap.set(dedupeKey, {
        id: (g.id && typeof g.id === 'string' && g.id.trim() !== '' && g.id !== 'undefined' && g.id !== 'null') ? g.id : undefined,
        first_name: cleanFirst,
        last_name: cleanLast,
        email: cleanEmail,
        attending: g.attending,
        dietary_requirements: g.attending === 'Declining' ? null : (g.dietary?.trim() || null),
      });
    }

    const sanitizedGuests = Array.from(uniquePayloadMap.values());
    const finalPayload = [];

    // 2. Validate collisions against existing DB records
    for (const guest of sanitizedGuests) {
      let targetId = guest.id;

      // Check if another DB row already has this exact (Name + Email)
      const { data: existingIdentity } = await supabase
        .from('rsvp_list')
        .select('id, first_name, last_name, email')
        .ilike('first_name', escapeSqlWildcards(guest.first_name))
        .ilike('last_name', escapeSqlWildcards(guest.last_name))
        .ilike('email', escapeSqlWildcards(guest.email))
        .maybeSingle();

      if (existingIdentity) {
        // If editing a card whose ID differs from the DB row holding those details
        if (targetId && targetId !== existingIdentity.id && !forceCreate) {
          return NextResponse.json(
            {
              conflict: true,
              existingGuest: {
                id: existingIdentity.id,
                name: `${existingIdentity.first_name} ${existingIdentity.last_name}`,
                email: existingIdentity.email,
              },
              submittingGuest: {
                firstName: guest.first_name,
                lastName: guest.last_name,
                email: guest.email,
              },
            },
            { status: 409 }
          );
        }
        // Auto-link to existing identity ID to avoid unique constraint crash
        targetId = existingIdentity.id;
      }

      finalPayload.push({
        ...guest,
        id: targetId || crypto.randomUUID(),
      });
    }

    // 3. Perform atomic upsert on primary key ID
    const { data, error } = await supabase
      .from('rsvp_list')
      .upsert(finalPayload, { onConflict: 'id', ignoreDuplicates: false })
      .select();

    if (error) {
      console.error("Supabase Upsert Error:", error);

      // Catch unique constraint violations gracefully
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "An RSVP with this name and email combination already exists in the database." },
          { status: 409 }
        );
      }

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