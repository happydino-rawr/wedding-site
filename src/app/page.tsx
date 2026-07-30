"use client";
import React, { useState, useEffect, useRef } from 'react';
import FadeInSection from '../components/FadeInSection';
import { COUPLE_PHOTOS, ACCESS_PASSCODE, WEDDING_DATE, RSVP_CUTOFF_DATE } from '../lib/constants';
import { 
  Heart, Calendar, MapPin, Navigation, Info, Music, Image as ImageIcon, Camera, Plus, Edit2, Volume2, 
  VolumeX, X, Users, Check, Play, Pause, ArrowLeft,
  Lock, Trash2, Menu, Clock,
} from 'lucide-react';
import { audio, initAudio, getAudio } from '../utils/audio'; // Adjust path as needed

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
  isVideo?: boolean;
}

export default function WeddingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [guestsList, setGuestsList] = useState<Guest[]>([]); 
  const [envelopeVisible, setEnvelopeVisible] = useState(false);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openTranslateY, setOpenTranslateY] = useState<number>(-160);
  const [closedTranslateY, setClosedTranslateY] = useState<number>(10);

  const [showGalleryGrid, setShowGalleryGrid] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [_myUploadedKeys, setMyUploadedKeys] = useState<string[]>([]);

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

  // Responsive translateY for the polaroid when the envelope opens
  useEffect(() => {
    const calculate = () => {
      const w = window.innerWidth;
      if (w >= 1280) return setOpenTranslateY(-110);
      if (w >= 1024) return setOpenTranslateY(-100);
      if (w >= 768) return setOpenTranslateY(-90);
      if (w >= 640) return setOpenTranslateY(-70);
      return setOpenTranslateY(-60);
    };

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, []);

  // Responsive closed translate so the photo stays tucked inside the envelope
  useEffect(() => {
    const calcClosed = () => {
      const w = window.innerWidth;
      if (w >= 1280) return setClosedTranslateY(8);
      if (w >= 1024) return setClosedTranslateY(8);
      if (w >= 768) return setClosedTranslateY(6);
      if (w >= 640) return setClosedTranslateY(4);
      return setClosedTranslateY(2);
    };

    calcClosed();
    window.addEventListener('resize', calcClosed);
    return () => window.removeEventListener('resize', calcClosed);
  }, []);

  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleEnvelopeCheck = () => {
      if (!envelopeRef.current) return;

      const rect = envelopeRef.current!.getBoundingClientRect();
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

  useEffect(() => {
    // 1. Initialize audio only once on mount
    initAudio('/wedding_song.mp3');

    // 2. This function handles the "unlock" and playing
    const handleInteraction = () => {
      if (audio) {
        audio.play().catch((err: unknown) => {
          console.error("Playback failed:", err instanceof Error ? err.message : err);
        });
      }
      // Remove listeners once the browser is unlocked
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    // Add the listeners
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []); // Empty dependency array: runs ONLY on mount

  // 3. Separate effect ONLY for the play/pause toggle
  useEffect(() => {
    if (audio) {
      if (isMusicPlaying) {
        audio.play().catch(e => console.log("Play toggle blocked:", e));
      } else {
        audio.pause();
      }
    }
  }, [isMusicPlaying]);

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

  useEffect(() => {
    const startMusic = () => {
      const audio = getAudio('/wedding-song.mp3');
      if (audio && audio.paused) {
        audio.currentTime = 6;
        audio.play().catch(console.error);
        // Remove the listener once the music starts
        window.removeEventListener('click', startMusic);
        window.removeEventListener('touchstart', startMusic);
      }
    };

    window.addEventListener('click', startMusic);
    window.addEventListener('touchstart', startMusic);
  }, []);

  const handleAddToCalendar = () => {
    // Wedding details
    const title = "Jessica & William's Wedding (Remember to bring your ID)";
    const description = "Come and share this wonderful day with us! Please RSVP and check the details on our wedding website. Remeber to bring your ID for entry into the Reception Venue.";
    const location = "Wedding Venue Name & Address Here"; // Update with actual venue address
    
    // Event times (UTC ISO string format required for .ics standard)
    // Date: March 6, 2027 at 6:08 PM (Local)
    const startTime = "20270306T180800"; 
    const endTime = "20270603T220000";

    // Generate .ics file structure
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Jessica and William Wedding//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    // Create a blob link and trigger browser download
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Jessica-and-William-Wedding.ics");
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // 1. Determine media type and generate robust optimistic objects
      const newOptimisticFiles = Array.from(files).map((file) => {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name);
        
        return {
          url: URL.createObjectURL(file),
          type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          isVideo,
          key: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
      });

      // 2. Add optimistic items to gallery state immediately
      setMediaGallery((prev) => [...newOptimisticFiles, ...prev]);

      // 3. Upload files to server
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
            setMyUploadedKeys((prev) => {
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
      
      // 4. Fetch updated list from server
      await refreshGallery();
      
      // Optional: Reset file input so users can re-upload the same file if needed
      e.target.value = "";
      
      alert("Uploads complete!");
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

  const handleInteraction = () => {
    const audioInstance = getAudio('/wedding_song.mp3');
    if (audioInstance) {
      audioInstance.play().catch(e => console.error("Playback failed:", e));
      audioInstance.currentTime = 6; // Start from 6 seconds in for a more dynamic entrance
    }
    // Remove listener after first interaction
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
  };

  useEffect(() => {
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

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
      try {
        const res = await fetch('/api/gallery'); 
        const data = await res.json();
        
        const publicBaseUrl = "https://pub-24a198c3bcd44e7ab19fd37353cb5c07.r2.dev";
        
        // Safety check if data.images isn't an array
        const rawImages = Array.isArray(data.images) ? data.images : [];

        const itemsWithUrls = rawImages.map((key: string) => {
          const lowerKey = key.toLowerCase();
          
          // Extended video extension & pattern matching
          const isVideoFile = 
            /\.(mp4|mov|m4v|webm|avi|mkv|3gp|flv|ogv|qt)(\?.*)?$/i.test(lowerKey) ||
            lowerKey.includes('video') ||
            lowerKey.includes('.mp4') || 
            lowerKey.includes('.mov') ||
            lowerKey.includes('.m4v') ||
            lowerKey.includes('.webm');

          return {
            key,
            url: `${publicBaseUrl}/${key}`,
            type: isVideoFile ? 'video/mp4' : 'image/jpeg',
            isVideo: isVideoFile // Added explicitly so media.isVideo works everywhere
          };
        });
        
        setMediaGallery(itemsWithUrls);
      } catch (err) {
        console.error("Failed to refresh gallery:", err);
      }
    };

    useEffect(() => {
      refreshGallery();
    }, []);

    if (showGalleryGrid) {
      console.log("FULL GRID DATA:", mediaGallery);
    }
  
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
              Jessica & William
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

        <div className="relative z-10 flex flex-col items-center text-center mt-32 px-4">
          <span className="text-white/80 uppercase tracking-[0.5em] text-[9px] sm:text-[10px] mb-8 font-light">
            Together with their families
          </span>
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-serif font-light tracking-[0.25em] leading-tight uppercase mb-12 sm:mb-16">
            JESSICA
            <br />
            <span className="text-2xl sm:text-3xl text-[#EADCC9] italic mx-2 font-thin lowercase block my-3">&</span>
            WILLIAM
          </h1>

          <p className="text-white/80 uppercase tracking-[0.5em] text-[9px] sm:text-[10px] mb-8 font-light">
            invite you to celebrate <br /> their wedding day
          </p>
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
          BLOCK 3: THE RELATIONSHIP CHRONICLE (COMMENTED OUT FOR NOW - TO BE REMOVED)
          ============================================================================ */}
      {false && (
      <section id="story" className="py-24 px-4 bg-[#FAF6F0]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-24">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Chronology of Us</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Our Story</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          </div>

          <div className="relative">
            {/* Center Timeline Line (Visible on Mobile & Desktop) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-[#EBE3D0]" />

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
                      Surrounded by golden sand dunes and the soothing melody of ocean waves, William dropped on one knee. With tears, laughter, and an absolute whisper of certainty, Jessica said "Yes!"
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
      )}
      {/* ============================================================================
          BLOCK 4: THE EXACT SCROLL-TRIGGERED ENVELOPE
          ============================================================================ */}
      <section className="py-20 md:py-32 px-4 bg-[#FDFBF7] flex flex-col items-center min-h-[700px] justify-center overflow-visible">
        <div className="max-w-xl md:max-w-2xl w-full text-center">

          {/* Interactive Envelope Container - Responsive dimensions */}
          <div 
            ref={envelopeRef} 
            className="relative w-[280px] sm:w-[340px] md:w-[480px] h-[200px] sm:h-[240px] md:h-[340px] mx-auto mb-20 md:mb-32 mt-8 md:mt-12 lg:mt-20 xl:mt-24 select-none overflow-visible animate-pulse-subtle"
            style={{ perspective: '1200px' }}
          >
            {/* Back Plate */}
            <div className="absolute inset-0 bg-[#E8E1D5] rounded-sm shadow-inner border border-[#D5CBA7] overflow-hidden z-0">
              <div className="absolute inset-1 bg-[#EBE5DA] rounded-sm" />
            </div>

            {/* Polaroid Photo - Slides upwards out of sleeve */}
            <div 
              className="absolute left-4 right-4 bottom-0 h-[210px] sm:h-[255px] md:h-[360px] bg-white p-2 sm:p-3 md:p-4 pb-6 sm:pb-8 md:pb-12 rounded-sm shadow-xl border border-slate-200/60 transition-all duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                transform: envelopeVisible
                  ? `translateY(${openTranslateY}px) rotate(1deg) scale(1.02)`
                  : `translateY(${closedTranslateY}px) rotate(0deg) scale(0.95)`,
                opacity: envelopeVisible ? 1 : 0,
                pointerEvents: envelopeVisible ? 'auto' : 'none'
              }}
            >
              <img 
                src={COUPLE_PHOTOS.envelope_couple} 
                alt="Envelope portrait" 
                className="w-full h-[175px] sm:h-[210px] md:h-[300px] object-cover rounded-sm border border-slate-100" 
              />
            </div>

            {/* Front Pouch Layer with V-cut */}
            <svg viewBox="0 0 400 280" preserveAspectRatio="none" className="absolute inset-0 w-full h-full drop-shadow-xl z-20 pointer-events-none">
              <polygon points="0,280 0,0 200,160" fill="#F4EFE8" stroke="#E3D8C8" strokeWidth="1" />
              <polygon points="400,280 400,0 200,160" fill="#F0EBE3" stroke="#E3D8C8" strokeWidth="1" />
              <polygon points="0,280 400,280 200,158" fill="#F7F3ED" stroke="#E3D8C8" strokeWidth="1" />
            </svg>

            {/* Opening top triangular flap */}
            <div 
              className="absolute top-0 inset-x-0 h-[115px] sm:h-[138px] md:h-[195px] origin-top transition-all duration-[1200ms] ease-in-out pointer-events-none"
              style={{ 
                transform: envelopeVisible ? 'rotateX(180deg)' : 'rotateX(0deg)',
                zIndex: envelopeVisible ? 5 : 30,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full drop-shadow-md">
                <polygon points="0,0 400,0 200,160" fill="#F4EFE8" stroke="#E3D8C8" strokeWidth="1" />
              </svg>
            </div>

            {/* Ribbon & Calligraphy on Front Pouch */}
            <div className="absolute top-[52%] sm:top-[54%] inset-x-0 flex flex-col items-center z-40 pointer-events-none">
              {/* Bow Tie SVG */}
              <div className="w-[80px] sm:w-24 md:w-32 h-auto -mt-3">
                <svg viewBox="0 0 100 50" fill="none" className="w-full h-full">
                  <path d="M50,25 C25,5 5,10 15,30 C20,40 45,35 50,25" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M50,25 C85,5 105,15 90,30 C80,35 60,30 50,25" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="50" cy="26" r="3" fill="#BE123C" />
                  <path d="M48,27 C30,45 25,55 35,55" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M52,27 C60,40 65,42 60,42" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              
              {/* Heart Icon */}
              <div className="mt-0 mb-3">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6">
                  <path 
                    d="M12 21.3C12 21.3 2 14.5 2 8.5C2 5 4.8 2 8 2C10 2 11.5 3.5 12 5C12.5 3.5 14 2 16 2C19.2 2 22 5 22 8.5C22 14.5 12 21.3 12 21.3Z" 
                    fill="#FDFBF7" 
                    fillOpacity="0.4" 
                    stroke="#FDFBF7" 
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Calligraphy Text */}
              <div className="mt-2 text-center select-none">
                <span 
                  className="block text-[#BE123C] text-[37px] sm:text-3xl md:text-5xl leading-none tracking-wide -mt-4 mb-6"
                  style={{ fontFamily: "'Alex Brush', 'Brush Script MT', cursive", transform: "rotate(-2deg)" }}
                >
                  Our Wedding
                </span>
              </div>
            </div>

          </div>

          {/* Invitation Text Section */}
          <div className="space-y-6 pt-6 text-center relative z-20">
            <h3 className="font-serif text-lg md:text-2xl tracking-[0.2em] text-[#5C5346]">Inviting You To Our Wedding</h3>
            <div className="flex justify-center items-center gap-4 text-2xl md:text-4xl font-serif text-[#4A433A]">
              <span>Jessica</span>
              <span className="text-rose-700 font-thin">∞</span>
              <span>William</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#9C8F7E] block font-serif">Save the Date</span>
              <div className="w-8 md:w-12 h-[1px] bg-[#EADCC9] mx-auto my-2" />
            </div>
          </div>

          {/* Responsive Calendar */}
          <div className="max-w-sm md:max-w-md mx-auto px-4 py-2 mt-4 relative z-20">
            <div className="grid grid-cols-7 gap-3 text-center text-[10px] md:text-xs font-serif text-[#9C8F7E] lowercase border-b border-[#EADCC9]/40 pb-2 mb-3">
              <span>sun</span><span>mon</span><span>tues</span><span>wed</span><span>thu</span><span>fri</span><span>sat</span>
            </div>
            <div className="grid grid-cols-7 gap-y-4 md:gap-y-6 gap-x-2 text-xs md:text-sm text-[#7D7261] font-serif">
              <span className="text-[#D5CBA7]">28</span>
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              <div className="relative flex items-center justify-center font-bold text-rose-700">
                <span className="relative z-10">6</span>
                <div className="absolute inset-0 flex items-center justify-center text-rose-700/80 scale-125">
                  <Heart className="w-6 h-6 md:w-7 md:h-7 stroke-[1px] fill-transparent" />
                </div>
              </div>
              <span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span>
              <span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span><span>20</span>
              <span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span><span>27</span>
              <span>28</span><span>29</span><span>30</span><span>31</span>
              <span className="text-[#D5CBA7]">1</span><span>2</span><span>3</span>
            </div>

            <div className="mt-8 space-y-2 text-center text-[#5C5346]">
              <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#9C8F7E] block italic">Date</span>
              <div className="space-y-0.5">
                <p className="font-serif text-lg md:text-xl tracking-wider text-[#4A433A]">06·03·2027</p>
                <p className="text-xs md:text-sm text-[#7D7261]">农历正月廿九 周六</p>
              </div>
              <div className="w-12 h-[1px] bg-[#EADCC9]/40 mx-auto my-3" />
              <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#9C8F7E] block italic">Reception</span>
              <p className="font-serif text-xl md:text-2xl text-[#4A433A]">12:08</p>
            </div>
          </div>

          {/* Button */}
          <button 
            onClick={handleAddToCalendar}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 mt-6 mb-4 rounded-full border border-[#C5A880] text-[#7D7261] hover:bg-[#C5A880] hover:text-white transition-all text-xs md:text-sm tracking-widest uppercase font-light shadow-sm"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar
          </button>

          <div className="flex flex-col items-center pt-2 pb-0 relative z-20">
            <p className="text-[14px] md:text-xs text-[#D5CBA7] italic tracking-wider max-w-xs md:max-w-sm mx-auto">
              Sincerely invite you. Come and share this wonderful day with us.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================================
          BLOCK 2: TIMELINE EVENT COUNTDOWN CLOCK
          ============================================================================ */}
      <section id="countdown-anchor" className="pt-0 pb-16 px-4 bg-[#FDFBF7] relative overflow-hidden flex flex-col items-center justify-center border-b border-[#EADCC9]/30">
        <div className="text-center space-y-4 relative z-10 max-w-2xl w-full">
          
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

          <div className="pt-8 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8E1C24] via-[#751117] to-[#45090C] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_10px_rgba(117,17,23,0.4)] border border-[#3E090B] flex items-center justify-center relative select-none cursor-pointer transform hover:scale-110 active:scale-95 transition-all duration-300">
              <Heart className="w-4 h-4 text-[#FDEAEA] fill-current opacity-85 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                <div className="absolute inset-[3px] rounded-full border border-[#FDEAEA]/10 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Map Photo Frame */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-4 sm:mt-12 mb-4 sm:mb-8">
        <img 
          src={COUPLE_PHOTOS.pre_map} 
          alt="Couple photo" 
          className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" 
        />
      </div>

      {/* ============================================================================
          BLOCK 5A: INTERACTIVE TRANSIT MAP & NAVIGATION ROUTING (CEREMONY LOCATION)
          ============================================================================ */}
      <section id="map" className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-2xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <span className="text-[12px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Ceremony Location</span>
            <h2 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">Harbour View Lawn</h2>
            <p className="text-sm text-[#7D7261]">Royal Botanical Gardens, Sydney NSW 2000</p>
          </div>

          <div className="rounded-sm overflow-hidden shadow-md border border-[#EADCC9] aspect-video relative">
            <iframe 
              src="https://maps.google.com/maps?q=Harbour+View+Lawn,+Royal+Botanic+Garden+Sydney&t=&z=16&ie=UTF8&iwloc=&output=embed" 
              className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700" 
              allowFullScreen={true}
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <a 
            href="https://www.google.com/maps/search/?api=1&query=Harbour+View+Lawn+Royal+Botanic+Garden+Sydney" 
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
          BLOCK 6: TRANSPORTATION STEP-BY-STEP GUIDE  (CEREMONY LOCATION)
        ============================================================================ */}
      <section className="py-12 px-4 bg-[#FAF6F0] border-y border-[#EADCC9]/40">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* <div className="text-center space-y-3">
            <Car className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Driving Route</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Take the Southern Freeway (M31) heading South from Sydney. Exit toward Bowral/Mitagong.
            </p>
          </div> */}
          {/* Arrival Block */}
          <div className="text-center space-y-3">
            {/* Stacked Centered Clock Icon (Matching MapPin styling) */}
            <Clock className="w-6 h-6 text-[#C5A880] mx-auto" />
            
            {/* Matching Serif Header */}
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Arrival</h4>
            
            {/* Description Text */}
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Please arrive <span className="font-medium text-[#4A433A]">30 minutes early</span> to allow time for parking
              <br />
              and the walk to Harbour Lawn for the ceremony.
            </p>
          </div>

          {/* Parking Block */}
          <div className="text-center space-y-3">
            <MapPin className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Metered Parking</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Metered street parking is available on Mrs Macquaries Road and Hospital Road. 
              <br />
              Please note that parking is limited and may require a short walk to the venue.
            </p>
          </div>

          {/* Rail Transit Block */}
          <div className="text-center space-y-3">
            <Info className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Rail Transit</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              St James, Martin Place and Circular Quay Stations are all a 10-minute walk from the venue.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full max-w-4xl mx-auto px-4 mt-4 sm:mt-12 mb-4 sm:mb-8">
        <img 
          src={COUPLE_PHOTOS.couple_pic} 
          alt="Couple photo" 
          className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" 
        />
      </div>

      {/* ============================================================================
          BLOCK 5B: INTERACTIVE TRANSIT MAP & NAVIGATION ROUTING (RECEPTION LOCATION)
          ============================================================================ */}
      <section id="map" className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-2xl mx-auto space-y-12 text-center">
          {/* Header & Location */}
          <div className="space-y-3">
            <span className="text-[12px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Reception Location</span>
            <h2 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">Cabravale Club Resort</h2>
            <p className="text-sm text-[#7D7261]">1 Bartley Street, Canley Vale NSW 2166</p>

          {/* Invitation Subtext */}
          <p className="font-serif italic text-sm text-[#7D7261] pt-2">
            Following the ceremony, please join us for our wedding reception.
          </p>
          </div>

          <div className="rounded-sm overflow-hidden shadow-md border border-[#EADCC9] aspect-video relative">
            <iframe 
              src="https://maps.google.com/maps?q=Cabravale+Club+Resort,+1+Bartley+St,+Canley+Vale+NSW+2166&t=&z=16&ie=UTF8&iwloc=&output=embed" 
              className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700" 
              allowFullScreen={true}
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <a 
            href="https://www.google.com/maps/search/?api=1&query=Cabravale+Club+Resort+1+Bartley+St+Canley+Vale+NSW+2166" 
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
          BLOCK 6: TRANSPORTATION STEP-BY-STEP GUIDE (RECEPTION LOCATION)
          ============================================================================ */}
      <section className="py-12 px-4 bg-[#FAF6F0] border-y border-[#EADCC9]/40">
              {/* Changed grid-cols-3 to grid-cols-2 max-w-xl so 2 items center perfectly */}
              <div className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Parking Block */}
                <div className="text-center space-y-3">
                  <MapPin className="w-6 h-6 text-[#C5A880] mx-auto" />
                  <h4 className="font-serif font-light text-xl text-[#4A433A]">Free Parking</h4>
                  <p className="text-xs text-[#7D7261] leading-relaxed">
                    Complimentary onsite parking is available.
                  </p>
                </div>

                {/* Rail Transit Block */}
                <div className="text-center space-y-3">
                  <Info className="w-6 h-6 text-[#C5A880] mx-auto" />
                  <h4 className="font-serif font-light text-xl text-[#4A433A]">Rail Transit</h4>
                  <p className="text-xs text-[#7D7261] leading-relaxed">
                    10 minute walk from Canley Vale Station.
                  </p>
                </div>
              </div>

              {/* Important Photo ID Notice */}
              <div className="max-w-md mx-auto mt-10 p-4 rounded-xl bg-[#F4EFE6]/50 border border-[#EADCC9]/60 space-y-1.5 text-center sm:text-left">
                <p className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">
                  Please Note
                </p>
                <p className="text-xs text-[#7D7261] leading-relaxed">
                  All guests must present a <strong className="font-semibold text-[#BE123C]">valid form of photo ID</strong> upon arrival to sign into the venue (e.g., Passport, Driver's Licence, or Proof of Age Card).                </p>
              </div>
            </section>

            {/* Couple Photo Divider - Normalized margins */}
            <div className="w-full max-w-4xl mx-auto px-4 my-8 sm:my-12">
              <img 
                src={COUPLE_PHOTOS.couple_pic} 
                alt="Couple photo" 
                className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" 
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
                { time: "12:00 PM", title: "Tea Ceremony", desc: "Family blessings & tea." },
                { time: "1:30 PM", title: "Guest Arrival", desc: "At the Harbour View Lawn." },
                { time: "2:00 PM", title: "The Ceremony", desc: "Exchanging our vows." },
                { time: "3:30 PM (How long?)", title: "Travel & Rest", desc: "Commute & freshen up for dinner." },
                { time: "6:30 PM", title: "Grand Banquet", desc: "Dinner, speeches & party." },
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

          {/* Dress Code Guide */}
          <div className="space-y-8 pt-20 mt-10 text-center border-t border-[#EADCC9]/50">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-bold">Attire Etiquette</span>
              <h2 className="text-2xl font-serif font-light text-[#4A433A] tracking-wide">Dress Code Guide</h2>
              <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-2" />
              <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-lg mx-auto">
                There is no strict dress code. We just want you here to celebrate with us! If you're looking for outfit ideas, here are some colors you can use as inspiration:
              </p>
              <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-lg mx-auto">
                Please feel free to wear whatever makes you feel comfortable and confident! For those who would like a little inspiration, here are a few soft, earthy tones that complement our wedding palette:
              </p>
              <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-lg mx-auto">
                Semi-formal attire is welcomed, but please wear whatever you feel best in! If you'd like color inspiration, feel free to use our suggested palette below:
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 pt-4 max-w-2xl mx-auto">
              {[
                { hex: "bg-[#F7F3E9]", name: "Warm Champagne" },
                { hex: "bg-[#F5E6E8]", name: "Dusty Rose" },
                { hex: "bg-[#F9ECE5]", name: "Blush Pink" },
                { hex: "bg-[#E2E8DD]", name: "Soft Sage" },
                { hex: "bg-[#C3D0C0]", name: "Earthy Sage" },
                { hex: "bg-[#EFE6DC]", name: "Soft Oat" },
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
      <div className="w-full max-w-4xl mx-auto px-4 mt-4 sm:mt-12 mb-4 sm:mb-8">
        <img 
          src={COUPLE_PHOTOS.pre_rsvp} 
          alt="RSVP transition layout"
          className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" />
      </div>

      {/* ============================================================================
          BLOCK 8: THE RSVP
          ============================================================================ */}
      <section className="py-24 px-4 bg-[#FAF6F0] flex justify-center">
        {/* Restored max-w-2xl and generous padding (p-10 sm:p-16) for a roomier desktop feel */}
        <div className="bg-white border border-[#EADCC9] shadow-xl p-10 sm:p-16 rounded-sm max-w-2xl w-full text-center relative overflow-hidden">
          
          {/* Inner Dashed Border Frame */}
          <div className="absolute inset-4 sm:inset-5 border border-[#EADCC9]/80 border-dashed pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center space-y-8 sm:space-y-10">
            {/* Heart Icon */}
            <Heart className="w-6 h-6 text-[#C5A880] fill-current opacity-90" />
            
            {/* Header Section */}
            <div className="space-y-3">
              <h2 className="font-serif text-3xl sm:text-4xl text-[#4A433A] tracking-wide">
                Répondez s'il vous plaît
              </h2>
              <div className="w-12 sm:w-16 h-[1px] bg-[#C5A880] mx-auto" />
            </div>

            {/* Subtitle & Date - Spaced out for prominence */}
            <div className="space-y-2 py-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#C5A880] font-bold block">
                Kindly Reply By
              </span>
              <p className="font-serif italic text-2xl sm:text-3xl text-[#BE123C] pt-1">
                November 30, 2026
              </p>
            </div>

            {/* Body Copy - Wider max-w and relaxed padding */}
            <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-md mx-auto px-2">
              We eagerly await your response to help us finalize our celebration. Please let us know if you can attend and note any dietary requirements.
            </p>

            {/* CTA Section with top border separator */}
            <div className="w-full pt-4 border-t border-[#FAF6F0]">
              <button
                onClick={triggerOpenRsvp}
                className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] rounded-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>Please RSVP Here</span>
              </button>
            </div>
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
          BLOCK 12: SHARED GALLERY PREVIEW & UPLOAD (MAIN PAGE FEED)
          ============================================================================ */}
      <section id="gallery-header" className="py-24 px-4 bg-[#FDFBF7] overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Capture the Day</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Our Shared Gallery</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
            <p className="text-[13px] text-[#7D7261] max-w-md mx-auto pt-4 leading-relaxed">
              Our story, seen through your eyes. Please upload your photos below to help us preserve every single moment of our special day.            </p>
              <p className="text-[13px] text-[#7D7261] max-w-md mx-auto pt-2 leading-relaxed">
                用您的视角，记录我们的故事。请点击下方按钮上传照片，与我们一同珍藏这一天的美好瞬间。(Leaving a translation here for now)
              </p>
          </div>

          {/* Elevated Solid Gold Upload Button */}
          <div className="flex justify-center">
            <label className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer">
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
                  className="aspect-square bg-[#EADCC9] overflow-hidden relative group rounded-sm cursor-pointer border border-[#EADCC9]/50 shadow-xs"
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

          {/* Fixed Buttons with Inline SVG Grid Icons */}
          {mediaGallery.length > 6 ? (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowGalleryGrid(true)}
                className="inline-flex items-center gap-2.5 px-8 py-3 bg-[#FAF8F5] hover:bg-[#C5A880] text-[#7D7261] hover:text-white border border-[#C5A880]/60 text-xs font-semibold uppercase tracking-[0.2em] rounded-sm shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-3.5 h-3.5"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
                <span>View Full Grid</span>
              </button>
            </div>
          ) : (
            mediaGallery.length > 0 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowGalleryGrid(true)}
                  className="inline-flex items-center gap-2.5 px-8 py-3 bg-[#FAF8F5] hover:bg-[#C5A880] text-[#7D7261] hover:text-white border border-[#C5A880]/60 text-xs font-semibold uppercase tracking-[0.2em] rounded-sm shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-3.5 h-3.5"
                  >
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="3" rx="1" />
                    <rect width="7" height="7" x="14" y="14" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                  </svg>
                  <span>Manage Gallery</span>
                </button>
              </div>
            )
          )}

        </div>
      </section>

      {/* ============================================================================
          BLOCK 12: FULL GALLERY GRID INTERACTIVE OVERLAY MODAL
          ============================================================================ */}
      {/* ============================================================================
          FULL GALLERY GRID OVERLAY MODAL
          ============================================================================ */}
      {showGalleryGrid && (
        <div className="fixed inset-0 z-50 bg-[#FDFBF7] flex flex-col animate-fade-in overflow-hidden">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#EADCC9] bg-[#FDFBF7] z-30">
            <h2 className="font-serif text-2xl text-[#4A433A] font-light">Full Gallery Grid</h2>
            
            <div className="flex items-center gap-4">
              {/* Delete Mode Toggle Button */}
              <button 
                onClick={() => {
                  setIsDeleteMode(!isDeleteMode);
                  setSelectedKeys([]);
                }}
                className={`px-4 py-2 text-xs uppercase tracking-widest transition-all rounded-sm ${
                  isDeleteMode 
                    ? 'bg-red-600 text-white' 
                    : 'border border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-white'
                }`}
              >
                {isDeleteMode ? 'Cancel Selection' : 'Select / Delete'}
              </button>

              {/* Delete Confirm Button (Only visible in Delete Mode) */}
              {isDeleteMode && selectedKeys.length > 0 && (
                <button 
                  onClick={() => {
                    setKeysToDelete(selectedKeys);
                    setShowDeleteModal(true);
                  }}
                  className="px-4 py-2 bg-red-700 text-white text-xs uppercase tracking-widest flex items-center gap-1.5 rounded-sm hover:bg-red-800 transition-all shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete ({selectedKeys.length})
                </button>
              )}

              {/* Close Modal Button */}
              <button 
                onClick={() => {
                  setShowGalleryGrid(false);
                  setIsDeleteMode(false);
                  setSelectedKeys([]);
                }}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#7D7261] hover:text-[#4A433A] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Invite
              </button>
            </div>
          </div>

          {/* Gallery Grid Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                
                {mediaGallery.map((media: MediaItem, idx: number) => {
                  const rawUrl = media.url;
                  const safeKey = media.key || `gallery-item-${idx}`;
                  const isSelected = selectedKeys.includes(safeKey);

                  // Strict video evaluation check
                  const isVideo = 
                    media.isVideo === true || 
                    media.type?.startsWith('video') === true ||
                    /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i.test(rawUrl || '');

                  return (
                    <div 
                      key={safeKey} 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (isDeleteMode) {
                          setSelectedKeys((current) => 
                            current.includes(safeKey) 
                              ? current.filter(k => k !== safeKey) 
                              : [...current, safeKey]
                          );
                        } else {
                          setLightboxIndex(idx);
                        }
                      }}
                      className={`aspect-square bg-[#EADCC9] overflow-hidden relative group rounded-sm transition-all duration-200 cursor-pointer ${
                        isDeleteMode && isSelected ? 'ring-[3px] ring-red-500 scale-[0.96] shadow-lg' : 'hover:opacity-95'
                      }`}
                    >
                      {/* Delete Mode Checkmark */}
                      {isDeleteMode && (
                        <div className={`absolute top-2 left-2 z-40 flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-md transition-all ${
                          isSelected ? 'bg-red-600 border-red-600' : 'bg-black/40 border-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                      )}

                      {/* Video vs Image Rendering Switch */}
                      {isVideo ? (
                        <video 
                          key={rawUrl}
                          src={rawUrl} 
                          className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${
                            isDeleteMode && !isSelected ? 'opacity-50 saturate-50' : ''
                          }`} 
                          muted 
                          autoPlay 
                          loop 
                          playsInline 
                          preload="auto"
                        />
                      ) : (
                        <img 
                          src={rawUrl} 
                          alt={`Gallery item ${idx}`} 
                          className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${
                            isDeleteMode && !isSelected ? 'opacity-50 saturate-50' : 'group-hover:scale-105'
                          }`}
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

      {/* INSIDE YOUR LIGHTBOX MODAL */}
      {lightboxIndex !== null && mediaGallery[lightboxIndex] && (() => {
        const currentItem = mediaGallery[lightboxIndex];
        
        // Robust check for video on current item
        const isVideo = 
          currentItem.isVideo || 
          currentItem.type?.startsWith('video') || 
          (typeof currentItem.url === 'string' && /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i.test(currentItem.url));

        return (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
            {/* Close Button */}
            <button 
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-white text-2xl z-50 hover:opacity-75 p-2"
            >
              ✕
            </button>

            {/* Main Content Area */}
            <div className="max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center p-4">
              {isVideo ? (
                <video 
                  src={currentItem.url} 
                  controls 
                  autoPlay 
                  playsInline
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : (
                <img 
                  src={currentItem.url} 
                  alt={`Expanded item ${lightboxIndex}`} 
                  className="max-w-full max-h-[80vh] object-contain"
                  onError={(e) => {
                    // If an image fails, attempt to render as a video fallback
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const video = document.createElement('video');
                      video.src = currentItem.url;
                      video.controls = true;
                      video.autoplay = true;
                      video.className = 'max-w-full max-h-[80vh] object-contain';
                      parent.replaceChild(video, e.currentTarget);
                    }
                  }}
                />
              )}
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-6 flex items-center gap-4 text-white text-xs">
              <button 
                disabled={lightboxIndex === 0}
                onClick={() => setLightboxIndex(prev => (prev !== null ? prev - 1 : 0))}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-sm uppercase tracking-wider"
              >
                Prev
              </button>
              <span>{lightboxIndex + 1} / {mediaGallery.length}</span>
              <button 
                disabled={lightboxIndex === mediaGallery.length - 1}
                onClick={() => setLightboxIndex(prev => (prev !== null ? prev + 1 : 0))}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-sm uppercase tracking-wider"
              >
                Next
              </button>
            </div>
          </div>
        );
      })()}

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
          FULL GALLERY GRID OVERLAY MODAL
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
