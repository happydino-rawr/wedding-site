"use client";
import React, { useState, useEffect, useRef } from 'react';
import FadeInSection from '../components/FadeInSection';
import { COUPLE_PHOTOS, ACCESS_PASSCODE, WEDDING_DATE, RSVP_CUTOFF_DATE } from '../lib/constants';
import { playProceduralSong } from '@/utils/audio';
import { 
  Heart, Calendar, MapPin, Navigation, Car, Info, Music, 
  Send, Image as ImageIcon, Camera, Plus, Edit2, Volume2, 
  VolumeX, X, Users, BookOpen, Check, Play, Pause, ArrowLeft,
  Lock, ChevronDown, Trash2, Menu
} from 'lucide-react';

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  attending: string;
  dietary: string;
}

interface MediaItem {
  type?: string;
  url: string;
  key: string;
}

export default function WeddingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showFAB, setShowFAB] = useState(false);
  const [isFabDismissed, setIsFabDismissed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [guestsList, setGuestsList] = useState<Guest[]>([]); 
  const [envelopeVisible, setEnvelopeVisible] = useState(false);
  const envelopeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  // Playlist state & Deletion tracking
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songRequester, setSongRequester] = useState("");
  // const [playlistRequests, setPlaylistRequests] = useState<any[]>([]);

    // Playlist state & Deletion tracking
  const [playlistRequests, setPlaylistRequests] = useState([
    { id: 'song-1', title: "At Last", artist: "Etta James", requester: "Jane Doe" },
    { id: 'song-2', title: "Perfect Duet", artist: "Ed Sheeran & Beyonce", requester: "Mark" },
    { id: 'song-3', title: "L-O-V-E", artist: "Nat King Cole", requester: "Sophia" }
  ]);
  const [mySongIds, setMySongIds] = useState(() => {
    try {
      const saved = localStorage.getItem("my_song_requests");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [myMessageIds, setMyMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("my_ledger_messages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Guestbook
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  const [ledgerMessages, setLedgerMessages] = useState<any[]>([]);
  const [tempGuestName, setTempGuestName] = useState("");
  const [tempMessage, setTempMessage] = useState("");
  const [showAllMessages, setShowAllMessages] = useState(false);

  const [showGalleryGrid, setShowGalleryGrid] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [myUploadedKeys, setMyUploadedKeys] = useState<string[]>([]);

  // States for multi-select delete mode
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keysToDelete, setKeysToDelete] = useState<string[]>([]);

  const isCutoffPassed = new Date() > RSVP_CUTOFF_DATE;

  useEffect(() => {
    const saved = localStorage.getItem("my_wedding_uploads");
    if (saved) {
      setMyUploadedKeys(JSON.parse(saved));
    }
    refreshGallery();
  }, []);

  useEffect(() => {
    const session = localStorage.getItem("wedding_session_token");
    if (session === "true") {
      setIsAuthenticated(true);
    }

    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.8) {
        setShowFAB(true);
      } else {
        setShowFAB(false);
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = WEDDING_DATE.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEnvelopeVisible(true);
      }
    }, { threshold: 0.35 }); 
    
    if (envelopeRef.current) {
      observer.observe(envelopeRef.current);
    }
    return () => {
      if (envelopeRef.current) observer.unobserve(envelopeRef.current);
    };
  }, []);

  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleEnvelopeCheck = () => {
      if (!envelopeRef.current) return;

      const rect = envelopeRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const currentScrollY = window.scrollY;

      // 1. OPEN: When the top enters the bottom 85% of the screen
      const shouldOpen = rect.top < vh * 0.85;

      // 2. CLOSE: When the BOTTOM of the element hits the 40% mark (Higher up)
      // Tracking the bottom edge makes it much easier to control the "exit"
      const shouldClose = rect.bottom < vh * 0.3;
      
      const isScrollingUp = currentScrollY < lastScrollY.current;

      // Logic: Only update state if we are passing our thresholds
      if (isScrollingUp && shouldClose) {
        setEnvelopeVisible(false);
      } else if (!isScrollingUp && shouldOpen) {
        setEnvelopeVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

  window.addEventListener('scroll', handleEnvelopeCheck, { passive: true });
  return () => window.removeEventListener('scroll', handleEnvelopeCheck);
}, []);

  const handleAuthSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  
  if (passcode.trim() === ACCESS_PASSCODE) {
    // Drop the persistent session token so they don't have to log in again
    localStorage.setItem("wedding_session_token", "true");
    
    // Unlock the application
    setIsAuthenticated(true);
    
    // Automatically start the ambient background music for a magical entrance
    setIsMusicPlaying(true);
  } else {
    // Trigger the error state if the passcode is wrong
    setAuthError("Incorrect passcode. Please refer to your invitation card.");
  }
};

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newOptimisticFiles = Array.from(files).map(file => ({
      url: URL.createObjectURL(file),
      type: file.type,
      key: `temp-${Date.now()}-${file.name}`
    }));

    setMediaGallery(prev => [...newOptimisticFiles, ...prev]);

    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Failed to upload ${file.name}`);

        const data = await res.json(); 
        
        if (data.key) {
          setMyUploadedKeys(prev => {
            const updated = [...prev, data.key];
            localStorage.setItem("my_wedding_uploads", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error("Error during upload:", err);
      }
    });

    await Promise.all(uploadPromises);
    await refreshGallery();
    alert("Uploads complete!");
  };

  const handleDelete = async (key: string) => {
    if (!confirm("Are you sure you want to delete this moment?")) return;

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (res.ok) {
        setMediaGallery(prev => prev.filter(item => item.key !== key));
        setMyUploadedKeys(prev => {
          const updated = prev.filter(k => k !== key);
          localStorage.setItem("my_wedding_uploads", JSON.stringify(updated));
          return updated;
        });
      } else {
        alert("Failed to delete the file from the server.");
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleBatchDelete = async () => {
    try {
      const deletePromises = keysToDelete.map(async (key) => {
        const res = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        return { key, ok: res.ok };
      });

      const results = await Promise.all(deletePromises);
      const successfullyDeleted = results.filter(r => r.ok).map(r => r.key);

      setMediaGallery(prev => prev.filter(item => !successfullyDeleted.includes(item.key)));
      setMyUploadedKeys(prev => {
        const updated = prev.filter(k => !successfullyDeleted.includes(k));
        localStorage.setItem("my_wedding_uploads", JSON.stringify(updated));
        return updated;
      });

      setSelectedKeys([]);
      setKeysToDelete([]);
      setShowDeleteModal(false);
      setIsDeleteMode(false);
    } catch (err) {
      console.error("Failed to delete items:", err);
    }
  };

  const handleAddFamilyMember = () => {
    setGuestsList([
      ...guestsList,
      { id: Date.now() + Math.random(), firstName: "", lastName: "", attending: "Attending", dietary: "" }
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
    setIsEditing(false);
  };

  const handleAddSong = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!songTitle || !songArtist) return;
    const songId = `song-${Date.now()}`;
    const newSong = { id: songId, title: songTitle, artist: songArtist, requester: songRequester || "Anonymous Guest" };
    setPlaylistRequests([newSong, ...playlistRequests]);
    
    const updatedMySongs = [...mySongIds, songId];
    setMySongIds(updatedMySongs);
    localStorage.setItem("my_song_requests", JSON.stringify(updatedMySongs));

    setSongTitle("");
    setSongArtist("");
    setSongRequester("");
  };

  const handleDeleteSong = (id: string) => {
    setPlaylistRequests(prev => prev.filter(song => song.id !== id));
    const updated = mySongIds.filter((songId: string) => songId !== id);
    setMySongIds(updated);
    localStorage.setItem("my_song_requests", JSON.stringify(updated));
  };

  // Add Message & Track Session IDs
  const handleAddMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tempGuestName || !tempMessage) return;
    const messageId = `msg-${Date.now()}`;
    const newMsg = { id: messageId, name: tempGuestName, message: tempMessage, date: "Just now" };
    setLedgerMessages([newMsg, ...ledgerMessages]);

    const updatedMyMsgs = [...myMessageIds, messageId];
    setMyMessageIds(updatedMyMsgs);
    localStorage.setItem("my_ledger_messages", JSON.stringify(updatedMyMsgs));

    setTempGuestName("");
    setTempMessage("");
  };

  // Save edited message details
  const handleSaveEditMessage = (id: string) => {
    setLedgerMessages(prev => prev.map(msg => msg.id === id ? { ...msg, message: editingMessageText } : msg));
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  // Navigation Toggle helpers
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const triggerOpenRsvp = () => {
    setIsRsvpOpen(!isRsvpOpen);
    setIsMenuOpen(false);
  };

  const scrollToAnchor = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const refreshGallery = async () => {
    const res = await fetch('/api/gallery'); 
    const data = await res.json();
    
    const publicBaseUrl = "https://pub-24a198c3bcd44e7ab19fd37353cb5c07.r2.dev";
    
    const itemsWithUrls = data.images.map((key: string) => {
      const lowerKey = key.toLowerCase();
      const isVideoFile = 
        lowerKey.endsWith('.mp4') || 
        lowerKey.endsWith('.mov') || 
        lowerKey.endsWith('.m4v') || 
        lowerKey.endsWith('.webm') ||
        lowerKey.includes('.mp4') || 
        lowerKey.includes('.mov');

      return {
        key,
        url: `${publicBaseUrl}/${key}`,
        type: isVideoFile ? 'video' : 'image'
      };
    });
    
    setMediaGallery(itemsWithUrls);
  };

  useEffect(() => {
    refreshGallery();
  }, []);
  
  // ============================================================================
  // REDESIGNED AUTHENTICATION PORTAL (Luxury Minimalist Card Entrance)
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${COUPLE_PHOTOS.pre_map})`, filter: 'blur(12px) brightness(0.5)' }}
        />
        
        {/* Fine-art luxury monoline entrance card */}
        <div className="relative z-10 w-full max-w-sm bg-[#FDFBF7] rounded-sm p-10 sm:p-14 shadow-2xl text-center flex flex-col items-center">
          {/* Double delicate border accent inside */}
          <div className="absolute inset-2.5 border border-[#EADCC9]/80 pointer-events-none" />
          <div className="absolute inset-[14px] border border-[#EADCC9]/40 pointer-events-none" />
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-[#C5A880] flex items-center justify-center mb-8">
              <Lock className="w-4 h-4 text-[#C5A880] stroke-[1.5px]" />
            </div>
            
            <h1 className="font-serif text-2xl sm:text-3xl text-[#4A433A] tracking-widest font-light mb-2">
              Arthur & Sophie
            </h1>
            <p className="text-[#9C8F7E] text-[8px] sm:text-[9px] uppercase tracking-[0.4em] mb-10 font-semibold">
              The Wedding Celebration
            </p>

            <form onSubmit={handleAuthSubmit} className="w-full space-y-8">
              <div className="space-y-2">
                <span className="text-[8px] uppercase tracking-[0.3em] text-[#C5A880] block font-bold">Private Access Key</span>
                <input
                  type="password"
                  placeholder="Enter Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-2 bg-transparent border-b border-[#DCD3BD] text-center font-mono tracking-widest text-[#4A433A] placeholder-[#C5A880]/30 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
              </div>
              {authError && (
                <p className="text-red-500 text-[10px] tracking-widest font-medium uppercase">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full py-4 bg-[#C5A880] text-white font-serif tracking-[0.3em] text-[9px] uppercase hover:bg-[#B3966E] transition-all duration-300 shadow-sm"
              >
                Request Entrance
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#5C5346] font-sans selection:bg-[#C5A880] selection:text-white pb-20 relative overflow-x-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Fascinate&family=Fascinate+Inline&display=swap');
        .script-font {
          font-family: 'Alex Brush', cursive !important;
          transform: rotate(-2deg);
        }
      `}</style>

      {/* ============================================================================
          BLOCK 1: THE WELCOME ARENA (Vogue-Editorial Cover Redesign)
          ============================================================================ */}
      <section id="hero" className="relative h-screen flex flex-col items-center justify-between text-center overflow-hidden pt-12 pb-16">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] scale-105"
          style={{ backgroundImage: `url(${COUPLE_PHOTOS.hero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

        <div className="absolute top-6 right-6 z-30">
          <button 
            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[9px] font-medium tracking-widest text-white border border-white/20 hover:bg-white/20 transition-all active:scale-95"
          >
            {isMusicPlaying ? (
              <>
                <Volume2 className="w-3 h-3 text-[#C5A880] animate-bounce" />
                <span>CHIMES: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-white/70" />
                <span className="text-white/70">MUTED</span>
              </>
            )}
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center mt-32 px-4">
          <span className="text-white/80 uppercase tracking-[0.5em] text-[9px] sm:text-[10px] mb-8 font-light">
            The Wedding Celebration Of
          </span>
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-serif font-light tracking-[0.25em] leading-tight uppercase">
            JESSICA
            <br />
            <span className="text-2xl sm:text-3xl text-[#EADCC9] italic mx-2 font-thin lowercase block my-3">&</span>
            WILLIAM
          </h1>
        </div>

        <div 
          className="relative z-10 flex flex-col items-center text-white/90 animate-bounce cursor-pointer opacity-80 hover:opacity-100 transition-opacity" 
          onClick={() => scrollToAnchor('countdown-anchor')}
        >
          <span className="text-[9px] uppercase tracking-[0.4em] mb-4 font-serif font-light">Begin</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ============================================================================
          BLOCK 2: TIMELINE EVENT COUNTDOWN CLOCK
          ============================================================================ */}
      <section id="countdown-anchor" className="py-20 px-4 bg-[#FDFBF7] relative overflow-hidden flex flex-col items-center justify-center border-b border-[#EADCC9]/30">
        <div className="text-center space-y-8 relative z-10 max-w-2xl w-full">
          
          <div className="space-y-3">
            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">The Promise</span>
            <p className="font-serif italic text-base sm:text-lg text-[#7D7261] tracking-wide">
              "Counting down to our forever..."
            </p>
          </div>
          <div className="flex items-center justify-center gap-5 sm:gap-10">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#BE123C] tracking-wider">{timeLeft.days}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Days</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#BE123C] tracking-wider">{timeLeft.hours}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Hours</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#BE123C] tracking-wider">{timeLeft.minutes}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Mins</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#BE123C] tracking-wider">{timeLeft.seconds}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Secs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================
          BLOCK 3: THE RELATIONSHIP CHRONICLE
          ============================================================================ */}
      <section id="story" className="py-24 px-4 bg-[#FAF6F0]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-24">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Chronology of Us</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Our Story</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          </div>

          <div className="relative">
            {/* Center Timeline Line (Visible on Mobile & Desktop) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-[#C5A880]" />

            <div className="space-y-16 md:space-y-24 relative z-10">
              
              {/* Story Event 1 (Desktop: Text L, Image R. Mobile: Text B, Image T) */}
              <div className="flex flex-col md:flex-row items-center w-full relative">
                {/* Center Floating Date Pill */}
                <div className="flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#C5A880] shadow-sm items-center justify-center z-20 mb-6 md:mb-0 order-1 md:order-none">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Nov 14, 2021</span>
                </div>

                <div className="w-full md:w-1/2 md:pr-16 flex flex-col items-center md:items-end text-center md:text-right order-3 md:order-1 mt-6 md:mt-0 px-4 md:px-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">First Coffee Sparks</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm mx-auto md:mr-0 md:ml-auto">
                      Fate collided in a corner café in Melbourne on a rainy afternoon. What was supposed to be a ten-minute coffee turned into a four-hour deep dialogue about music, art, and lifetime philosophies.
                    </p>
                  </FadeInSection>
                </div>
                
                <div className="w-full md:w-1/2 md:pl-16 flex justify-center md:justify-start order-2 md:order-2 z-10">
                  <img src={COUPLE_PHOTOS.story1} alt="First sparks" className="w-4/5 max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                </div>
              </div>

              {/* Story Event 2 (Desktop: Image L, Text R. Mobile: Text B, Image T) */}
              <div className="flex flex-col md:flex-row items-center w-full relative">
                {/* Center Floating Date Pill */}
                <div className="flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#C5A880] shadow-sm items-center justify-center z-20 mb-6 md:mb-0 order-1 md:order-none">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Aug 18, 2024</span>
                </div>

                <div className="w-full md:w-1/2 md:pr-16 flex justify-center md:justify-end order-2 md:order-1 z-10">
                  <img src={COUPLE_PHOTOS.story2} alt="Proposal" className="w-4/5 max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                </div>

                <div className="w-full md:w-1/2 md:pl-16 flex flex-col items-center md:items-start text-center md:text-left order-3 md:order-2 mt-6 md:mt-0 px-4 md:px-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">The Sunset Proposal</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm mx-auto md:ml-0 md:mr-auto">
                      Surrounded by golden sand dunes and the soothing melody of ocean waves, Arthur dropped on one knee. With tears, laughter, and an absolute whisper of certainty, Sophie said "Yes!"
                    </p>
                  </FadeInSection>
                </div>
              </div>

              {/* Story Event 3 (Desktop: Text L, Image R. Mobile: Text B, Image T) */}
              <div className="flex flex-col md:flex-row items-center w-full relative">
                {/* Center Floating Date Pill */}
                <div className="flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#C5A880] shadow-sm items-center justify-center z-20 mb-6 md:mb-0 order-1 md:order-none">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Looking Ahead</span>
                </div>

                <div className="w-full md:w-1/2 md:pr-16 flex flex-col items-center md:items-end text-center md:text-right order-3 md:order-1 mt-6 md:mt-0 px-4 md:px-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">The Golden Future</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm mx-auto md:mr-0 md:ml-auto">
                      Now we are carving our path toward a lifetime of mutual laughter, shared dreams, growing our small home sanctuary, and traveling to wild untamed horizons.
                    </p>
                  </FadeInSection>
                </div>
                
                <div className="w-full md:w-1/2 md:pl-16 flex justify-center md:justify-start order-2 md:order-2 z-10">
                  <img src={COUPLE_PHOTOS.story3} alt="Future plans" className="w-4/5 max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================
          BLOCK 4: THE EXACT SCROLL-TRIGGERED ENVELOPE
          ============================================================================ */}
      <section className="py-24 px-4 bg-[#FDFBF7] flex flex-col items-center min-h-[700px] justify-center overflow-visible">
        <div className="max-w-xl w-full text-center">

          {/* Interactive Envelope Container - Clean, borderless on the background */}
          <div 
            ref={envelopeRef} 
            className="relative w-[280px] sm:w-[340px] h-[200px] sm:h-[240px] mx-auto mb-20 select-none overflow-visible animate-pulse-subtle"
            style={{ perspective: '1200px' }}
          >
            {/* Back Plate */}
            <div className="absolute inset-0 bg-[#E8E1D5] rounded-sm shadow-inner border border-[#D5CBA7] overflow-hidden z-0">
              <div className="absolute inset-1 bg-[#EBE5DA] rounded-sm" />
            </div>

            {/* Polaroid photo inside - slides upwards out of sleeve, layered with z-10 */}
            <div 
              className="absolute left-4 right-4 bottom-[-60px] h-[210px] sm:h-[255px] bg-white p-2 sm:p-3 pb-6 sm:pb-8 rounded-sm shadow-xl border border-slate-200/60 transition-all duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)] z-10"
              style={{
                transform: envelopeVisible ? 'translateY(-160px) rotate(1deg) scale(1.02)' : 'translateY(10px) rotate(0deg) scale(0.95)',
                opacity: envelopeVisible ? 1 : 0,
                pointerEvents: envelopeVisible ? 'auto' : 'none'
              }}
            >
              <img 
                src={COUPLE_PHOTOS.envelope_couple} 
                alt="Envelope portrait" 
                className="w-full h-[175px] sm:h-[210px] object-cover rounded-sm border border-slate-100" 
              />
            </div>

            {/* Front Pouch Layer with V-cut, layered with z-20 */}
            <svg viewBox="0 0 400 280" preserveAspectRatio="none" className="absolute inset-0 w-full h-full drop-shadow-xl z-20 pointer-events-none">
              <polygon points="0,280 0,0 200,160" fill="#F4EFE8" stroke="#E3D8C8" strokeWidth="1" />
              <polygon points="400,280 400,0 200,160" fill="#F0EBE3" stroke="#E3D8C8" strokeWidth="1" />
              <polygon points="0,280 400,280 200,158" fill="#F7F3ED" stroke="#E3D8C8" strokeWidth="1" />
            </svg>

            {/* Opening top triangular flap - Dynamically sets zIndex lower when open so picture slides OVER the flap */}
            <div 
              className="absolute top-0 inset-x-0 h-[115px] sm:h-[138px] origin-top transition-all duration-[1200ms] ease-in-out pointer-events-none"
              style={{ 
                transform: envelopeVisible ? 'rotateX(180deg)' : 'rotateX(0deg)',
                zIndex: envelopeVisible ? 5 : 30,
              }}
            >
              <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full drop-shadow-md">
                <polygon points="0,0 400,0 200,160" fill="#F4EFE8" stroke="#E3D8C8" strokeWidth="1" />
              </svg>
            </div>

            {/* Precise Calligraphy & Red Cord ribbon elements on Front Pouch - Opacity always stays fully 100% */}
            <div className="absolute top-[52%] sm:top-[54%] inset-x-0 flex flex-col items-center z-40 pointer-events-none">
              {/* Adjusted Hand-Drawn Bow Tie */}
              <div className="w-[80px] sm:w-24 h-auto -mt-3">
                <svg viewBox="0 0 100 50" fill="none" className="w-full h-full">
                  {/* Left Loop (Wide but balanced) */}
                  <path d="M50,25 C25,5 5,10 15,30 C20,40 45,35 50,25" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Right Loop (Made Bigger/Wider) */}
                  <path d="M50,25 C85,5 105,15 90,30 C80,35 60,30 50,25" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Center knot */}
                  <circle cx="50" cy="26" r="3" fill="#BE123C" />
                  
                  {/* Hanging ends - Left is significantly longer */}
                  <path d="M48,27 C30,45 25,55 35,55" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M52,27 C60,40 65,42 60,42" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              
              {/* Debossed Heart */}
              <div className="mt-0 mb-3">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path 
                    d="M12 21.3C12 21.3 2 14.5 2 8.5C2 5 4.8 2 8 2C10 2 11.5 3.5 12 5C12.5 3.5 14 2 16 2C19.2 2 22 5 22 8.5C22 14.5 12 21.3 12 21.3Z" 
                    fill="#FDFBF7" 
                    fillOpacity="0.4" 
                    stroke="#FDFBF7" 
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* "Our wedding" elegant calligraphic cursive script (Always Visible) */}
              <div className="mt-2 text-center select-none">
                <span 
                  className="block text-[#BE123C] text-[37px] sm:text-3xl md:text-4xl leading-none tracking-wide -mt-4 mb-6"
                  style={{ fontFamily: "'Alex Brush', 'Brush Script MT', cursive", transform: "rotate(-2deg)" }}
                >
                  Our Wedding
                </span>
                {/* <span className="block text-[6px] sm:text-[7px] text-[#5C5346] tracking-[0.4em] uppercase mt-1">WEDDING</span> */}
              </div>
            </div>

          </div>

          <div className="space-y-6 pt-6 text-center relative z-20">
            <h3 className="font-serif text-lg tracking-[0.2em] text-[#5C5346]">Inviting You To Our Wedding</h3>
            <div className="flex justify-center items-center gap-4 text-2xl font-serif text-[#4A433A]">
              <span>Jessica</span>
              <span className="text-rose-700 font-thin">∞</span>
              <span>William</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#9C8F7E] block font-serif">Save the Date</span>
              <div className="w-8 h-[1px] bg-[#EADCC9] mx-auto my-2" />
            </div>
          </div>

          <div className="max-w-sm mx-auto px-4 py-2 mt-4 relative z-20">
            <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-serif text-[#9C8F7E] lowercase border-b border-[#EADCC9]/40 pb-2 mb-3">
              <span>sun</span><span>mon</span><span>tues</span><span>wed</span><span>thu</span><span>fri</span><span>sat</span>
            </div>
            <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-xs text-[#7D7261] font-serif">
              <span className="text-[#D5CBA7]">28</span>
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              <div className="relative flex items-center justify-center font-bold text-rose-700">
                <span className="relative z-10">6</span>
                <div className="absolute inset-0 flex items-center justify-center text-rose-700/80 scale-125">
                  <Heart className="w-6 h-6 stroke-[1px] fill-transparent" />
                </div>
              </div>
              <span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span>
              <span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span><span>20</span>
              <span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span><span>27</span>
              <span>28</span><span>29</span><span>30</span><span>31</span>
              <span className="text-[#D5CBA7]">1</span><span>2</span><span>3</span>
            </div>

            <div className="mt-8 space-y-2 text-center text-[#5C5346]">
              <span className="text-[10px] uppercase tracking-widest text-[#9C8F7E] block italic">Date</span>
              <div className="space-y-0.5">
                <p className="font-serif text-lg tracking-wider text-[#4A433A]">06·03·2027</p>
                <p className="text-xs text-[#7D7261]">农历正月廿九 周六</p>
              </div>
              <div className="w-12 h-[1px] bg-[#EADCC9]/40 mx-auto my-3" />
              <span className="text-[10px] uppercase tracking-widest text-[#9C8F7E] block italic">Reception</span>
              <p className="font-serif text-xl text-[#4A433A]">12:08</p>
            </div>
          </div>

          <div className="flex flex-col items-center pt-8 space-y-4 relative z-20">
            <p className="text-[10px] text-[#D5CBA7] italic tracking-wider max-w-xs mx-auto">
              Sincerely invite you. Come and share this wonderful day with us.
            </p>
            
            <div className="pt-4 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8E1C24] via-[#751117] to-[#45090C] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_10px_rgba(117,17,23,0.4)] border border-[#3E090B] flex items-center justify-center relative select-none cursor-pointer transform hover:scale-110 active:scale-95 transition-all duration-300">
                <Heart className="w-4 h-4 text-[#FDEAEA] fill-current opacity-85 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                <div className="absolute inset-[3px] rounded-full border border-[#FDEAEA]/10 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Map Photo Frame */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-12">
        <img src={COUPLE_PHOTOS.pre_map} alt="Pre-map presentation" className="w-full h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" />
      </div>

      {/* ============================================================================
          BLOCK 5: INTERACTIVE TRANSIT MAP & NAVIGATION ROUTING
          ============================================================================ */}
      <section id="map" className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-2xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">The Location Sanctuary</span>
            <h2 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">Grand Manor Pavilion</h2>
            <p className="text-sm text-[#7D7261]">14 Heritage Boulevard, Bowral NSW 2576</p>
          </div>

          <div className="rounded-sm overflow-hidden shadow-md border border-[#EADCC9] aspect-video relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3312.2743516518776!2d150.8524456762391!3d-33.88262701977755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12946be48baab3%3A0x6b57904e287fffc2!2sSydney%2C%20NSW!5e0!3m2!1sen!2sau!4v1711234567890!5m2!1sen!2sau" 
              className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700" 
              allowFullScreen={true}
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <a 
            href="http://googleusercontent.com/maps.google.com/dir/?api=1&destination=Bowral+NSW+2576" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 border border-[#BE123C] text-[#BE123C] font-semibold text-xs tracking-widest uppercase hover:bg-[#C5A880] hover:text-white transition-all active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Route Directions</span>
          </a>
        </div>
      </section>

      {/* ============================================================================
          BLOCK 6: TRANSPORTATION STEP-BY-STEP GUIDE
          ============================================================================ */}
      <section className="py-12 px-4 bg-[#FAF6F0] border-y border-[#EADCC9]/40">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <Car className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Driving Route</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Take the Southern Freeway (M31) heading South from Sydney. Exit toward Bowral/Mitagong.
            </p>
          </div>

          <div className="text-center space-y-3">
            <MapPin className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Free Parking</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Private gated parking is entirely complimentary inside the Grand Manor Estate.
            </p>
          </div>

          <div className="text-center space-y-3">
            <Info className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Rail Transit</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Arrive at Bowral Station. A private wedding shuttle bus will cycle to pick up guests at 2:15 PM.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full max-w-4xl mx-auto px-4 mt-20">
        <img 
          src={COUPLE_PHOTOS.couple_pic} 
          alt="Elegance dress code prelude" 
          className="w-full h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" 
        />
      </div>

      {/* ============================================================================
          BLOCK 7: Wedding Itinerary & Dress Code Guide
          ============================================================================ */}
      <section id="timings" className="py-24 px-4 bg-[#FDFBF7]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-bold">The Sequence</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Wedding Itinerary</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          </div>

          <div className="relative">
            {/* Center Axis Line - Standard absolute placement across all viewports */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-[#C5A880]" />

            <div className="space-y-12 relative z-10">
              {[
                { time: "2:00 PM", title: "Tea Ceremony", desc: "Traditional morning family\nheritage blessing." },
                { time: "3:00 PM", title: "Guest Arrival", desc: "Champagne welcoming, serene\nviolin prelude." },
                { time: "3:30 PM", title: "The Sacred Vows", desc: "Outdoors in the sunken garden\ncourtyard." },
                { time: "4:30 PM", title: "Cocktail Hour", desc: "Sip custom botanical gin tonics\n& meet other guests." },
                { time: "6:00 PM", title: "Grand Banquet", desc: "A four-course culinary journey,\nheartfelt speeches." },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-row items-center w-full relative">
                  <div className="w-1/2 pr-6 sm:pr-12 text-right">
                    <span className="font-serif italic text-sm sm:text-lg text-[#C5A880] tracking-wide">{item.time}</span>
                  </div>
                  
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-[#C5A880] ring-4 ring-[#FDFBF7] z-20" />
                  
                  <div className="w-1/2 pl-6 sm:pl-12 text-left">
                    <h4 className="font-serif font-bold text-sm sm:text-xl text-[#4A433A] mb-1">{item.title}</h4>
                    {/* Added whitespace-pre-line to respect the \n character */}
                    <p className="text-[11px] sm:text-sm text-[#7D7261] leading-relaxed max-w-xs whitespace-pre-line">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8 pt-20 mt-10 text-center border-t border-[#EADCC9]/50">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-bold">Attire Etiquette</span>
              <h2 className="text-2xl font-serif font-light text-[#4A433A] tracking-wide">Dress Code Guide</h2>
              <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-2" />
            </div>
            <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-lg mx-auto">We respectfully invite our elegant family and friends to match our theme and blend into our story with soft, sophisticated earthy tones. Please wear semi-formal attire:</p>
            <div className="flex flex-wrap justify-center gap-6 pt-4 max-w-2xl mx-auto">
              {[
                { hex: "bg-[#F3EFE0]", name: "Warm Champagne" }, { hex: "bg-[#D8C3A5]", name: "Soft Sand" },
                { hex: "bg-[#8E8D8A]", name: "Earthy Taupe" }, { hex: "bg-[#EAE7DC]", name: "Natural Linen" },
                { hex: "bg-[#D9B08C]", name: "Warm Gold" }, { hex: "bg-[#116466]", name: "Deep Sage" },
              ].map((color, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-3 group cursor-pointer w-20">
                  <div className={`w-12 h-12 rounded-full ${color.hex} shadow-sm border border-white/50 ring-1 ring-[#EADCC9] group-hover:ring-[#C5A880] transition-all duration-300 transform group-hover:scale-105`} />
                  <span className="text-[9px] text-center text-[#7D7261] uppercase tracking-widest leading-tight">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pre-RSVP Backdrop Photo */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-8">
        <img src={COUPLE_PHOTOS.pre_rsvp} alt="RSVP transition layout" className="w-full h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" />
      </div>
      {/* ============================================================================
          BLOCK 8: THE RSVP
          ============================================================================ */}
      <section className="py-24 px-4 bg-[#FAF6F0] flex justify-center">
        <div className="bg-white border border-[#EADCC9] shadow-2xl p-8 sm:p-12 rounded-sm max-w-2xl w-full text-center relative overflow-hidden">
          
          <div className="absolute inset-3 border border-[#EADCC9]/60 border-dashed pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center space-y-6">
            <Heart className="w-6 h-6 text-[#C5A880] fill-current opacity-80" />
            
            <div className="space-y-2">
              <h2 className="font-serif text-3xl sm:text-4xl text-[#4A433A] tracking-wide">Répondez S'il Vous Plaît</h2>
              <div className="w-16 h-[1px] bg-[#C5A880] mx-auto" />
            </div>

            <div className="py-4">
              <p className="text-[10px] sm:text-xs text-[#9C8F7E] tracking-[0.3em] uppercase mb-1">Kindly reply by</p>
              <br></br>
              <p className="font-serif text-xl sm:text-2xl text-[#BE123C] italic">February 15, 2027</p>
            </div>

            <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-md mx-auto px-4 pb-6 border-b border-[#FAF6F0]">
              We eagerly await your response to finalize our preparations for this magical day. Please register your attendance status and note any strict dietary requirements.
            </p>

            <button
              onClick={triggerOpenRsvp}
              className="inline-flex items-center gap-3 px-10 py-4 bg-[#C5A880] text-white font-serif font-semibold text-sm tracking-[0.2em] rounded-sm shadow-lg hover:bg-[#B3966E] transition-all transform hover:-translate-y-0.5 active:scale-95 uppercase"
            >
              <Users className="w-4 h-4" />
              <span>Please RSVP Here</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================================
          BLOCK 9: LAYERED RECORD VISUALIZER PRE-HUB
          ============================================================================ */}
      <section id="interactive" className="py-24 px-4 bg-[#FDFBF7] flex flex-col items-center">
        <div className="w-full max-w-[360px] relative flex flex-col items-center pt-8">

          {/* 1. Black Vinyl Background (Z-10) */}
          <div 
            className={`absolute top-0 w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] rounded-full shadow-2xl bg-[#111111] border-[5px] border-[#222222] shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex items-center justify-center z-10 ${isMusicPlaying ? "animate-[spin_4s_linear_infinite]" : ""}`}
            style={{ backgroundImage: "repeating-radial-gradient(circle, #222222, #111111 2px, #222222 4px)" }}
          >
            <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full pointer-events-none">
              <path id="vinyl-curve" d="M 40,160 A 120,120 0 0,1 280,160" fill="transparent" />
              <text className="text-[14px] uppercase tracking-[0.4em] font-serif fill-[#FDFBF7] opacity-90">
                <textPath href="#vinyl-curve" startOffset="50%" textAnchor="middle">
                  《 A Single Thought 》
                </textPath>
              </text>
            </svg>
            <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-20 rounded-full border border-white/10 pointer-events-none" />
          </div>

          {/* 2. Main Portrait Photo (Z-0) */}
          <div className="relative z-0 w-full bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-white mt-[210px] sm:mt-[230px]">
            <img src={COUPLE_PHOTOS.pre_rsvp} className="w-full h-[480px] sm:h-[520px] object-cover" alt="Couple portrait" />
            
            {/* Sleek Frosted Glass Play/Pause Button */}
            <button
              onClick={() => setIsMusicPlaying(!isMusicPlaying)}
              className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-all hover:bg-white/30 active:scale-95 z-30"
            >
              {isMusicPlaying ? (
                <Pause className="w-5 h-5 fill-white text-white" />
              ) : (
                <Play className="w-5 h-5 fill-white text-white ml-1" />
              )}
              {/* Spinning decorative ring when playing */}
              <div className={`absolute -inset-1.5 rounded-full border border-white/40 border-dashed pointer-events-none ${isMusicPlaying ? 'animate-[spin_8s_linear_infinite]' : 'hidden'}`} />
            </button>

            {/* Elegant Audio Visualizer */}
            <div className="absolute bottom-8 left-6 flex items-end gap-[3px] h-8 z-30 opacity-90">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div 
                  key={bar} 
                  className={`w-[3px] bg-white rounded-t-sm transition-all duration-300 ${isMusicPlaying ? 'opacity-100' : 'opacity-40'}`} 
                  style={{ 
                    height: isMusicPlaying ? `${Math.max(6, Math.random() * 24)}px` : '4px',
                    transitionDelay: `${bar * 50}ms` 
                  }} 
                />
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>

          {/* 3. Quote Card (Z-20, Overlapping Vinyl and Photo) */}
          <div className="absolute top-[180px] sm:top-[200px] z-20 w-[120%] bg-white/85 px-6 py-8 pt-10 rounded-sm shadow-[0_0px_15px_rgba(0,0,0,0.80)] border border-white/50 text-center">
            <p className="font-serif italic text-xs sm:text-sm leading-loose text-[#5C5346] tracking-wide">
              "If the sun were to rise in the west, <br />
              I'd never change my mind to love you forever. <br />
              I love you not for who you are, but for who I am before you."
            </p>
          </div>

          {/* 4. Vinyl Center Photo (Z-30, Overlapping Quote Card) */}
          <div className="absolute top-[100px] sm:top-[110px] z-30 w-[110px] h-[110px] rounded-full bg-[#FDFBF7] border-[3px] border-[#FDFBF7] shadow-xl overflow-hidden flex items-center justify-center">
            <img 
              src={COUPLE_PHOTOS.vinyl_center} 
              alt="Center Spindle" 
              className={`w-full h-full object-cover ${isMusicPlaying ? "animate-[spin_4s_linear_infinite]" : ""}`} 
            />
            <div className="absolute w-3 h-3 rounded-full bg-[#FDFBF7] shadow-inner" />
          </div>

        </div>
      </section>
      {/* ============================================================================
          BLOCK 10 & 11: SONG REQUESTS & LEDGER
          ============================================================================ */}
      <section id="song-requests" className="py-24 px-4 bg-[#FAF6F0]">
        <div className="max-w-3xl mx-auto flex flex-col space-y-24">
          
          {/* Song Requests Section (On Top) */}
          <div className="space-y-8 bg-white p-8 sm:p-12 border border-[#EADCC9] shadow-sm rounded-sm">
            <div className="text-center space-y-2 border-b border-[#EADCC9]/50 pb-6">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">The Soundtrack</span>
              <h3 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">Request a Song</h3>
              <p className="text-xs text-[#7D7261] max-w-md mx-auto pt-2">
                Help our DJ shape the dance floor! Recommend your ultimate favorite celebratory or romantic song.
              </p>
            </div>
            <form onSubmit={handleAddSong} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Song Title"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#EADCC9] text-sm focus:outline-none focus:border-[#C5A880] placeholder-[#9C8F7E]"
                  required
                />
                <input
                  type="text"
                  placeholder="Artist"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#EADCC9] text-sm focus:outline-none focus:border-[#C5A880] placeholder-[#9C8F7E]"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={songRequester}
                onChange={(e) => setSongRequester(e.target.value)}
                className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#EADCC9] text-sm focus:outline-none focus:border-[#C5A880] placeholder-[#9C8F7E]"
              />
              <div className="flex justify-center pt-4">
                <button type="submit" className="px-10 py-4 bg-[#C5A880] text-white text-xs tracking-widest uppercase hover:bg-[#B3966E] transition-all rounded-sm shadow-sm">
                  Submit Request
                </button>
              </div>
            </form>

            {playlistRequests.length > 0 && (
              <div className="pt-8 border-t border-[#FAF6F0]">
                <h4 className="font-serif text-lg mb-4 text-[#4A433A] text-center">Playlist Queue</h4>
                <div className="flex flex-wrap gap-3 justify-center">
                  {playlistRequests.map((s) => (
                    <span key={s.id} className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FAF6F0] text-[#7D7261] text-xs border border-[#EADCC9]/50 shadow-sm gap-2">
                      <Music className="w-3 h-3 text-[#C5A880]" />
                      <span className="font-semibold text-[#4A433A]">{s.title}</span> by {s.artist}
                      
                      {/* Delete icon visible only if song was added in current browser session */}
                      {mySongIds.includes(s.id) && (
                        <button 
                          onClick={() => handleDeleteSong(s.id)}
                          className="ml-1 text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Journal Ledger Section (On Bottom with Edit Management) */}
          <div className="space-y-8 bg-white p-8 sm:p-12 border border-[#EADCC9] shadow-sm rounded-sm">
            <div className="text-center space-y-2 border-b border-[#EADCC9]/50 pb-6">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Guestbook</span>
              <h3 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">Journal Ledger</h3>
              <p className="text-xs text-[#7D7261] max-w-md mx-auto pt-2">
                Leave a beautiful digital note of congratulations, love, or life-long marriage advice.
              </p>
            </div>
            <form onSubmit={handleAddMessage} className="space-y-6 pt-4">
              <input
                type="text"
                placeholder="Your Name"
                value={tempGuestName}
                onChange={(e) => setTempGuestName(e.target.value)}
                className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#EADCC9] text-sm focus:outline-none focus:border-[#C5A880] placeholder-[#9C8F7E]"
                required
              />
              <textarea
                placeholder="Write your note..."
                rows="3"
                value={tempMessage}
                onChange={(e) => setTempMessage(e.target.value)}
                className="w-full px-0 py-3 bg-transparent border-0 border-b border-[#EADCC9] text-sm focus:outline-none focus:border-[#C5A880] placeholder-[#9C8F7E]"
                required
              />
              <div className="flex justify-center pt-4">
                <button type="submit" className="px-10 py-4 bg-[#C5A880] text-white text-xs tracking-widest uppercase hover:bg-[#B3966E] transition-all rounded-sm shadow-sm">
                  Publish Note
                </button>
              </div>
            </form>

            <div className="pt-8 border-t border-[#FAF6F0]">
              <h4 className="font-serif text-lg mb-6 text-[#4A433A] text-center flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C5A880]" /> Message Board
              </h4>
              <div className="space-y-8">
                {ledgerMessages.slice(0, 5).map((msg) => (
                  <div key={msg.id} className="text-center space-y-2 border-b border-dashed border-[#EADCC9]/30 pb-4 last:border-b-0 last:pb-0">
                    {editingMessageId === msg.id ? (
                      <div className="space-y-3 max-w-md mx-auto bg-[#FAF6F0] p-4 rounded-sm border border-[#EADCC9]">
                        <textarea
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                          className="w-full p-2 text-xs border border-[#EADCC9] bg-white focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 text-[10px] tracking-wider uppercase font-semibold">
                          <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 border border-[#EADCC9] bg-white">Cancel</button>
                          <button onClick={() => handleSaveEditMessage(msg.id)} className="px-3 py-1.5 bg-[#C5A880] text-white">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-[#7D7261] italic leading-relaxed">"{msg.message}"</p>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-[10px] uppercase tracking-widest text-[#9C8F7E] font-semibold">— {msg.name}</p>
                          
                          {/* Edit button visible only if comment was added in current browser session */}
                          {myMessageIds.includes(msg.id) && (
                            <button 
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditingMessageText(msg.message);
                              }}
                              className="text-xs text-[#C5A880] hover:text-[#B3966E] flex items-center gap-1 ml-2 border border-[#EADCC9]/50 px-2 py-0.5 bg-[#FAF6F0] hover:bg-[#F5ECE1] rounded-sm transition-all"
                              title="Edit Message"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Button to view all ledger messages inside Archive Overlay */}
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setShowAllMessages(true)}
                  className="px-6 py-2 border border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880]/10 text-[10px] tracking-widest uppercase rounded-sm transition-colors"
                >
                  Browse Ledger Archives ({ledgerMessages.length})
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================================
          BLOCK 12: SHARED GALLERY PREVIEW & UPLOAD (MAIN PAGE FEED)
          ============================================================================ */}
      <section id="gallery-header" className="py-24 px-4 bg-[#FDFBF7] overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Capture the Day</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Our Shared Gallery</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
            <p className="text-xs text-[#7D7261] max-w-md mx-auto pt-4 leading-relaxed">
              Welcome to our live collective album. Please click the camera upload button below to instantly broadcast your photos from the wedding evening!
            </p>
          </div>

          <div className="flex justify-center">
            <label className="flex items-center gap-3 px-10 py-4 bg-white border border-[#BE123C] text-[#BE123C] font-semibold text-xs tracking-[0.2em] uppercase rounded-sm shadow-sm hover:bg-[#FAF6F0] transition-all cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>Upload Moments</span>
              <input type="file" multiple accept="image/*,video/mp4,video/quicktime,video/x-m4v" onChange={handleMediaUpload} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {mediaGallery.slice(0, 6).map((media, idx) => {
              const isVideo = 
                media.type?.startsWith?.('video') || 
                media.type === 'video' || 
                /\.(mp4|mov|m4v|webm|avi|mkv)/i.test(media.url);

              return (
                <div 
                  key={idx} 
                  onClick={() => setLightboxIndex(idx)}
                  className="aspect-square bg-[#EADCC9] overflow-hidden relative group rounded-sm cursor-pointer"
                >
                  {isVideo ? (
                    <video src={media.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                  ) : (
                    <img 
                      src={media.url} 
                      alt="Wedding moment" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 group-hover:opacity-100" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* This button triggers the Full Grid Modal we just finished! */}
          {mediaGallery.length > 6 ? (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowGalleryGrid(true)}
                className="px-8 py-3 bg-transparent border border-[#C5A880] text-[#C5A880] text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-[#C5A880] hover:text-white transition-all"
              >
                View Full Grid
              </button>
            </div>
          ) : (
            mediaGallery.length > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowGalleryGrid(true)}
                  className="px-8 py-3 bg-transparent border border-[#C5A880] text-[#C5A880] text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-[#C5A880] hover:text-white transition-all"
                >
                  Manage Gallery
                </button>
              </div>
            )
          )}

        </div>
      </section>

      {/* ============================================================================
          BLOCK 12: FULL GALLERY GRID INTERACTIVE OVERLAY MODAL
          ============================================================================ */}
      {showGalleryGrid && (
        <div className="fixed inset-0 z-50 bg-[#FDFBF7] flex flex-col animate-fade-in">
          
          <div className="sticky top-0 z-40 bg-[#FDFBF7] border-b border-[#EADCC9] shadow-sm px-4 sm:px-10 py-4 sm:py-6 flex justify-between items-center">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#4A433A]">Full Gallery</h2>
              <p className="text-xs text-[#7D7261] mt-1 hidden sm:block">Select photos to manage your uploads.</p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {!isDeleteMode ? (
                <button
                  onClick={() => setIsDeleteMode(true)}
                  className="text-[11px] font-sans tracking-wider uppercase border border-[#EADCC9] text-[#7D7261] px-4 py-2 rounded-sm hover:bg-[#FAF6F0] transition-all bg-white shadow-sm"
                >
                  Manage My Files
                </button>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  {selectedKeys.length > 0 && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      // Swapped failing hex color for standard Tailwind rose-800 so it always renders
                      className="text-[11px] font-sans tracking-wider uppercase bg-rose-800 text-white px-4 py-2 rounded-sm hover:bg-rose-900 transition-all shadow-md animate-fade-in"
                    >
                      Delete Selected ({selectedKeys.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsDeleteMode(false);
                      setSelectedKeys([]);
                    }}
                    className="text-[11px] font-sans tracking-wider uppercase border border-[#EADCC9] text-[#7D7261] px-4 py-2 rounded-sm hover:bg-[#FAF6F0] transition-all bg-white shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <button 
                onClick={() => {
                  setShowGalleryGrid(false);
                  setIsDeleteMode(false);
                  setSelectedKeys([]);
                }}
                className="text-xs font-sans tracking-widest uppercase px-4 py-2 border border-[#EADCC9] text-[#7D7261] rounded-sm hover:bg-[#FAF6F0] transition-all bg-white ml-2 shadow-sm"
              >
                ← Back
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 relative z-20">
                {mediaGallery.map((media, idx) => {
                  const isVideo = 
                    media.type?.startsWith?.('video') || 
                    media.type === 'video' || 
                    /\.(mp4|mov|m4v|webm|avi|mkv)/i.test(media.url);
                    
                  const safeKey = media.key || `fallback-${idx}`;
                  const isSelected = selectedKeys.includes(safeKey);

                  return (
                    <div 
                      key={safeKey} 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (isDeleteMode) {
                          setSelectedKeys((current) => {
                            if (current.includes(safeKey)) {
                              return current.filter(k => k !== safeKey);
                            } else {
                              return [...current, safeKey];
                            }
                          });
                        } else {
                          setLightboxIndex(idx);
                        }
                      }}
                      // Using ring-[#C5A880] (gold) so the selected picture outline is visible against the white background
                      className={`aspect-square bg-[#EADCC9] overflow-hidden relative group rounded-sm transition-all duration-200 cursor-pointer ${
                        isDeleteMode ? 'z-30' : 'z-10'
                      } ${isDeleteMode && isSelected ? 'ring-[3px] ring-[#C5A880] scale-[0.96] shadow-lg' : 'hover:opacity-95'}`}
                    >
                      {/* STRONG WHITE OUTLINE SELECTION INDICATOR ON TOP LEFT */}
                      {isDeleteMode && (
                        <div className="absolute top-2 left-2 z-40 flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-black/30 shadow-md transition-all duration-200">
                          {isSelected && <div className="w-3 h-3 bg-white rounded-full animate-scale-up" />}
                        </div>
                      )}

                      {isVideo ? (
                        <video 
                          src={media.url} 
                          className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${isDeleteMode && !isSelected ? 'opacity-40 saturate-50' : ''}`} 
                          muted 
                          autoPlay 
                          loop 
                          playsInline 
                        />
                      ) : (
                        <img 
                          src={media.url} 
                          alt="Wedding snapshot" 
                          className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${isDeleteMode && !isSelected ? 'opacity-40 saturate-50' : 'group-hover:scale-105'}`}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          LIGHTBOX MODAL FOR IMAGES
          ============================================================================ */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6">
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setLightboxIndex(null)}
              className="w-12 h-12 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
            <img 
              src={mediaGallery[lightboxIndex].url} 
              alt={`Expanded item ${lightboxIndex}`} 
              className="max-h-full max-w-full object-contain rounded-sm border border-white/10 shadow-2xl" 
            />
          </div>

          <div className="flex justify-center items-center gap-6 pb-4">
            <button
              disabled={lightboxIndex === 0}
              onClick={() => setLightboxIndex(lightboxIndex - 1)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold tracking-widest uppercase disabled:opacity-30 transition-colors"
            >
              Prev
            </button>
            <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-mono">
              {lightboxIndex + 1} / {mediaGallery.length}
            </span>
            <button
              disabled={lightboxIndex === mediaGallery.length - 1}
              onClick={() => setLightboxIndex(lightboxIndex + 1)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold tracking-widest uppercase disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ============================================================================
          SINGLE ELEGANT DIALOG OVERLAY CONSOLE FOR DELETION VERIFICATION
          ============================================================================ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] border border-[#EADCC9] max-w-md w-full rounded-sm p-8 text-center shadow-2xl transform transition-all animate-scale-up">
            <h3 className="font-serif text-2xl text-[#4A433A] mb-3 tracking-wide">
              Remove from Gallery?
            </h3>
            <p className="text-xs text-[#7D7261] font-sans px-4 mb-6 leading-relaxed">
              Are you sure you want to permanently delete {keysToDelete.length} of your uploaded {keysToDelete.length === 1 ? 'moment' : 'moments'}? This action cannot be reversed.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider border border-[#EADCC9] text-[#7D7261] rounded-sm hover:bg-[#FAF6F0] transition-colors bg-white shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-7 py-2.5 text-xs font-semibold uppercase tracking-wider bg-rose-800 text-white rounded-sm hover:bg-rose-900 transition-colors shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          BLOCK 13: WISHING WELL REGISTRY
          ============================================================================ */}
      <section className="py-24 px-4 bg-[#FAF6F0]">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold block">Blessings & Gifts</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Wishing Well</h2>
          <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          <p className="text-xs text-[#7D7261] leading-relaxed max-w-md mx-auto">
            Your attendance is the ultimate treasure to us. If you feel inclined to bless our new home, travel adventures, and marital savings, we have made a convenient registry and bank well.
          </p>

          <div className="bg-white p-8 sm:p-10 rounded-sm border border-[#EADCC9] shadow-sm space-y-8 text-left max-w-sm mx-auto">
            <h4 className="font-serif font-light text-2xl text-[#4A433A] border-b border-[#FAF6F0] pb-4 text-center">Transfer Details</h4>
            <div className="space-y-5 text-sm text-[#7D7261]">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">Account Name</span>
                <span className="text-[#4A433A]">JESSICA & WILLIAM Trust</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">BSB</span>
                <span className="text-[#4A433A] font-mono">062-900</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">Account Number</span>
                <span className="text-[#4A433A] font-mono tracking-wider">1048 2901 3902</span>
              </div>
              <div className="flex flex-col space-y-1 pt-4 border-t border-dashed border-[#EADCC9]">
                <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">Reference Note</span>
                <span className="text-[#4A433A] italic text-xs">WishingWell [Your Name]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 bg-[#FDFBF7] text-center border-t border-[#EADCC9]/50 text-xs text-[#9C8F7E] tracking-widest space-y-4">
        <Heart className="w-5 h-5 mx-auto text-[#C5A880] fill-current opacity-70" />
        <p className="font-serif text-sm text-[#5C5346]">JESSICA & WILLIAM'S WEDDING</p>
        <p className="text-[9px] uppercase tracking-[0.3em]">March 6, 2027</p>
      </footer>

      {/* ============================================================================
          UNIFIED FLOATING ACTION MENU SYSTEM (Toggleable Navigation Overlay)
          ============================================================================ */}
      {showFAB && !showGalleryGrid && !isRsvpOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 animate-fade-in">
          
          {/* Sub-menu options */}
          {isMenuOpen && (
            <div className="flex flex-col items-end gap-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <button 
                onClick={() => scrollToAnchor('map')}
                className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Venue & Map</span>
              </button>
              
              <button 
                onClick={() => scrollToAnchor('timings')}
                className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Details</span>
              </button>

              <button 
                onClick={() => scrollToAnchor('song-requests')}
                className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform transition-all"
              >
                <Music className="w-3.5 h-3.5" />
                <span>Interactive Hub</span>
              </button>

              <button 
                onClick={() => scrollToAnchor('gallery-header')}
                className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Shared Gallery</span>
              </button>

              {/* RSVP Action integrated in list */}
              <button 
                onClick={triggerOpenRsvp}
                className="bg-[#C5A880] text-white hover:bg-[#B3966E] text-xs font-bold px-4 py-2 rounded-full shadow-md flex items-center gap-2 transform transition-all mt-1"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Manage RSVP</span>
              </button>
            </div>
          )}

          {/* Primary Multi-Action Dial (Core Toggle) */}
          <button
            onClick={toggleMenu}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform active:scale-95 ${
              isMenuOpen 
                ? 'bg-[#5C5346] text-white hover:bg-[#4a4238]' 
                : 'bg-[#C5A880] text-white hover:bg-[#B3966E] hover:scale-110'
            }`}
            title="Toggle Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      )}

      {/* ============================================================================
          SMART RSVP PROFILE SHEET
          ============================================================================ */}
      {isRsvpOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center bg-black/50 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-2xl bg-[#FDFBF7] rounded-t-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 bg-[#FAF6F0] border-b border-[#EADCC9] flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-serif font-light text-[#4A433A]">RSVP Portal</h3>
                <p className="text-[10px] text-[#C5A880] uppercase tracking-widest mt-1 font-semibold">DEADLINE: FEB 15, 2027</p>
              </div>
              <button 
                onClick={() => setIsRsvpOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-[#7D7261] hover:text-black transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              
              {isCutoffPassed ? (
                <div className="bg-red-50 border border-red-200 p-6 rounded-sm text-center space-y-3">
                  <p className="text-sm text-red-800 font-serif leading-relaxed">
                    The online RSVP deadline has officially closed. All seating charts have frozen.
                  </p>
                  <p className="text-[11px] text-[#7D7261]">
                    If you require immediate modifications, please message the couple's coordinator directly.
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
                          {guestsList.map((guest, idx) => (
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
                            <span className="text-xs font-serif font-semibold text-[#4A433A]">
                              Guest {index + 1}
                            </span>
                            {index > 0 && (
                              <button 
                                type="button"
                                onClick={() => handleRemoveGuest(guest.id)}
                                className="text-[10px] text-red-600 uppercase tracking-widest font-semibold hover:text-red-800"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {/* Minimalist Bottom Border Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">First Name</label>
                              <input
                                type="text"
                                placeholder=""
                                value={guest.firstName}
                                onChange={(e) => handleUpdateGuest(guest.id, "firstName", e.target.value)}
                                className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:ring-0 focus:border-[#C5A880] placeholder-[#9C8F7E]/50"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">Last Name</label>
                              <input
                                type="text"
                                placeholder=""
                                value={guest.lastName}
                                onChange={(e) => handleUpdateGuest(guest.id, "lastName", e.target.value)}
                                className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:ring-0 focus:border-[#C5A880] placeholder-[#9C8F7E]/50"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-[#C5A880] tracking-widest pl-1">Attendance</label>
                            <select
                              value={guest.attending}
                              onChange={(e) => handleUpdateGuest(guest.id, "attending", e.target.value)}
                              className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:ring-0 focus:border-[#C5A880]"
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
                              className="w-full px-1 py-2 bg-transparent border-0 border-b border-[#DCD3BD] text-sm text-[#4A433A] focus:outline-none focus:ring-0 focus:border-[#C5A880] placeholder-[#9C8F7E]/50"
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

                        {!isCutoffPassed && (
                          <button
                            type="submit"
                            className="w-full py-5 bg-[#C5A880] hover:bg-[#B3966E] text-white font-semibold tracking-[0.2em] text-sm uppercase rounded-sm shadow-md transition-all"
                          >
                            Save Reservations
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          FULL GRID GALLERY MODAL & LEDGER ARCHIVES OVERLAY MODAL
          ============================================================================ */}
      {showGalleryGrid && (
        <div className="fixed inset-0 z-50 bg-[#FDFBF7] overflow-y-auto">
          <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EADCC9] z-20 px-6 py-4 flex justify-between items-center">
            <h3 className="font-serif text-2xl text-[#4A433A]">Full Gallery Grid</h3>
            <button onClick={() => setShowGalleryGrid(false)} className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#7D7261] hover:text-[#C5A880] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Invite
            </button>
          </div>
          <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {mediaGallery.map((media, idx) => (
                <div key={idx} onClick={() => setLightboxIndex(idx)} className="aspect-square bg-[#EADCC9] overflow-hidden cursor-pointer group rounded-sm shadow-sm">
                  <img src={media.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAllMessages && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-sm p-8 shadow-2xl space-y-6 max-h-[85vh] flex flex-col border border-[#EADCC9]">
            <div className="flex justify-between items-center pb-4 border-b border-[#EADCC9]">
              <h3 className="font-serif font-light text-3xl text-[#4A433A]">Ledger Archives</h3>
              <button onClick={() => { setShowAllMessages(false); setEditingMessageId(null); }} className="text-[#7D7261] hover:text-[#4A433A] transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-6 pr-2 flex-1">
              {ledgerMessages.map((msg) => (
                <div key={msg.id} className="relative pl-6 border-l border-[#C5A880]/30 pb-4 border-b border-dashed border-[#FAF6F0] last:border-b-0">
                  <span className="absolute top-1 left-[-4px] w-2 h-2 rounded-full bg-[#C5A880]" />
                  <div className="flex justify-between items-baseline mb-2">
                    <h5 className="font-serif text-lg text-[#4A433A]">{msg.name}</h5>
                    <span className="text-[9px] uppercase tracking-widest text-[#9C8F7E]">{msg.date}</span>
                  </div>
                  {editingMessageId === msg.id ? (
                    <div className="space-y-3 mt-2 bg-[#FAF6F0] p-4 rounded-sm border border-[#EADCC9]">
                      <textarea value={editingMessageText} onChange={(e) => setEditingMessageText(e.target.value)} className="w-full p-2 text-xs border border-[#EADCC9] bg-white focus:outline-none" />
                      <div className="flex justify-end gap-2 text-[10px] tracking-wider uppercase font-semibold">
                        <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 border border-[#EADCC9] bg-white">Cancel</button>
                        <button onClick={() => handleSaveEditMessage(msg.id)} className="px-3 py-1.5 bg-[#C5A880] text-white">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-[#7D7261] italic leading-relaxed">"{msg.message}"</p>
                      {myMessageIds.includes(msg.id) && (
                        <button onClick={() => { setEditingMessageId(msg.id); setEditingMessageText(msg.message); }} className="text-xs text-[#C5A880] hover:text-[#B3966E] flex items-center gap-1 mt-2 border border-[#EADCC9]/50 px-2 py-0.5 bg-[#FAF6F0] rounded-sm transition-all">
                          <Edit2 className="w-3 h-3" /> <span>Edit Comment</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          LIGHTBOX SINGLE MEDIA VIEW MODAL
          ============================================================================ */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6">
          <div className="flex justify-end pt-2">
            <button onClick={() => setLightboxIndex(null)} className="w-12 h-12 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-colors">
              <X className="w-8 h-8" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden py-4">
            <img src={mediaGallery[lightboxIndex].url} alt={`Expanded item ${lightboxIndex}`} className="max-h-full max-w-full object-contain rounded-sm border border-white/10 shadow-2xl" />
          </div>
          <div className="flex justify-center items-center gap-6 pb-4">
            <button disabled={lightboxIndex === 0} onClick={() => setLightboxIndex(lightboxIndex - 1)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold tracking-widest uppercase disabled:opacity-30 transition-colors">
              Prev
            </button>
            <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-mono">{lightboxIndex + 1} / {mediaGallery.length}</span>
            <button disabled={lightboxIndex === mediaGallery.length - 1} onClick={() => setLightboxIndex(lightboxIndex + 1)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold tracking-widest uppercase disabled:opacity-30 transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}