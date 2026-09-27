"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Check, Search, CheckCircle2, UserPlus, Users, Info, AlertCircle, PlusCircle } from 'lucide-react';

export interface Guest {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  attending: string;
  dietary: string;
}

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
  
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedSearchIds, setSelectedSearchIds] = useState<Set<string>>(new Set());
  const [conflictData, setConflictData] = useState<any>(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasRemovedConfirmedGuest, setHasRemovedConfirmedGuest] = useState(false);

  const bottomFeedbackRef = useRef<HTMLDivElement>(null);

  // Read LocalStorage & Validate Cache
  useEffect(() => {
    if (!isOpen) return;

    const savedRsvp = localStorage.getItem('confirmed_rsvp_guests');
    if (!savedRsvp) return;

    try {
      const parsedGuests = JSON.parse(savedRsvp);
      if (!Array.isArray(parsedGuests) || parsedGuests.length === 0) return;

      const primaryGuest = parsedGuests[0];
      if (!primaryGuest.firstName || !primaryGuest.lastName) return;

      setGuestsList(parsedGuests);
      setIsSubmitted(true);

      fetch(
        `/api/rsvp?firstName=${encodeURIComponent(primaryGuest.firstName)}&lastName=${encodeURIComponent(primaryGuest.lastName)}`
      )
        .then(async (res) => {
          const text = await res.text();
          const data = text ? JSON.parse(text) : {};

          if (!res.ok || !data.found || !data.guests || data.guests.length === 0) {
            localStorage.removeItem('confirmed_rsvp_guests');
            setGuestsList([
              { id: undefined, firstName: '', lastName: '', email: '', attending: '', dietary: '' }
            ]);
            setIsSubmitted(false);
            setIsEditing(true);
          } else {
            setGuestsList(data.guests);
            localStorage.setItem('confirmed_rsvp_guests', JSON.stringify(data.guests));
          }
        })
        .catch((err) => console.error("Error validating cached RSVP:", err));
    } catch (e) {
      console.error("Error reading confirmed RSVP cache", e);
    }
  }, [isOpen, setGuestsList, setIsEditing]);

  // Smooth scroll to messages
  useEffect(() => {
    if ((errorMessage || successMessage) && bottomFeedbackRef.current) {
      bottomFeedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [errorMessage, successMessage]);

  if (!isOpen) return null;

  // Search Lookup Handler
  const handleLookupRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setErrorMessage('');
    setSuccessMessage('');
    setSearchResults([]);
    setSelectedSearchIds(new Set());

    const cleanFirst = lookupName.firstName.trim();
    const cleanLast = lookupName.lastName.trim();

    if (!cleanFirst || !cleanLast) {
      setErrorMessage("Please enter both a first and last name to search.");
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/rsvp?firstName=${encodeURIComponent(cleanFirst)}&lastName=${encodeURIComponent(cleanLast)}`
      );
      
      const responseText = await res.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (res.ok && data.found && Array.isArray(data.guests) && data.guests.length > 0) {
        setSearchResults(data.guests);
        setSelectedSearchIds(new Set(data.guests.map((g: Guest) => g.id || `${g.firstName}-${g.lastName}`)));
        setSuccessMessage(`Found ${data.guests.length} match(es). Select who you would like to add below.`);
      } else {
        setErrorMessage("We couldn't find an exact RSVP matching that name. Please check spelling or fill out a new form.");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setErrorMessage("An error occurred during lookup. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelectSearchGuest = (guestKey: string) => {
    setSelectedSearchIds((prev) => {
      const next = new Set(prev);
      if (next.has(guestKey)) next.delete(guestKey);
      else next.add(guestKey);
      return next;
    });
  };

  const handleAddSelectedToRsvp = () => {
    const guestsToAdd = searchResults.filter((g) => {
      const key = g.id || `${g.firstName}-${g.lastName}`;
      return selectedSearchIds.has(key);
    });

    if (guestsToAdd.length === 0) {
      setErrorMessage("Please select at least one guest to add.");
      return;
    }

    const currentValid = guestsList.filter(
      (g) => (g.firstName && g.firstName.trim() !== '') || (g.lastName && g.lastName.trim() !== '')
    );

    const getGuestKey = (g: Guest, indexFallback: number) => {
      if (g.id) return `id-${g.id}`;
      return `key-${(g.firstName || '').toLowerCase().trim()}-${(g.lastName || '').toLowerCase().trim()}-${indexFallback}`;
    };

    const mergedMap = new Map<string, Guest>();

    currentValid.forEach((g, idx) => {
      mergedMap.set(getGuestKey(g, idx), g);
    });

    guestsToAdd.forEach((fetchedGuest: Guest, idx: number) => {
      mergedMap.set(getGuestKey(fetchedGuest, idx + 100), fetchedGuest);
    });

    const combinedList = Array.from(mergedMap.values());

    setGuestsList(combinedList);
    localStorage.setItem('confirmed_rsvp_guests', JSON.stringify(combinedList));

    setIsSubmitted(true);
    setIsEditing(false);
    setSearchResults([]);
    setSuccessMessage(`Added ${guestsToAdd.length} guest(s) to your RSVP list!`);
    setActiveTab('form');
  };

  const handleUpdateGuest = (targetId: string | undefined, targetIndex: number, field: keyof Guest, value: string) => {
    setGuestsList((prev) =>
      prev.map((g, idx) => ((g.id ? g.id === targetId : idx === targetIndex) ? { ...g, [field]: value } : g))
    );
    setIsEditing(true);
    setErrorMessage('');
  };

  const handleAddFamilyMember = () => {
    setIsEditing(true);
    setErrorMessage('');
    setGuestsList((prev) => [
      ...prev,
      {
        id: undefined,
        firstName: "",
        lastName: "",
        email: "",
        attending: "",
        dietary: "",
      },
    ]);
  };

  const handleRemoveGuest = (targetId: string | undefined, targetIndex: number) => {
    if (guestsList.length <= 1) return;

    const guestToRemove = guestsList.find((g, idx) => (g.id ? g.id === targetId : idx === targetIndex));

    if (guestToRemove && guestToRemove.id) {
      setHasRemovedConfirmedGuest(true);
    }

    setIsEditing(true);
    setErrorMessage('');
    setGuestsList((prev) => prev.filter((g, idx) => (g.id ? g.id !== targetId : idx !== targetIndex)));
  };

  // Submit Handler
  const handleSubmitToSupabase = async (e?: React.FormEvent, forceCreate = false) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: guestsList, forceCreate }),
      });

      const responseText = await res.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (res.status === 409 && data.conflict) {
        setConflictData(data);
        return;
      }

      if (res.ok && data.success && Array.isArray(data.data)) {
        setGuestsList(data.data);
        setIsSubmitted(true);
        setIsEditing(false);
        setHasRemovedConfirmedGuest(false);
        setConflictData(null);
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

  const handleOverwriteExisting = () => {
    if (!conflictData) return;
    const existingId = conflictData.existingGuest.id;
    
    setGuestsList((prev) =>
      prev.map((g) => {
        const isMatch =
          g.firstName.trim().toLowerCase() === conflictData.submittingGuest.firstName.toLowerCase() &&
          g.lastName.trim().toLowerCase() === conflictData.submittingGuest.lastName.toLowerCase();
        return isMatch ? { ...g, id: existingId } : g;
      })
    );

    setConflictData(null);
    setTimeout(() => handleSubmitToSupabase(undefined, false), 100);
  };

  const handleCreateAsNew = () => {
    setConflictData(null);
    handleSubmitToSupabase(undefined, true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Outer Modal Container */}
      <div className="bg-[#FDFBF7] border border-[#EADCC9] max-w-xl w-full rounded-sm relative shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* --- FIXED HEADER SECTION --- */}
        <div className="p-6 sm:p-8 pb-4 border-b border-[#EADCC9]/60 text-center space-y-3 relative flex-shrink-0 bg-[#FDFBF7]">
          
          <button 
            type="button"
            onClick={onClose} 
            className="absolute top-4 right-4 z-40 text-[#7D7261] hover:text-[#4A433A] transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold block">
              {activeTab === 'form' ? (isSubmitted ? 'Your Recorded Details' : 'Join Our Celebration') : 'Welcome Back'}
            </span>
            <h2 className="text-2xl font-serif font-light text-[#4A433A]">
              {activeTab === 'form' ? 'RSVP Form' : 'Find Your RSVP'}
            </h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-1" />
          </div>

          <div className="flex justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => { 
                setActiveTab('form'); 
                setErrorMessage(''); 
                setSuccessMessage(''); 
                setHasRemovedConfirmedGuest(false); 
              }}
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
              onClick={() => { 
                setActiveTab('lookup'); 
                setErrorMessage(''); 
                setSuccessMessage(''); 
                setHasRemovedConfirmedGuest(false); 
              }}
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

        {/* --- SCROLLABLE BODY SECTION --- */}
        <div className="p-6 sm:p-8 pt-4 overflow-y-auto flex-1">
          
          {/* --- TAB 1: LOOKUP --- */}
          {activeTab === 'lookup' ? (
            <div className="space-y-5 max-w-md mx-auto">
              <form onSubmit={handleLookupRsvp} className="space-y-4">
                <p className="text-xs text-[#7D7261] text-center leading-relaxed">
                  Enter your exact first and last name to look up attendance records.
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
                  className="w-full py-3 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Search className="w-4 h-4" /> {isSearching ? 'Searching...' : 'Search RSVP'}
                </button>
              </form>

              {/* Checklist Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#EADCC9]">
                  <span className="text-[10px] uppercase font-bold text-[#7D7261] tracking-wider block">
                    Select matching guests to add:
                  </span>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {searchResults.map((g) => {
                      const guestKey = g.id || `${g.firstName}-${g.lastName}`;
                      const isChecked = selectedSearchIds.has(guestKey);

                      return (
                        <label
                          key={guestKey}
                          onClick={() => toggleSelectSearchGuest(guestKey)}
                          className={`flex items-center justify-between p-3 border rounded-sm cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-[#FAF6F0] border-[#C5A880]' 
                              : 'bg-white border-[#EADCC9] opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold text-[#4A433A]">
                              {g.firstName} {g.lastName}
                            </p>
                            <p className="text-[10px] text-[#7D7261]">{g.email || 'No email provided'}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 accent-[#C5A880] cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSelectedToRsvp}
                    className="w-full py-3 bg-[#4A433A] hover:bg-[#36312B] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Selected Guests to My RSVP
                  </button>
                </div>
              )}

              <div ref={bottomFeedbackRef} className="space-y-3">
                {errorMessage && (
                  <div className="p-3 bg-[#FAF0F0] border border-[#E5B8B8] rounded-sm text-xs text-[#8C3A3A] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 bg-[#F2F7F2] border border-[#C2E0C2] rounded-sm text-xs text-[#2E6B34] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <p>{successMessage}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (

            /* --- TAB 2: RSVP FORM --- */
            <form onSubmit={handleSubmitToSupabase} className="space-y-6">
              
              {isCutoffPassed && (
                <div className="bg-[#FAF0F0] border border-[#E5B8B8] p-3 text-xs text-[#8C3A3A] text-center rounded-sm">
                  The RSVP deadline has passed. Please contact the couple directly for any updates.
                </div>
              )}

              {/* Guest Cards List */}
              <div className="space-y-5">
                {guestsList.map((guest, index) => {
                  const isGuestConfirmed = Boolean(guest.id);
                  const cardKey = guest.id ? `card-id-${guest.id}` : `card-index-${index}`;

                  return (
                    <div key={cardKey} className="p-4 bg-[#FAF8F5] border border-[#EADCC9] rounded-sm space-y-4 relative">
                      
                      {/* Header */}
                      <div className="flex justify-between items-center border-b border-[#EADCC9]/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#C5A880]/20 text-[#C5A880] font-bold text-[10px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4A433A]">
                            {guest.firstName ? `${guest.firstName} ${guest.lastName}` : `Guest ${index + 1}`}
                          </span>

                          {isGuestConfirmed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-[9px] font-semibold text-[#2E7D32]">
                              <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" /> Confirmed Response
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

                      {/* Inputs */}
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
                            onChange={(e) => handleUpdateGuest(guest.id, index, "firstName", e.target.value)}
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
                            onChange={(e) => handleUpdateGuest(guest.id, index, "lastName", e.target.value)}
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
                          onChange={(e) => handleUpdateGuest(guest.id, index, "email", e.target.value)}
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
                            onChange={(e) => handleUpdateGuest(guest.id, index, "attending", e.target.value)}
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
                            onChange={(e) => handleUpdateGuest(guest.id, index, "dietary", e.target.value)}
                            className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                            placeholder="e.g. Vegetarian, Allergies"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* --- BOTTOM FEEDBACK BANNERS & ACTION BUTTONS --- */}
              {!isCutoffPassed && (
                <div ref={bottomFeedbackRef} className="space-y-3 pt-2">
                  
                  {/* Warning for Removed Confirmed Cards */}
                  {hasRemovedConfirmedGuest && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-0.5">Removing a confirmed guest card:</p>
                        <p>
                          Removing a card hides it from your current screen. To officially mark someone as unable to attend, keep their card and select <span className="font-semibold">"Regretfully declining"</span> in their attendance dropdown before saving.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Success Banner */}
                  {successMessage && (
                    <div className="p-3.5 bg-[#F2F7F2] border border-[#C2E0C2] rounded-sm flex items-center gap-2.5 text-xs text-[#2E6B34] font-medium shadow-xs">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#2E6B34]" />
                      <p>{successMessage}</p>
                    </div>
                  )}

                  {/* Error Banner */}
                  {errorMessage && (
                    <div className="p-3.5 bg-[#FAF0F0] border border-[#E5B8B8] rounded-sm flex items-start gap-2.5 text-xs text-[#8C3A3A] shadow-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#8C3A3A] mt-0.5" />
                      <p className="leading-relaxed">{errorMessage}</p>
                    </div>
                  )}

                  {/* Add Guest Button */}
                  <button
                    type="button"
                    onClick={handleAddFamilyMember}
                    className="w-full py-2.5 border border-dashed border-[#C5A880] text-xs uppercase tracking-[0.2em] text-[#C5A880] hover:bg-[#C5A880]/10 transition-all flex items-center justify-center gap-2 rounded-sm"
                  >
                    <UserPlus className="w-4 h-4" /> Add Family Member / Plus One
                  </button>

                  {/* Submit / Save Changes Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : isSubmitted ? 'Save Changes' : 'Submit RSVP'}
                  </button>
                </div>
              )}
            </form>
          )}

        </div>

        {/* --- DUPLICATE NAME CONFIRMATION POP-UP --- */}
        {conflictData && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FDFBF7] border border-[#EADCC9] p-6 rounded-sm max-w-md w-full space-y-4 shadow-2xl relative">
              <h3 className="text-lg font-serif font-semibold text-[#4A433A]">
                Existing Guest Found
              </h3>
              
              <p className="text-xs text-[#7D7261] leading-relaxed">
                An RSVP already exists for <strong className="text-[#4A433A]">{conflictData.existingGuest.name}</strong> with the email <span className="underline">{conflictData.existingGuest.email || 'No email registered'}</span>.
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-[11px] text-amber-900 leading-snug">
                Would you like to update that existing response, or create a new entry for a different person with the same name?
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleOverwriteExisting}
                  className="w-full py-2.5 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-all"
                >
                  Update Existing RSVP
                </button>

                <button
                  type="button"
                  onClick={handleCreateAsNew}
                  className="w-full py-2.5 bg-[#FAF8F5] border border-[#EADCC9] hover:bg-[#F2ECE1] text-[#4A433A] text-xs font-semibold uppercase tracking-wider rounded-sm transition-all"
                >
                  Create New Entry (Different Person)
                </button>

                <button
                  type="button"
                  onClick={() => setConflictData(null)}
                  className="w-full text-[11px] text-[#7D7261] underline text-center pt-1"
                >
                  Cancel and Review Form
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}