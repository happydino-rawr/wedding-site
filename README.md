# Project README: Wedding Website & RSVP Application

Welcome to the Wedding Website & RSVP Application codebase! This project is a modern, responsive web application built with Next.js, styled with Tailwind CSS, and backed by Supabase for secure data storage. It features interactive guest management, digital photo galleries, and streamlined RSVP tracking.

---

## Getting Started

This is a Next.js project bootstrapped with `create-next-app`.

First, run the development server:

npm run dev

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

To run this application locally or deploy it to production, you must create a `.env.local` file in the root directory and configure the following variables:

``env
# Vercel Token (Automated Builds)
VERCEL_OIDC_TOKEN=your_vercel_oidc_token

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2 Media Storage
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ENDPOINT=your_r2_endpoint_url
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key

---

## Tech Stack & Architecture

* Frontend Framework: Next.js (React) utilizing the App Router architecture.
* Styling: Tailwind CSS for a custom, elegant wedding aesthetic.
* Database & Backend Services: Supabase (PostgreSQL) handling guest records and case-insensitive duplicate-checked RSVP API queries.
* Icons & UI Enhancements: lucide-react for icons and custom modals.

---

## Project Documentation & History

* Master Blueprint (REQUIREMENTS.md): For a complete breakdown of how everything works under the hood—including the expectation that users provide thorough, descriptive input (such as specific dietary needs and full contact info)—refer to the requirements file. It covers core features, strict case-insensitive duplicate protection, and edge-case QA testing.
* Changelog (CHANGELOG.md): To track recent updates, bug fixes, UI enhancements, and feature iterations over time, check out the changelog file.
* Developer & QA Ready: Designed so anyone can easily jump in, understand project rules, run comprehensive edge-case testing, and maintain the application with complete confidence.

---

## Codebase Structure & Component Breakdown

### 1. Root & Configuration Files
* app/page.tsx: The primary landing page component that orchestrates all major sections of the website (hero banner, countdown timers, itinerary, story sections, and galleries).
* app/api/rsvp/route.ts: The backend API route responsible for handling Supabase database interactions:
  * POST: Validates incoming batches, checks case-insensitive cross-user database records, and blocks duplicates returning an HTTP 409 Conflict.
  * GET: Looks up existing guest RSVPs by matching first and last names case-insensitively.

### 2. Core UI Components (src/components/ or components/)
* RsvpSheetModal.tsx: A comprehensive modal component managing the interactive guest RSVP lifecycle. It supports:
  * Multi-View State: Toggles dynamically between the primary RSVP submission form, the lookup screen, and the confirmation summary screen.
  * Dynamic Guest Management: Allows guests to add or remove family members and plus-ones dynamically.
  * Conditional Dietary Fields: Automatically reveals dietary inputs only when reception attendance is selected, clearing values if the guest declines.
  * Sticky Header & Close Controls: Features a sticky header bar containing the title and a high-positioned close button (X) to ensure seamless navigation while scrolling long forms.
  * Inline Error Handling: Displays theme-matched error banners with direct shortcuts to the lookup/edit view on conflict.
* AuthGate.tsx: Manages passcode protection or access control for private sections of the website.
* CountdownSection.tsx: Displays a live countdown timer ticking down to the wedding date.
* FadeInSection.tsx: Provides smooth scroll-triggered animation wrappers for content sections.
* FloatingActionMenu.tsx: Quick-access floating controls for navigating the site or opening primary actions (like RSVP).
* Footer.tsx: Bottom page section containing closing notes, credits, and links.
* HeroSection.tsx: The prominent introductory banner featuring the couple's names and primary event dates.
* InvitationEnvelope.tsx: An interactive digital invitation opening animation simulating unsealing an envelope.
* ItinerarySection.tsx: Outlines the schedule of events (ceremony, reception, times, and locations).
* OurStorySection.tsx: Displays the couple's history, milestone photos, and relationship timeline.
* ReceptionVenueSection.tsx: Details the venue location maps, parking instructions, and accommodation options.
* RsvpSection.tsx: The trigger section allowing guests to open the RSVP modal or look up previous responses.
* VinylVisualizerSection.tsx: An interactive music player / lo-fi visualizer element built into the site experience.

---

## Database Schema (Supabase)

The application interacts with a Supabase PostgreSQL table named rsvp_list with the following schema structure:
* id: uuid (Primary key, auto-generated)
* created_at: timestamptz (Timestamp of creation)
* first_name: text (Guest's first name)
* last_name: text (Guest's last name)
* email: text (Guest's contact email address)
* attending: text (Attendance option selected, e.g., ceremony/reception choices or declining)
* dietary_requirements: text (Special dietary notes or allergies)

---

## Cloudflare Integration & Storage

The application utilizes Cloudflare (specifically Cloudflare R2 or Worker-backed image storage) to handle media uploads securely and efficiently for the digital photo gallery. 

### How It Works
* Direct Uploads / Routing: When guests upload photos or media mixes through the gallery interface, the assets route directly through Cloudflare infrastructure to ensure low latency and high availability.
* Asset Keys & Tracking: Uploaded assets are assigned unique storage keys. The frontend tracks these user uploads locally (via storage keys) to manage permissions, ownership, and batch deletion functionality securely.
* Edge Delivery: Media files are served globally via Cloudflare's edge network, ensuring fast load times for wedding guests accessing the site from various locations.

---

## Building & Deployment

### Ensuring a Successful Deployment (No Compile Errors)
Before pushing to production or deploying to platforms like Vercel, you must run the production build command locally to catch any TypeScript type errors, syntax issues, or missing variables:

npm run build

If the build passes completely without errors, your app is safe to deploy. If any compilation or type errors occur during this step, resolve them immediately before deploying.

### Deploy on Vercel
The easiest way to deploy your Next.js app is to use the Vercel Platform from the creators of Next.js.