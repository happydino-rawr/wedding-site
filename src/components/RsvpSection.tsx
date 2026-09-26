import { useState, useEffect } from 'react';
import { X, CheckCircle2, Edit3, Heart } from 'lucide-react';

interface Guest {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  attending: 'Attending' | 'Declining';
  dietary: string;
}

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RsvpModal({ isOpen, onClose }: RsvpModalProps) {
  const [guests, setGuests] = useState<Guest[]>([
    { firstName: '', lastName: '', email: '', attending: 'Attending', dietary: '' }
  ]);
  
  // State toggles
  const [isSubmitted, setIsSubmitted] = useState(false); // Controls showing the Confirmed View vs Form
  const [isEditing, setIsEditing] = useState(false);     // Toggles form edit mode for existing submissions
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. On open, check if there's a confirmed RSVP or draft in local/session storage
  useEffect(() => {
    const savedRsvp = localStorage.getItem('user_confirmed_rsvp');
    const savedDraft = sessionStorage.getItem('rsvp_form_draft');

    if (savedRsvp) {
      try {
        const parsed = JSON.parse(savedRsvp);
        setGuests(parsed);
        setIsSubmitted(true); // Directs user straight to "Confirmed" screen on reopen
      } catch (e) {
        console.error("Error parsing saved RSVP", e);
      }
    } else if (savedDraft) {
      try {
        setGuests(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Error parsing draft", e);
      }
    }
  }, [isOpen]);

  // Save drafts as they type (only if not already submitted)
  useEffect(() => {
    if (!isSubmitted && guests.length > 0) {
      sessionStorage.setItem('rsvp_form_draft', JSON.stringify(guests));
    }
  }, [guests, isSubmitted]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, field: keyof Guest, value: string) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [field]: value };
    setGuests(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit RSVP');

      // Save confirmed state
      localStorage.setItem('user_confirmed_rsvp', JSON.stringify(result.data || guests));
      sessionStorage.removeItem('rsvp_form_draft');
      
      setIsSubmitted(true);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'RSVP successfully saved!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewRsvp = () => {
    localStorage.removeItem('user_confirmed_rsvp');
    sessionStorage.removeItem('rsvp_form_draft');
    setGuests([{ firstName: '', lastName: '', email: '', attending: 'Attending', dietary: '' }]);
    setIsSubmitted(false);
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-md shadow-2xl max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto border border-[#EADCC9]">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <Heart className="w-5 h-5 text-[#C5A880] mx-auto mb-2 fill-current" />
          <h2 className="text-2xl font-serif text-[#4A433A]">
            {isSubmitted && !isEditing ? 'RSVP Confirmed' : 'RSVP Details'}
          </h2>
        </div>

        {/* --- VIEW 1: CONFIRMED READ-ONLY STATE --- */}
        {isSubmitted && !isEditing ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-0.5">Your RSVP has been confirmed!</p>
                <p className="text-emerald-700">We have recorded your response below. Thank you for letting us know.</p>
              </div>
            </div>

            {/* Displaying Summary Cards */}
            <div className="space-y-3">
              {guests.map((g, idx) => (
                <div key={idx} className="p-4 border border-[#EADCC9] rounded bg-[#FAF6F0]/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-[#EADCC9] pb-2">
                    <span className="font-semibold text-[#4A433A] text-sm">{g.firstName} {g.lastName}</span>
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      g.attending === 'Attending' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {g.attending === 'Attending' ? 'Attending' : 'Declined'}
                    </span>
                  </div>
                  <p className="text-gray-600"><span className="text-gray-400">Email:</span> {g.email}</p>
                  {g.attending === 'Attending' && g.dietary && (
                    <p className="text-gray-600"><span className="text-gray-400">Dietary:</span> {g.dietary}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 bg-[#C5A880] hover:bg-[#B3956D] text-white font-semibold text-xs uppercase tracking-widest rounded shadow flex items-center justify-center gap-2 transition"
              >
                <Edit3 className="w-4 h-4" />
                Edit Response
              </button>
              
              <button
                onClick={handleStartNewRsvp}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline pt-2 block"
              >
                Submit an RSVP for someone else
              </button>
            </div>
          </div>
        ) : (

        /* --- VIEW 2: EDITABLE FORM STATE --- */
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className={`p-3 rounded text-xs ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {guests.map((guest, idx) => (
              <div key={idx} className="p-4 border border-[#EADCC9] rounded bg-[#FAF6F0]/50 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="First Name"
                    required
                    value={guest.firstName}
                    onChange={(e) => handleInputChange(idx, 'firstName', e.target.value)}
                    className="p-2 border border-gray-200 rounded text-xs w-full focus:outline-none focus:border-[#C5A880]"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    required
                    value={guest.lastName}
                    onChange={(e) => handleInputChange(idx, 'lastName', e.target.value)}
                    className="p-2 border border-gray-200 rounded text-xs w-full focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={guest.email}
                  onChange={(e) => handleInputChange(idx, 'email', e.target.value)}
                  className="p-2 border border-gray-200 rounded text-xs w-full focus:outline-none focus:border-[#C5A880]"
                />

                <div className="flex gap-4 items-center pt-1">
                  <label className="text-xs text-gray-700 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`attending_${idx}`}
                      value="Attending"
                      checked={guest.attending === 'Attending'}
                      onChange={(e) => handleInputChange(idx, 'attending', e.target.value as any)}
                    />
                    Joyfully Accepts
                  </label>
                  <label className="text-xs text-gray-700 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name={`attending_${idx}`}
                      value="Declining"
                      checked={guest.attending === 'Declining'}
                      onChange={(e) => handleInputChange(idx, 'attending', e.target.value as any)}
                    />
                    Regretfully Declines
                  </label>
                </div>

                {guest.attending === 'Attending' && (
                  <input
                    type="text"
                    placeholder="Dietary requirements (optional)"
                    value={guest.dietary}
                    onChange={(e) => handleInputChange(idx, 'dietary', e.target.value)}
                    className="p-2 border border-gray-200 rounded text-xs w-full focus:outline-none focus:border-[#C5A880]"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C5A880] hover:bg-[#B3956D] text-white font-semibold text-xs uppercase tracking-widest rounded shadow transition"
            >
              {loading ? 'Saving...' : isSubmitted ? 'Save Changes' : 'Confirm RSVP'}
            </button>

            {isSubmitted && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline pt-1 block"
              >
                Cancel editing
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}