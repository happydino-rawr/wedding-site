import React from 'react';
import { X, Check, Edit2, Plus, Info } from 'lucide-react';
import { Guest } from '../app/page';

interface RsvpSheetModalProps {
  onClose: () => void;
  isCutoffPassed: boolean;
  guestsList: Guest[];
  setGuestsList: React.Dispatch<React.SetStateAction<Guest[]>>;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

export default function RsvpSheetModal({
  onClose,
  isCutoffPassed,
  guestsList,
  setGuestsList,
  isEditing,
  setIsEditing,
}: RsvpSheetModalProps) {

  const handleAddFamilyMember = () => {
    setIsEditing(true);
    setGuestsList([
      ...guestsList,
      { id: Date.now() + Math.random(), firstName: "", lastName: "", email: "", attending: "Attending", dietary: "" }
    ]);
  };

  const handleUpdateGuest = (id: number, field: string, value: string) => {
    setGuestsList(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleRemoveGuest = (id: number) => {
    setGuestsList(prev => prev.filter(g => g.id !== id));
  };

  const handleSaveRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = guestsList.some(g => {
      const fn = !g.firstName || !g.firstName.trim();
      const ln = !g.lastName || !g.lastName.trim();
      const em = !g.email || !/^\S+@\S+\.\S+$/.test(g.email);
      return fn || ln || em;
    });
    if (invalid) {
      alert("Please fill first name, last name, and a valid email for all guests, or remove the empty entry.");
      return;
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center bg-black/50 backdrop-blur-md transition-all duration-300">
      <div className="w-full max-w-2xl bg-[#FDFBF7] rounded-t-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 bg-[#FAF6F0] border-b border-[#EADCC9] flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-serif font-light text-[#4A433A]">RSVP Portal</h3>
            <p className="text-[10px] text-[#C5A880] uppercase tracking-widest mt-1 font-semibold">DEADLINE: NOV 30, 2026</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-[#7D7261] hover:text-black transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {isCutoffPassed ? (
            <div className="bg-red-50 border border-red-200 p-6 rounded-sm text-center space-y-3">
              <p className="text-sm text-red-800 font-serif leading-relaxed">
                The online RSVP deadline has officially closed. All seating charts have frozen.
              </p>
            </div>
          ) : (
            <>
              {!isEditing && guestsList.length > 0 ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-[#EADCC9]">
                      <span className="text-sm font-serif text-[#4A433A] flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#C5A880]" />
                        <span>Registered Guests</span>
                      </span>
                    </div>

                    <div className="space-y-4">
                      {guestsList.map((guest) => (
                        <div key={guest.id} className="bg-[#FAF6F0] p-5 rounded-sm border border-[#EADCC9]/50 shadow-sm">
                          <h4 className="font-serif text-lg text-[#4A433A] mb-3">
                            {guest.firstName || "Unnamed"} {guest.lastName || "Guest"}
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-xs text-[#7D7261]">
                            <div>
                              <span className="block text-[9px] uppercase tracking-widest text-[#C5A880] mb-1">Status</span> 
                              {guest.attending}
                            </div>
                            {guest.dietary && (
                              <div>
                                <span className="block text-[9px] uppercase tracking-widest text-[#C5A880] mb-1">Dietary</span> 
                                {guest.dietary}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-4 border border-[#C5A880] text-[#C5A880] rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-[#FAF6F0] transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit details / Add family</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveRsvp} className="space-y-10">
                  {guestsList.map((guest, index) => (
                    <div key={guest.id} className="bg-white pb-8 border-b border-[#EADCC9] space-y-6 relative last:border-b-0">
                      <div className="flex justify-between items-center pb-3">
                        <span className="text-xs font-serif font-semibold text-[#4A433A]">Guest {index + 1}</span>
                        {guestsList.length > 1 && (
                          <button type="button" onClick={() => handleRemoveGuest(guest.id)} className="text-[10px] text-[#BE123C] uppercase tracking-widest font-semibold">
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">First Name <span className="text-[#BE123C]">*</span></label>
                          <input
                            type="text"
                            value={guest.firstName}
                            onChange={(e) => handleUpdateGuest(guest.id, "firstName", e.target.value)}
                            className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">Last Name <span className="text-[#BE123C]">*</span></label>
                          <input
                            type="text"
                            value={guest.lastName}
                            onChange={(e) => handleUpdateGuest(guest.id, "lastName", e.target.value)}
                            className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">Email <span className="text-[#BE123C]">*</span></label>
                        <input
                          type="email"
                          value={guest.email}
                          onChange={(e) => handleUpdateGuest(guest.id, "email", e.target.value)}
                          className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">Attendance</label>
                        <select
                          value={guest.attending}
                          onChange={(e) => handleUpdateGuest(guest.id, "attending", e.target.value)}
                          className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                        >
                          <option value="Attending">Joyfully Attending</option>
                          <option value="Declining">Regretfully Declining</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">Dietary Requirements</label>
                        <input
                          type="text"
                          placeholder="e.g. Vegetarian, None"
                          value={guest.dietary}
                          onChange={(e) => handleUpdateGuest(guest.id, "dietary", e.target.value)}
                          className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="space-y-4 pt-2">
                    <button
                      type="button"
                      onClick={handleAddFamilyMember}
                      className="w-full py-4 bg-white border border-dashed border-[#C5A880] text-[#C5A880] rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-[#FAF6F0] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Family Member</span>
                    </button>

                    <button
                      type="submit"
                      className="w-full py-5 bg-[#C5A880] hover:bg-[#B3966E] text-white font-semibold tracking-[0.2em] text-sm uppercase rounded-sm shadow-md transition-all"
                    >
                      Save Reservations
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}