"use client";
import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Search, ArrowLeft } from 'lucide-react';
import type { Guest } from '../app/page';

interface RsvpSheetModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isCutoffPassed: boolean;
  guestsList: Guest[];
  setGuestsList: React.Dispatch<React.SetStateAction<Guest[]>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RsvpSheetModal({
  isOpen = true,
  onClose,
  isCutoffPassed,
  guestsList,
  setGuestsList,
  isEditing,
  setIsEditing,
}: RsvpSheetModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'lookup'>('form');
  const [isSearching, setIsSearching] = useState(false);
  const [lookupName, setLookupName] = useState({ firstName: '', lastName: '' });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isDuplicateError, setIsDuplicateError] = useState(false);

  if (!isOpen) return null;
  
  const handleLookupRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/rsvp?firstName=${encodeURIComponent(lookupName.firstName)}&lastName=${encodeURIComponent(lookupName.lastName)}`);
      const data = await res.json();

      if (res.ok && data.found) {
        setGuestsList(data.guests);
        setIsSubmitted(true);
        setIsEditing(false);
        setViewMode('form');
      } else {
        setErrorMessage("We couldn't find an RSVP matching that name. Please submit a new RSVP below.");
        setViewMode('form');
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setErrorMessage("An error occurred during lookup. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateGuest = (id: number, field: keyof Guest, value: string) => {
    setGuestsList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
    setIsEditing(true);
    setErrorMessage('');
    setIsDuplicateError(false);
  };

  const handleAddFamilyMember = () => {
    setIsEditing(true);
    setErrorMessage('');
    setIsDuplicateError(false);
    setGuestsList((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        firstName: "",
        lastName: "",
        email: "",
        attending: "",
        dietary: "",
      },
    ]);
  };

  const handleRemoveGuest = (id: number) => {
    if (guestsList.length === 1) return;
    setIsEditing(true);
    setErrorMessage('');
    setIsDuplicateError(false);
    setGuestsList((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSubmitToSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsDuplicateError(false);

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: guestsList }),
      });

      const data = await res.json();

      if (res.status === 409 || res.status === 400) {
        setErrorMessage(data.error);
        setIsDuplicateError(res.status === 409);
        return;
      }

      if (res.ok) {
        setIsSubmitted(true);
        setIsEditing(false);
      } else {
        setErrorMessage(data.error || "Failed to save RSVP. Please try again.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setErrorMessage("An error occurred while saving your RSVP.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] border border-[#EADCC9] max-w-xl w-full rounded-sm p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Absolute High-Positioned Close Button */}
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-4 right-4 z-30 text-[#7D7261] hover:text-[#4A433A] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- VIEW 1: LOOKUP SCREEN --- */}
        {viewMode === 'lookup' ? (
          <div className="space-y-6">
            <div className="sticky top-0 bg-[#FDFBF7] pt-1 pb-4 z-20 border-b border-[#EADCC9]/40 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Welcome Back</span>
              <h2 className="text-2xl font-serif font-light text-[#4A433A]">Look Up Your RSVP</h2>
              <div className="w-8 h-[1px] bg-[#C5A880] mx-auto" />
            </div>

            <p className="text-xs text-[#7D7261] text-center pt-2">Enter your name to view or update your existing response.</p>

            <form onSubmit={handleLookupRsvp} className="space-y-4 max-w-md mx-auto pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={lookupName.firstName}
                    onChange={(e) => setLookupName({ ...lookupName, firstName: e.target.value })}
                    className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lookupName.lastName}
                    onChange={(e) => setLookupName({ ...lookupName, lastName: e.target.value })}
                    className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-[#FAF6F0] border border-[#EADCC9] rounded-sm text-center">
                  <p className="text-xs text-[#9E1D3D] font-medium leading-relaxed">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> {isSearching ? 'Searching...' : 'Find My RSVP'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setViewMode('form'); setErrorMessage(''); }}
                  className="text-sm font-medium text-[#7D7261] underline hover:text-[#4A433A] flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to RSVP Form
                </button>
              </div>
            </form>
          </div>
        ) : isSubmitted && !isEditing ? (
          /* --- VIEW 2: CONFIRMED RESULTS SCREEN --- */
          <div className="space-y-6 text-center">
            <div className="sticky top-0 bg-[#FDFBF7] pt-1 pb-4 z-20 border-b border-[#EADCC9]/40 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Thank You</span>
              <h2 className="text-2xl font-serif font-light text-[#4A433A]">Your RSVP is Confirmed</h2>
              <div className="w-8 h-[1px] bg-[#C5A880] mx-auto" />
            </div>

            <div className="w-10 h-10 bg-[#C5A880]/20 rounded-full flex items-center justify-center mx-auto text-[#C5A880] mt-2">
              <Check className="w-5 h-5" />
            </div>

            <p className="text-xs text-[#7D7261]">Here are the details registered for our celebration:</p>

            <div className="space-y-3 text-left max-w-md mx-auto bg-[#FAF8F5] p-4 rounded-sm border border-[#EADCC9]">
              {guestsList.map((guest, idx) => (
                <div key={guest.id || idx} className="border-b border-[#EADCC9] pb-3 last:border-0 last:pb-0">
                  <p className="font-semibold text-sm text-[#4A433A]">
                    {guest.firstName} {guest.lastName}
                  </p>
                  <p className="text-xs text-[#7D7261] mt-0.5">{guest.email}</p>
                  <p className="text-xs text-[#C5A880] mt-0.5">{guest.attending}</p>
                  {guest.dietary && (
                    <p className="text-[11px] text-[#7D7261] mt-1">Dietary: {guest.dietary}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 text-xs uppercase tracking-[0.2em] rounded-sm border border-[#C5A880] text-[#5C5346] hover:bg-[#C5A880] hover:text-white transition-all"
              >
                Edit RSVP
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewMode('lookup')}
                className="text-sm font-medium text-[#7D7261] underline hover:text-[#4A433A]"
              >
                Need to check or update an existing response? Search here
              </button>
            </div>
          </div>
        ) : (
          /* --- VIEW 3: RSVP INPUT / EDIT FORM (DEFAULT) --- */
          <form onSubmit={handleSubmitToSupabase} className="space-y-6">
            
            {/* Sticky Header Section */}
            <div className="sticky top-0 bg-[#FDFBF7] pt-1 pb-4 z-20 border-b border-[#EADCC9]/60 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Join Our Celebration</span>
              <h2 className="text-2xl font-serif font-light text-[#4A433A]">RSVP Form</h2>
              <div className="w-8 h-[1px] bg-[#C5A880] mx-auto" />
            </div>

            {isCutoffPassed && (
              <div className="bg-[#FAF0F0] border border-[#E5B8B8] p-3 text-xs text-[#8C3A3A] text-center rounded-sm">
                The RSVP deadline has passed. Please contact the couple directly for any changes.
              </div>
            )}

            <div className="space-y-6 pt-2">
              {guestsList.map((guest, index) => (
                <div key={guest.id} className="p-4 bg-[#FAF8F5] border border-[#EADCC9] rounded-sm space-y-4 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">
                      Guest {index + 1}
                    </span>
                    {guestsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(guest.id)}
                        className="text-[#BE123C] hover:opacity-75 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

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
                        onChange={(e) => handleUpdateGuest(guest.id, "firstName", e.target.value)}
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
                        onChange={(e) => handleUpdateGuest(guest.id, "lastName", e.target.value)}
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
                      onChange={(e) => handleUpdateGuest(guest.id, "email", e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">
                      Attendance Option <span className="text-[#BE185D]">*</span>
                    </label>
                    <select
                      value={guest.attending}
                      onChange={(e) => handleUpdateGuest(guest.id, "attending", e.target.value)}
                      required
                      disabled={isCutoffPassed}
                      className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                    >
                      <option value="" disabled>Please select an option...</option>
                      <option value="Attending both ceremony and reception">Attending both ceremony and reception</option>
                      <option value="Reception only">Reception only</option>
                      <option value="Declining">Regretfully declining</option>
                    </select>
                  </div>

                  {guest.attending !== 'Declining' && guest.attending !== '' && (
                    <div>
                      <label className="text-[9px] uppercase font-bold text-[#7D7261] tracking-widest pl-1">Dietary Requirements</label>
                      <input
                        type="text"
                        disabled={isCutoffPassed}
                        value={guest.dietary}
                        onChange={(e) => handleUpdateGuest(guest.id, "dietary", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                        placeholder="e.g. Vegetarian, Allergies"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Error Message & Duplicate Helper Banner */}
            {errorMessage && (
              <div className="p-4 bg-[#FAF6F0] border border-[#EADCC9] rounded-sm text-center space-y-3">
                <p className="text-xs text-[#9E1D3D] font-medium leading-relaxed">
                  {errorMessage}
                </p>
                {isDuplicateError && (
                  <button 
                    type="button"
                    onClick={() => {
                      setViewMode('lookup');
                      setErrorMessage('');
                    }}
                    className="px-5 py-2 text-[10px] uppercase tracking-[0.2em] rounded-full bg-[#C5A880] text-white hover:bg-[#B3956D] transition"
                  >
                    Search & Edit Your RSVP
                  </button>
                )}
              </div>
            )}

            {!isCutoffPassed && (
              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="w-full py-2.5 border border-dashed border-[#C5A880] text-xs uppercase tracking-[0.2em] text-[#C5A880] hover:bg-[#C5A880]/10 transition-all flex items-center justify-center gap-2 rounded-sm"
              >
                <Plus className="w-4 h-4" /> Add Family Member / Plus One
              </button>
            )}

            {!isCutoffPassed && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  {isSubmitted && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="w-1/2 py-3 text-xs uppercase tracking-[0.2em] border border-[#EADCC9] bg-white text-[#5C5346] rounded-sm"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`${isSubmitted ? 'w-1/2' : 'w-full'} py-3 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all`}
                  >
                    Confirm & Submit RSVP
                  </button>
                </div>

                {/* Updated Lookup Link at the Bottom */}
                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => { setViewMode('lookup'); setErrorMessage(''); }}
                    className="text-sm font-medium text-[#7D7261] underline hover:text-[#4A433A]"
                  >
                    Need to check or update an existing response? Search here
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