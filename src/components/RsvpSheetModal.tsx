"use client";
import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Search, CheckCircle2, UserPlus, Users, Info, RefreshCw } from 'lucide-react';
import type { Guest } from '../app/page';

interface RsvpSheetModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isCutoffPassed: boolean;
  guestsList: Guest[];
  setGuestsList: React.Dispatch<React.SetStateAction<Guest[]>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RsvpSheetModal({
  isOpen = true,
  onClose,
  isCutoffPassed,
  guestsList,
  setGuestsList,
  setIsEditing,
}: RsvpSheetModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'lookup'>('form');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupName, setLookupName] = useState({ firstName: '', lastName: '' });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasRemovedConfirmedGuest, setHasRemovedConfirmedGuest] = useState(false);

  // Restore cached response state AND validate against backend
  useEffect(() => {
    if (!isOpen) return;

    const savedRsvp = localStorage.getItem('confirmed_rsvp_guests');
    if (!savedRsvp) return;

    try {
      const parsedGuests = JSON.parse(savedRsvp);
      if (!Array.isArray(parsedGuests) || parsedGuests.length === 0) return;

      const primaryGuest = parsedGuests[0];
      if (!primaryGuest.firstName || !primaryGuest.lastName) return;

      // Set local state immediately for fast render
      setGuestsList(parsedGuests);
      setIsSubmitted(true);

      // Verify in background if record still exists in Supabase
      fetch(
        `/api/rsvp?firstName=${encodeURIComponent(primaryGuest.firstName)}&lastName=${encodeURIComponent(primaryGuest.lastName)}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (!data.found || !data.guests || data.guests.length === 0) {
            // Record was deleted on backend -> clear cache and reset form
            localStorage.removeItem('confirmed_rsvp_guests');
            setGuestsList([
              { id: undefined as any, firstName: '', lastName: '', email: '', attending: '', dietary: '' }
            ]);
            setIsSubmitted(false);
            setIsEditing(true);
          } else {
            // Sync frontend with current database records
            setGuestsList(data.guests);
            localStorage.setItem('confirmed_rsvp_guests', JSON.stringify(data.guests));
          }
        })
        .catch((err) => console.error("Error validating cached RSVP:", err));
    } catch (e) {
      console.error("Error reading confirmed RSVP cache", e);
    }
  }, [isOpen, setGuestsList, setIsEditing]);

  if (!isOpen) return null;

  // Handler: Search & Merge RSVP results into current view
  const handleLookupRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(
        `/api/rsvp?firstName=${encodeURIComponent(lookupName.firstName)}&lastName=${encodeURIComponent(lookupName.lastName)}`
      );
      
      const responseText = await res.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (res.ok && data.found && Array.isArray(data.guests)) {
        setGuestsList((prevGuests) => {
          // Filter out completely empty placeholder cards
          const validPrev = prevGuests.filter(
            (g) => g.firstName.trim() !== '' || g.lastName.trim() !== ''
          );

          // Map guests by ID or lowercased full name to prevent duplicate cards
          const existingMap = new Map();
          validPrev.forEach((g) => {
            const key = g.id || `${g.firstName.toLowerCase()}-${g.lastName.toLowerCase()}`;
            existingMap.set(key, g);
          });

          // Merge newly fetched guests into the existing list
          data.guests.forEach((newGuest: Guest) => {
            const key = newGuest.id || `${newGuest.firstName.toLowerCase()}-${newGuest.lastName.toLowerCase()}`;
            existingMap.set(key, newGuest);
          });

          const mergedList = Array.from(existingMap.values());
          localStorage.setItem('confirmed_rsvp_guests', JSON.stringify(mergedList));
          return mergedList;
        });

        setIsSubmitted(true);
        setIsEditing(false);
        setSuccessMessage(`Found RSVP details! Added to your group view.`);
        setActiveTab('form');
      } else {
        setErrorMessage("We couldn't find an RSVP matching that name. Please check spelling or fill out a new form.");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setErrorMessage("An error occurred during lookup. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handler: Update guest field in state
  const handleUpdateGuest = (targetId: number | string | undefined, targetIndex: number, field: keyof Guest, value: string) => {
    setGuestsList((prev) =>
      prev.map((g, idx) => {
        // Match by DB id if present; otherwise match by index
        const isMatch = g.id ? g.id === targetId : idx === targetIndex;
        return isMatch ? { ...g, [field]: value } : g;
      })
    );
    setIsEditing(true);
    setErrorMessage('');
  };

  // Handler: Add new family member / plus-one card
  const handleAddFamilyMember = () => {
    setIsEditing(true);
    setErrorMessage('');
    setGuestsList((prev) => [
      ...prev,
      {
        id: undefined as any,
        firstName: "",
        lastName: "",
        email: "",
        attending: "",
        dietary: "",
      },
    ]);
  };

  // Handler: Remove guest card
  const handleRemoveGuest = (targetId: number | string, targetIndex: number) => {
    if (guestsList.length <= 1) return;

    const guestToRemove = guestsList.find((g, idx) => (g.id ? g.id === targetId : idx === targetIndex));

    if (guestToRemove && guestToRemove.id) {
      setHasRemovedConfirmedGuest(true);
    }

    setIsEditing(true);
    setErrorMessage('');
    setGuestsList((prev) => prev.filter((g, idx) => (g.id ? g.id !== targetId : idx !== targetIndex)));
  };

  // Handler: Reset Form and Cache
  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to clear the form and start a fresh RSVP?")) {
      localStorage.removeItem('confirmed_rsvp_guests');
      setGuestsList([{ id: undefined as any, firstName: '', lastName: '', email: '', attending: '', dietary: '' }]);
      setIsSubmitted(false);
      setIsEditing(true);
      setHasRemovedConfirmedGuest(false);
      setSuccessMessage('');
      setErrorMessage('');
    }
  };

  // Handler: Submit to API / Supabase
const handleSubmitToSupabase = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setErrorMessage('');
  setSuccessMessage('');

  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guests: guestsList }),
    });

    const responseText = await res.text();
    const data = responseText ? JSON.parse(responseText) : {};

    if (res.ok && data.success && Array.isArray(data.data)) {
      // Update state with returned array containing database IDs
      setGuestsList(data.data);
      setIsSubmitted(true);
      setIsEditing(false);
      localStorage.setItem('confirmed_rsvp_guests', JSON.stringify(data.data));
      setSuccessMessage("Your RSVP details have been saved successfully!");
    } else {
      setErrorMessage(data.error || `Server error (${res.status}). Please try again.`);
    }
  } catch (err: any) {
    console.error("Save error:", err);
    setErrorMessage(err.message || "An error occurred while saving your RSVP.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] border border-[#EADCC9] max-w-xl w-full rounded-sm p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-4 right-4 z-40 text-[#7D7261] hover:text-[#4A433A] transition-colors p-1"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- HEADER & TAB SELECTOR --- */}
        <div className="sticky -top-6 sm:-top-8 bg-[#FDFBF7] pt-2 pb-4 z-30 border-b border-[#EADCC9]/60 text-center space-y-3 -mx-6 sm:-mx-8 px-6 sm:px-8 shadow-xs">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold block">
              {activeTab === 'form' ? (isSubmitted ? 'Your Recorded Details' : 'Join Our Celebration') : 'Welcome Back'}
            </span>
            <h2 className="text-2xl font-serif font-light text-[#4A433A]">
              {activeTab === 'form' ? 'RSVP Form' : 'Find Your RSVP'}
            </h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-1" />
          </div>

          {/* Tab Controls */}
          <div className="flex justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setActiveTab('form'); setErrorMessage(''); }}
              className={`px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'form'
                  ? 'bg-[#C5A880] text-white font-semibold shadow-xs'
                  : 'bg-[#FAF8F5] text-[#7D7261] border border-[#EADCC9] hover:bg-[#F2ECE1]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {isSubmitted ? 'Edit RSVP' : 'RSVP Form'}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('lookup'); setErrorMessage(''); }}
              className={`px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'lookup'
                  ? 'bg-[#C5A880] text-white font-semibold shadow-xs'
                  : 'bg-[#FAF8F5] text-[#7D7261] border border-[#EADCC9] hover:bg-[#F2ECE1]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Find RSVP
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {successMessage && (
          <div className="mt-4 p-3 bg-[#F2F7F2] border border-[#C2E0C2] rounded-sm flex items-center gap-2.5 text-xs text-[#2E6B34]">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {hasRemovedConfirmedGuest && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Removing a confirmed guest card:</p>
              <p>
                Removing a card hides it from your current screen. To officially mark someone as unable to attend, keep their card and select <span className="font-semibold">"Regretfully declining"</span> in their attendance dropdown before saving.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-[#FAF0F0] border border-[#E5B8B8] rounded-sm text-xs text-[#8C3A3A] text-center">
            {errorMessage}
          </div>
        )}

        {/* --- VIEW 1: SEARCH / LOOKUP TAB --- */}
        {activeTab === 'lookup' ? (
          <form onSubmit={handleLookupRsvp} className="space-y-5 pt-6 max-w-md mx-auto">
            <p className="text-xs text-[#7D7261] text-center leading-relaxed">
              Enter your first and last name to look up existing attendance records for yourself or your family group.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">First Name</label>
                <input
                  type="text"
                  required
                  value={lookupName.firstName}
                  onChange={(e) => setLookupName({ ...lookupName, firstName: e.target.value })}
                  className="w-full px-2 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lookupName.lastName}
                  onChange={(e) => setLookupName({ ...lookupName, lastName: e.target.value })}
                  className="w-full px-2 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                  placeholder="Last name"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Search className="w-4 h-4" /> {isSearching ? 'Searching...' : 'Search RSVP'}
            </button>
          </form>
        ) : (

          /* --- VIEW 2: RSVP MAIN FORM --- */
          <form onSubmit={handleSubmitToSupabase} className="space-y-6 pt-4">
            
            {isCutoffPassed && (
              <div className="bg-[#FAF0F0] border border-[#E5B8B8] p-3 text-xs text-[#8C3A3A] text-center rounded-sm">
                The RSVP deadline has passed. Please contact the couple directly for any updates.
              </div>
            )}

            <div className="space-y-5">
              {guestsList.map((guest, index) => {
                const isGuestConfirmed = Boolean(guest.id);

                return (
                  <div key={guest.id || index} className="p-4 bg-[#FAF8F5] border border-[#EADCC9] rounded-sm space-y-4 relative">
                    
                    {/* Card Header */}
                    <div className="flex justify-between items-center border-b border-[#EADCC9]/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#C5A880]/20 text-[#C5A880] font-bold text-[10px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4A433A]">
                          {guest.firstName ? `${guest.firstName} ${guest.lastName}` : `Guest ${index + 1}`}
                        </span>

                        {/* Per-Guest Status Badge */}
                        {isGuestConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-[9px] font-semibold text-[#2E7D32]">
                            <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" /> Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-semibold text-amber-800">
                            New Entry
                          </span>
                        )}
                      </div>

                      {guestsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGuest(guest.id, index)}
                          className="text-[#BE123C] hover:text-[#9E1235] text-xs flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    {/* Input Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">
                          First Name <span className="text-[#BE185D]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isCutoffPassed}
                          value={guest.firstName}
                          onChange={(e) => handleUpdateGuest(guest.id || index, index, "firstName", e.target.value)}
                          className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">
                          Last Name <span className="text-[#BE185D]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isCutoffPassed}
                          value={guest.lastName}
                          onChange={(e) => handleUpdateGuest(guest.id || index, index, "lastName", e.target.value)}
                          className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">
                        Email Address <span className="text-[#BE185D]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        disabled={isCutoffPassed}
                        value={guest.email}
                        onChange={(e) => handleUpdateGuest(guest.id || index, index, "email", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">
                        Attendance Option <span className="text-[#BE185D]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={guest.attending}
                          onChange={(e) => handleUpdateGuest(guest.id || index, index, "attending", e.target.value)}
                          required
                          disabled={isCutoffPassed}
                          className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880] appearance-none cursor-pointer pr-8"
                        >
                          <option value="" disabled className="text-[#7D7261] bg-[#FDFBF7]">Please select an option...</option>
                          <option value="Attending both ceremony and reception" className="bg-[#FDFBF7]">Attending both ceremony and reception</option>
                          <option value="Reception only" className="bg-[#FDFBF7]">Reception only</option>
                          <option value="Declining" className="bg-[#FDFBF7]">Regretfully declining</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#C5A880]">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {guest.attending !== 'Declining' && guest.attending !== '' && (
                      <div>
                        <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">Dietary Requirements</label>
                        <input
                          type="text"
                          disabled={isCutoffPassed}
                          value={guest.dietary}
                          onChange={(e) => handleUpdateGuest(guest.id || index, index, "dietary", e.target.value)}
                          className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                          placeholder="e.g. Vegetarian, Allergies"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions Footer */}
            {!isCutoffPassed && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddFamilyMember}
                  className="w-full py-2.5 border border-dashed border-[#C5A880] text-xs uppercase tracking-[0.2em] text-[#C5A880] hover:bg-[#C5A880]/10 transition-all flex items-center justify-center gap-2 rounded-sm"
                >
                  <UserPlus className="w-4 h-4" /> Add Family Member / Plus One
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : isSubmitted ? 'Save Changes' : 'Submit RSVP'}
                </button>

                {/* Reset Form Link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-[11px] text-[#7D7261] underline hover:text-[#BE123C] transition flex items-center justify-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3 h-3" /> Clear form and start a new response
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
}