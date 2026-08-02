# Comprehensive System Requirements & Specifications: Wedding Website & RSVP System

This document outlines the complete architectural design, data flow, user interface standards, strict requirements, and edge-case testing scenarios for the wedding website and RSVP system. It is structured to provide full context for developers, designers, and QA engineers.

---

## 1. System Architecture & Tech Stack
* **Framework**: Next.js App Router.
* **Frontend**: React functional components utilizing hooks (`useState`, `useEffect`) and Lucide-React for iconography (e.g., `X`, `Plus`, `Trash2`, `Check`, `Search`, `ArrowLeft`).
* **Backend**: Next.js API Routes (`/api/rsvp`) interfacing with Supabase via `@supabase/supabase-js`.
* **Database**: PostgreSQL hosted on Supabase.
* **Styling & Theme**: Tailwind CSS with a strict color palette:
  * **Backgrounds**: Soft creams and off-whites (`#FDFBF7`, `#FAF8F5`, `#FAF6F0`).
  * **Accents & Borders**: Warm gold and taupe (`#C5A880`, `#EADCC9`, `#DCD3BD`).
  * **Typography**: Charcoal and bronze (`#4A433A`, `#5C5346`, `#7D7261`).
  * **Error States**: Deep crimson/magenta (`#9E1D3D`, `#BE185D`, `#BE123C`).

---

## 2. Global Site Features & State

### 2.1. Authentication Gate (Passcode Protection)
* **Requirement**: Unauthenticated visitors must enter an access passcode before rendering the main wedding content or triggering audio.
* **Storage**: Upon successful entry, a session token (`wedding_session_token: "true"`) must be stored in the browser's `localStorage` to bypass the gate on page refreshes or return visits.

### 2.2. Automated Audio Controls
* **Requirement**: Ambient background music (`/wedding_song.mp3`) plays during the user session.
* **Interaction**: Playback must only trigger upon the visitor's first DOM interaction (click/scroll) to comply with modern browser autoplay policies. Global pause/play toggle states must be accessible in the main hero section and a floating action menu.

### 2.3. Dynamic "Day-Of" Mode Switch
* **Requirement**: The site layout dynamically adapts based on the current date.
* **Logic**: The application evaluates the current time against predefined epoch timestamp constants (`WEDDING_DAY_START` and `WEDDING_DAY_END`). If the current time falls within this window, the page automatically re-renders to prioritize day-of details (timelines, venue maps) over pre-wedding content (registries, general info).

---

## 3. Database Schema (Supabase)
The system relies on a single primary table named `rsvp_list`.
* `id`: UUID or BigInt (Primary Key, Auto-generated).
* `first_name`: Text (Required).
* `last_name`: Text (Required).
* `email`: Text (Required).
* `attending`: Text (Required).
* `dietary_requirements`: Text (Nullable).
* `created_at`: Timestampz (Default `now()`).

---

## 4. RSVP Modal UI & UX (`RsvpSheetModal.tsx`)

### 4.1. Multi-View Lifecycle
The modal operates inside a single overlay (`fixed inset-0 bg-black/60 backdrop-blur-sm`) and manages three distinct views using the `viewMode` state:
1. **Form View (`'form'`)**: The default input screen for submitting or editing guests.
2. **Lookup View (`'lookup'`)**: A dedicated search screen for returning guests to retrieve their records.
3. **Success View (`'success'`)**: A confirmation screen displayed upon successful database insertion or lookup, featuring a checkmark icon and a summary of the registered details.

### 4.2. Cutoff Date Enforcement
* **Requirement**: Submissions must lock after the `RSVP_CUTOFF_DATE`.
* **Behavior**: If the cutoff has passed, all input fields and dropdowns are disabled (`disabled={isCutoffPassed}`). The "Add Family Member" and "Submit" buttons are hidden, and a red banner (`#FAF0F0`) displays stating the deadline has elapsed.

---

## 5. Guest Form Specifications & Conditional Logic

### 5.1. Dynamic Plus-One Grouping
* **Requirement**: Users can RSVP for a single person or a family/group in one payload.
* **Behavior**: An **"Add Family Member / Plus One"** button dynamically pushes a new empty guest object to the `guestsList` array. Each block renders with a "Remove" button (Trash icon). The remove button is only visible if `guestsList.length > 1` to prevent deleting the primary guest.

### 5.2. Mandatory Fields & Visuals
* **Fields**: First Name, Last Name, Email Address, and Attendance Option are required.
* **Asterisks**: All compulsory asterisks (`*`) must match the designated brand accent color (`text-[#BE185D]`) uniformly.
* **Dropdown Logic**: The "Attendance Option" `<select>` must not have a pre-selected default value. It defaults to a disabled placeholder (*"Please select an option..."*) and requires manual selection of:
  1. *Attending both ceremony and reception*
  2. *Reception only*
  3. *Regretfully declining*

### 5.3. Conditional Dietary Requirements
* **Visibility**: The "Dietary Requirements" text input only renders if `guest.attending` is set to *"Attending both ceremony and reception"* OR *"Reception only"*.
* **State Clearing**: If a guest inputs dietary requirements but later changes their attendance to *"Regretfully declining"*, the dietary state for that specific index must be instantly cleared (`''`) and the input hidden.

### 5.4. Requirement for Detailed User Inputs
* **Explicit & Thorough Data**: The system expects and encourages users to provide comprehensive, detailed information during submission (e.g., specific allergy details rather than vague terms, accurate contact info, and complete names).
* **Validation Support**: Form fields must accommodate long-form descriptive text (such as extended dietary notes) gracefully without breaking UI layouts or truncating database storage limits.

---

## 6. Backend API & Validation (`/api/rsvp/route.ts`)

### 6.1. POST: Submission & Case-Insensitive Duplicate Protection
To prevent duplicate records and capitalization workarounds, validation occurs in two strict phases:
1. **Payload-Level Validation (Internal Batch)**: 
   * Iterates through the incoming JSON array.
   * Normalizes `firstName`, `lastName`, and `email` to lowercase and trims whitespace.
   * Uses a `Set` to check for duplicates within the same submission. Rejects with `400 Bad Request` if a user tries to submit the exact same person twice at the same time.
2. **Database-Level Validation (Supabase)**: 
   * Queries the `rsvp_list` table using case-insensitive matching (`.ilike` for first and last names, and `.ilike` or lowercase matching for email).
   * If a match exists, the backend halts the insert and returns an HTTP **`409 Conflict`**.

### 6.2. GET: Record Lookup
* **Endpoint**: Accepts `?firstName=...&lastName=...`.
* **Behavior**: Uses `.ilike` to search the database case-insensitively. Returns a mapped array of guest objects if found (`found: true`), or a `404` status (`found: false`) if no records match.

---

## 7. Frontend Error Handling & Remediation

### 7.1. Inline Error Banners
* **Requirement**: Native browser `alert()` popups are strictly prohibited.
* **Behavior**: All errors (lookup failures, submission failures, duplicate conflicts) must be caught and rendered inside a stylized, theme-matched inline error banner (`bg-[#FAF6F0] text-[#9E1D3D]`) located above the submission buttons.

### 7.2. The 409 Conflict Remediation Flow
* **Requirement**: If a user hits a `409 Conflict` (Duplicate entry), they must be given an immediate pathway to resolve it.
* **Behavior**: The inline error banner specifically detects the `409` status. When triggered, it dynamically renders a **"Search & Edit Your RSVP"** button directly inside the error banner. Clicking this button clears the error state and instantly switches the modal to the `'lookup'` view so the user can modify their existing response.

---

## 8. Quality Assurance (QA) & Edge Case Testing Guide

This section outlines critical areas prone to failure, requiring rigorous testing to ensure system stability.

### 8.1. Data Entry & Sanitization (Form Validation)
* **Whitespace Handling**: Enter names/emails with leading and trailing spaces (e.g., `" Lisa "`). The system must trim these before payload validation and database insertion to prevent false duplicates.
* **Special Characters in Names**: Test names with hyphens, apostrophes, and accented characters (e.g., `Mary-Jane`, `O'Connor`, `Renée`). Database `.ilike` queries must handle these gracefully without throwing 500 errors.
* **Email Validation**: Bypass HTML5 `type="email"` validation (e.g., via browser dev tools) and attempt to submit a malformed string. Ensure the backend catches invalid emails or Supabase rejects them if a constraint exists.
* **Long String Inputs**: Paste 500+ characters into the "Dietary Requirements" and "Name" fields. Ensure the UI does not break (text overflow) and the database handles the length appropriately.

### 8.2. State Management & Conditional Logic Traps
* **Dietary State Leakage**: 
  1. Select "Attending".
  2. Type "Gluten Free" into Dietary Requirements.
  3. Switch to "Declining".
  4. Switch back to "Attending". 
  *Expected Result*: The Dietary field must be empty (`''`). It should not remember "Gluten Free".
* **Rapid View Switching**: Rapidly click between "Back to RSVP Form" and "Lookup Form" while a network request is pending. Ensure state does not bleed between views and the `isSearching` or `isSubmitting` loading states resolve safely without memory leaks.
* **Array Index Integrity**: Add 5 guests. Delete Guest 2 and Guest 4. Modify Guest 3. Ensure the `handleUpdateGuest` logic targets the correct unique ID and does not overwrite the wrong guest data due to index shifting.

### 8.3. Concurrency & Network Edge Cases
* **Double-Click Submission (Race Condition)**: Rapidly double-click the "Confirm & Submit RSVP" button. The `isSubmitting` boolean must immediately disable the button on the first click to prevent two identical POST requests from firing simultaneously (which could bypass the database duplicate check if processed at the exact same millisecond).
* **Network Latency Handling**: Throttle the browser network to "Slow 3G". Verify that the loading states (`Submitting...`, `Searching...`) display clearly and the user cannot interact with the form while the request resolves.
* **Lookup "Not Found" State**: Search for a name that definitely does not exist. Verify the inline error banner appears gracefully instead of a system crash, and the view remains on the lookup screen.

### 8.4. Duplicate Prevention Matrices (The 409 Logic)
* **Internal Array Conflict**: Test submitting `[ {name: "John Smith"}, {name: "John Smith"} ]` in a single form submission. The API must catch this in the internal `Set` check (HTTP 400) before it hits Supabase.
* **Capitalization Variance**: 
  1. Database has: `Lisa Wu`, `lisa.wu1999@gmail.com`.
  2. Test submitting: `LISA WU`, `LISA.WU1999@GMAIL.COM`. 
  *Expected Result*: The API must flag this as a duplicate (HTTP 409) and prompt the user to edit their RSVP.
* **Partial Match Logic**: Test a submission where the First Name and Last Name match an existing record, but the email is entirely different. Define and test the exact behavior (does the system consider them the same person, or a new person with the same name?).

### 8.5. Responsive UI & Accessibility
* **Mobile Keyboard Overlap**: On a physical mobile device, open the RSVP modal and focus on the "Email" or "Dietary" input of the 3rd or 4th guest. Ensure the virtual keyboard does not permanently hide the input or the "Submit" button (verify `overflow-y-auto` and `max-h-[90vh]` behave correctly).
* **Select Dropdown Styling**: Ensure the custom chevron (`ChevronDown`) on the Attendance dropdown doesn't overlap long option text on very narrow screens (e.g., iPhone SE). 
* **Cutoff Banner Rendering**: Force the `isCutoffPassed` state to true. Verify that all inputs are visually locked, disabled, and the red warning banner does not break the modal's padding.

### 8.6. Additional Database & UI Specifications
* **Strict Cross-User Duplicate Protection (`/api/rsvp`)**: 
  * The backend API route must iterate through each incoming guest entry and query the `rsvp_list` table using case-insensitive matching (`.ilike`) across first name, last name, and email.
  * Instead of single-row modifiers, it must evaluate `existingRsvps.length > 0`. If any matching record already sits in the database (regardless of who submitted it), the API must block insertion and return an HTTP **`409 Conflict`** to prevent multiple identical RSVPs.
* **Custom UI Attendance Dropdown Styling**: 
  * The attendance `<select>` element must use `appearance-none` to strip native browser styling.
  * It must feature a custom SVG chevron icon aligned to the right (`text-[#C5A880]`) and have its options explicitly styled with matching background colors (`bg-[#FDFBF7]`) to maintain the clean wedding theme aesthetic.
* **Modal Visibility Prop Integration**: 
  * The `RsvpSheetModal` component must properly accept and destructure an optional `isOpen` boolean prop in its interface definition. 
  * If `isOpen` evaluates to `false`, the component must immediately return `null` to cleanly handle visibility states.