"use client";
import React, { useState, useEffect, useRef } from 'react';
import FadeInSection from '../components/FadeInSection';
import { COUPLE_PHOTOS, ACCESS_PASSCODE, WEDDING_DATE, RSVP_CUTOFF_DATE } from '../lib/constants';
import { playProceduralSong } from '@/utils/audio';
import { 
  Heart, Calendar, MapPin, Navigation, Car, Info, Music, 
  Send, Image as ImageIcon, Camera, Plus, Edit2, Volume2, 
  VolumeX, X, Users, BookOpen, Check, Play, Pause, ArrowLeft,
  Lock, ChevronDown
} from 'lucide-react';

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  attending: string;
  dietary: string;
}

interface MediaItem {
  type: string;
  url: string;
}

export default function WeddingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mediaGallery, setMediaGallery] = useState<{url: string}[]>([]);
  const [guestsList, setGuestsList] = useState<Guest[]>([]);
  const [envelopeVisible, setEnvelopeVisible] = useState(false);
  const envelopeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  // Music states 
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songRequester, setSongRequester] = useState("");
  const [playlistRequests, setPlaylistRequests] = useState<any[]>([]);

  // Guestbook
  const [ledgerMessages, setLedgerMessages] = useState<any[]>([]);
  const [tempGuestName, setTempGuestName] = useState("");
  const [tempMessage, setTempMessage] = useState("");

  const [showGalleryGrid, setShowGalleryGrid] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isCutoffPassed = new Date() > RSVP_CUTOFF_DATE;

  useEffect(() => {
    const session = localStorage.getItem("wedding_session_token");
    if (session === "true") setIsAuthenticated(true);

    const handleScroll = () => setShowFAB(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", handleScroll);

    const updateCountdown = () => {
      const diff = WEDDING_DATE.getTime() - new Date().getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 1. Prepare to track new files for the optimistic update
    const newOptimisticFiles = Array.from(files).map(file => ({
      url: URL.createObjectURL(file)
    }));

    // 2. Add all new files to the UI instantly
    setMediaGallery(prev => [...newOptimisticFiles, ...prev]);

    // 3. Upload files one by one (or in parallel)
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
      } catch (err) {
        console.error("Error during upload:", err);
      }
    });

    // 4. Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // 5. Final sync: Fetch official URLs from bucket to replace temporary ones
    await refreshGallery();
    alert("Uploads complete!");
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

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle || !songArtist) return;
    setPlaylistRequests([
      { title: songTitle, artist: songArtist, requester: songRequester || "Anonymous Guest" },
      ...playlistRequests
    ]);
    setSongTitle("");
    setSongArtist("");
    setSongRequester("");
  };

  const handleAddMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempGuestName || !tempMessage) return;
    setLedgerMessages([
      { name: tempGuestName, message: tempMessage, date: "Just now" },
      ...ledgerMessages
    ]);
    setTempGuestName("");
    setTempMessage("");
  };

  const refreshGallery = async () => {
    const res = await fetch('/api/gallery'); 
    const data = await res.json();
    
    // Map the keys (filenames) to the full Public Development URL
    const publicBaseUrl = "https://pub-24a198c3bcd44e7ab19fd37353cb5c07.r2.dev";
    const imagesWithUrls = data.images.map((key: string) => ({
      url: `${publicBaseUrl}/${key}`
    }));
    
    setMediaGallery(imagesWithUrls);
  };

  useEffect(() => {
  refreshGallery();
  }, []);

  const triggerOpenRsvp = () => setIsRsvpOpen(true);
  const scrollToAnchor = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="max-w-sm w-full p-10 bg-white border border-[#EADCC9] text-center shadow-lg">
          <Lock className="mx-auto mb-4 text-[#C5A880]" />
          <h1 className="font-serif text-2xl text-[#4A433A] mb-6">JESSICA & WILLIAM</h1>
          <form onSubmit={(e) => { e.preventDefault(); if (passcode === ACCESS_PASSCODE) setIsAuthenticated(true); }}>
            <input 
              type="password" 
              className="w-full border-b border-[#EADCC9] p-2 text-center"
              placeholder="Passcode"
              onChange={(e) => setPasscode(e.target.value)}
            />
            <button type="submit" className="mt-6 w-full py-3 bg-[#C5A880] text-white">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#5C5346] font-sans selection:bg-[#C5A880] selection:text-white pb-20 relative overflow-x-hidden">
      
      {/* ============================================================================
          BLOCK 1: THE WELCOME ARENA (Vogue-Editorial Cover Redesign)
          ============================================================================ */}
      <section id="hero" className="relative h-screen flex flex-col items-center justify-between text-center overflow-hidden pt-12 pb-16">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] scale-105"
          style={{ backgroundImage: `url(${COUPLE_PHOTOS.hero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

        {/* Floating Minimal Sound Toggle */}
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

        {/* Refined Minimalist Editorial Layout */}
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

        {/* Custom Delicate Begin Indicator */}
        <div 
          className="relative z-10 flex flex-col items-center text-white/90 animate-bounce cursor-pointer opacity-80 hover:opacity-100 transition-opacity" 
          onClick={() => scrollToAnchor('countdown-anchor')}
        >
          <span className="text-[9px] uppercase tracking-[0.4em] mb-4 font-serif font-light">Begin</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ============================================================================
          BLOCK 2: TIMELINE EVENT COUNTDOWN CLOCK (Delicate Typographic Design)
          ============================================================================ */}
      <section id="countdown-anchor" className="py-20 px-4 bg-[#FDFBF7] relative overflow-hidden flex flex-col items-center justify-center border-b border-[#EADCC9]/30">
        <div className="text-center space-y-8 relative z-10 max-w-2xl w-full">
          
          <div className="space-y-3">
            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">The Promise</span>
            <p className="font-serif italic text-base sm:text-lg text-[#7D7261] tracking-wide">
              "Counting down to our forever..."
            </p>
          </div>
          
          {/* Micro Countdown Blocks */}
          <div className="flex items-center justify-center gap-5 sm:gap-10">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wider">{timeLeft.days}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Days</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wider">{timeLeft.hours}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Hours</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wider">{timeLeft.minutes}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Mins</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wider">{timeLeft.seconds}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Secs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================
          BLOCK 3: THE RELATIONSHIP CHRONICLE (Redesigned Continuous Vertical Flow)
          ============================================================================ */}
      <section id="story" className="py-24 px-4 bg-[#FAF6F0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-3 mb-24">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Chronology of Us</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Our Story</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          </div>

          <div className="relative">
            {/* Continuous Center Timeline Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-[#EADCC9]" />

            <div className="space-y-24 relative z-10">
              
              {/* Story Event 1 */}
              <div className="flex flex-col md:flex-row items-center w-full">
                <div className="md:w-1/2 md:pr-16 text-center md:text-right flex flex-col items-center md:items-end mb-8 md:mb-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">First Coffee Sparks</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm">
                      Fate collided in a corner café in Melbourne on a rainy afternoon. What was supposed to be a ten-minute coffee turned into a four-hour deep dialogue about music, art, and lifetime philoWILLIAMs.
                    </p>
                  </FadeInSection>
                </div>
                
                {/* Center Floating Date Pill */}
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#EADCC9] shadow-sm items-center justify-center z-20">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Nov 14, 2021</span>
                </div>
                
                <div className="md:w-1/2 md:pl-16 flex justify-center md:justify-start">
                  <img src={COUPLE_PHOTOS.story1} alt="First sparks" className="w-full max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                  <span className="md:hidden text-[9px] uppercase tracking-[0.2em] text-[#C5A880] font-bold block mt-4 text-center w-full">Nov 14, 2021</span>
                </div>
              </div>

              {/* Story Event 2 */}
              <div className="flex flex-col md:flex-row items-center w-full">
                <div className="md:w-1/2 md:pr-16 flex justify-center md:justify-end order-2 md:order-1 mt-8 md:mt-0">
                  <img src={COUPLE_PHOTOS.story2} alt="Proposal" className="w-full max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                  <span className="md:hidden text-[9px] uppercase tracking-[0.2em] text-[#C5A880] font-bold block mt-4 text-center w-full">Aug 18, 2024</span>
                </div>

                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#EADCC9] shadow-sm items-center justify-center z-20 order-3">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Aug 18, 2024</span>
                </div>

                <div className="md:w-1/2 md:pl-16 text-center md:text-left flex flex-col items-center md:items-start order-1 md:order-2">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">The Sunset Proposal</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm">
                      Surrounded by golden sand dunes and the soothing melody of ocean waves, JESSICA dropped on one knee. With tears, laughter, and an absolute whisper of certainty, WILLIAM said "Yes!"
                    </p>
                  </FadeInSection>
                </div>
              </div>

              {/* Story Event 3 */}
              <div className="flex flex-col md:flex-row items-center w-full">
                <div className="md:w-1/2 md:pr-16 text-center md:text-right flex flex-col items-center md:items-end mb-8 md:mb-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">The Golden Future</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm">
                      Now we are carving our path toward a lifetime of mutual laughter, shared dreams, growing our small home sanctuary, and traveling to wild untamed horizons.
                    </p>
                  </FadeInSection>
                </div>
                
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#EADCC9] shadow-sm items-center justify-center z-20">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Looking Ahead</span>
                </div>
                
                <div className="md:w-1/2 md:pl-16 flex justify-center md:justify-start">
                  <img src={COUPLE_PHOTOS.story3} alt="Future plans" className="w-full max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                  <span className="md:hidden text-[9px] uppercase tracking-[0.2em] text-[#C5A880] font-bold block mt-4 text-center w-full">Looking Ahead</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================
          BLOCK 4: THE SCROLL-TRIGGERED ENVELOPE (MATCHING 12934.JPG STYLE)
          ============================================================================ */}
      <section className="py-24 px-4 bg-[#FDFBF7] flex flex-col items-center min-h-[700px] justify-center overflow-visible">
        <div className="max-w-xl w-full text-center">

          {/* Envelope with 3D perspective */}
          <div 
            ref={envelopeRef} 
            className="relative w-80 sm:w-[350px] h-48 sm:h-56 mx-auto mb-40 select-none overflow-visible animate-pulse-subtle"
            style={{ perspective: '1200px' }}
          >
            {/* Pocket back */}
            <div className="absolute inset-0 bg-[#EAE3D2] rounded-xl shadow-inner border border-[#DCD3BD] overflow-hidden z-0">
              <div className="absolute inset-1 bg-[#F4EDE0] rounded-lg" />
            </div>

            {/* Polaroid photo inside - slides upwards out of sleeve */}
            <div 
              className="absolute left-6 right-6 bottom-4 h-48 sm:h-52 bg-white p-3 pb-8 rounded-sm shadow-xl border border-slate-200/60 transition-all duration-[1200ms] ease-out z-10"
              style={{
                transform: envelopeVisible ? 'translateY(-130px) rotate(2deg) scale(1.05)' : 'translateY(10px) rotate(0deg) scale(0.95)',
                opacity: envelopeVisible ? 1 : 0,
                pointerEvents: envelopeVisible ? 'auto' : 'none'
              }}
            >
              <img 
                src={COUPLE_PHOTOS.envelope_couple} 
                alt="Envelope portrait" 
                className="w-full h-32 sm:h-36 object-cover rounded-sm border border-slate-100" 
              />
              <div className="mt-2 text-center">
                <span className="font-serif italic text-xs text-[#7D7261]">JESSICA & WILLIAM</span>
                <p className="text-[8px] text-[#9C8F7E] tracking-[0.2em] uppercase mt-0.5">Bowral, NSW</p>
              </div>
            </div>

            {/* Front pouch layer */}
            <svg 
              viewBox="0 0 350 200" 
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full drop-shadow-xl z-20 pointer-events-none"
            >
              <polygon points="0,200 0,0 175,115" fill="#FAF6F0" stroke="#DCD3BD" strokeWidth="0.5" />
              <polygon points="350,200 350,0 175,115" fill="#FAF5EF" stroke="#DCD3BD" strokeWidth="0.5" />
              <polygon points="0,200 350,200 175,100" fill="#F6F1E5" stroke="#DCD3BD" strokeWidth="0.5" />
            </svg>

            {/* Opening top triangular flap */}
            <div 
              className="absolute top-0 inset-x-0 h-32 sm:h-36 origin-top transition-transform duration-[1200ms] ease-in-out z-30 pointer-events-none"
              style={{ 
                transform: envelopeVisible ? 'rotateX(180deg)' : 'rotateX(0deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              <svg viewBox="0 0 350 150" preserveAspectRatio="none" className="w-full h-full drop-shadow-md">
                <polygon points="0,0 350,0 175,140" fill="#FAF6F0" stroke="#DCD3BD" strokeWidth="0.5" />
              </svg>
            </div>

            {/* Red cord ribbon tied into bow */}
            <div className={`absolute bottom-4 inset-x-0 text-center z-40 pointer-events-none flex flex-col items-center transition-opacity duration-700 delay-300 ${envelopeVisible ? 'opacity-0' : 'opacity-100'}`}>
              <div className="w-20 h-10 -mt-2 opacity-95">
                <svg viewBox="0 0 100 50" fill="none" className="w-full h-full">
                  <path d="M50,20 C35,0 15,15 48,22" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M50,20 C65,0 85,15 52,22" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
                  <path d="M48,22 C38,32 30,48 35,46" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M52,22 C62,32 70,48 65,46" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="50" cy="21" r="3" fill="#9F1239" />
                </svg>
              </div>
              <div className="text-rose-700/80 -mt-1">
                <Heart className="w-4 h-4 stroke-[1px]" />
              </div>
              <div className="mt-2 select-none">
                <span className="font-serif italic text-2xl text-rose-700 tracking-wide block">Our wedding</span>
                <span className="text-[7px] text-[#9C8F7E] tracking-[0.3em] uppercase block -mt-0.5">WEDDING</span>
              </div>
            </div>
          </div>

          {/* <div className="space-y-6 pt-12 text-center relative z-20">
            <h3 className="font-serif text-lg tracking-[0.2em] text-[#5C5346]">邀您参加我们的婚礼</h3>
            <div className="flex justify-center items-center gap-4 text-2xl font-serif text-[#4A433A]">
              <span>卢莱川</span>
              <span className="text-rose-700 font-thin">∞</span>
              <span>梁 奎</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#9C8F7E] block font-serif">Save the Date</span>
              <div className="w-8 h-[1px] bg-[#EADCC9] mx-auto my-2" />
            </div>
          </div> */}

          <div className="space-y-6 pt-12 text-center relative z-20">
            <div className="space-y-1">
              {/* Use an actual h3 tag for the header, or a span with the correct classes */}
              <h3 className="font-serif text-lg tracking-[0.2em] text-[#5C5346]">
                Save the Date
              </h3>
              <span className="text-[8px] uppercase tracking-[0.3em] text-[#9C8F7E] block font-serif">
                March
              </span>

              <div className="w-8 h-[1px] bg-[#EADCC9] mx-auto my-2" />
            </div>
          </div>

          <div className="max-w-sm mx-auto px-4 py-2 mt-4 relative z-20">
            <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-serif text-[#9C8F7E] lowercase border-b border-[#EADCC9]/40 pb-2 mb-3">
              <span>lun</span><span>mar</span><span>mer</span><span>jeu</span><span>ven</span><span>sam</span><span>dim</span>
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
                <p className="font-serif text-lg tracking-wider text-[#4A433A]">2027.3.6</p>
                {/* <p className="text-xs text-[#9C8F7E]">农历正月廿九 周六</p> */}
              </div>
              <div className="w-12 h-[1px] bg-[#EADCC9]/40 mx-auto my-3" />
              <span className="text-[10px] uppercase tracking-widest text-[#9C8F7E] block italic">TIME</span>
              <p className="font-serif text-xl text-[#4A433A]">12:08</p>
            </div>
          </div>

          <div className="flex flex-col items-center pt-8 space-y-4 relative z-20">
            {/* <span className="text-[10px] uppercase tracking-widest text-[#9C8F7E] block italic">Address</span>
            <p className="text-sm font-serif text-[#4A433A] tracking-wider px-6">伦敦公园巷喜来登大酒店 · 世纪厅</p> */}
            <p className="text-[10px] text-[#D5CBA7] italic tracking-wider max-w-xs mx-auto">
              Sincerely invite you. Come and share this wonderful day with us.
            </p>
            <div className="pt-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-800 to-rose-900 shadow-lg border border-rose-950 flex items-center justify-center relative select-none cursor-pointer">
                <Heart className="w-4 h-4 text-rose-200 fill-current opacity-50" />
                <div className="absolute inset-0.5 rounded-full border border-rose-900/40" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Pre-Map Photo Frame */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-12">
        <img 
          src={COUPLE_PHOTOS.pre_map} 
          alt="Pre-map presentation" 
          className="w-full h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" 
        />
      </div>

      {/* ============================================================================
          BLOCK 5: INTERACTIVE TRANSIT MAP & NAVIGATION ROUTING
          ============================================================================ */}
      <section id="map" className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-2xl mx-auto space-y-8 text-center">
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
            className="inline-flex items-center gap-2 px-8 py-3 border border-[#C5A880] text-[#C5A880] font-semibold text-xs tracking-widest uppercase hover:bg-[#C5A880] hover:text-white transition-all active:scale-95"
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

      {/* Pre-Dress code image backdrop */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-20">
        <img 
          src={COUPLE_PHOTOS.pre_dress} 
          alt="Elegance dress code prelude" 
          className="w-full h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" 
        />
      </div>

      {/* ============================================================================
          BLOCK 7: TIMINGS GRID (Sophisticated Asymmetrical Timeline Path Redesign)
          ============================================================================ */}
      <section id="timings" className="py-24 px-4 bg-[#FDFBF7]">
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center space-y-3 mb-16">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-bold">The Day</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Wedding Itinerary</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          </div>

          <div className="relative">
            {/* Center Axis Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-[#EADCC9]" />

            <div className="space-y-12 relative z-10">
              {[
                { time: "2:00 PM", title: "Tea Ceremony", desc: "Traditional morning family heritage blessing." },
                { time: "3:00 PM", title: "Guest Arrival", desc: "Champagne welcoming, serene violin prelude." },
                { time: "3:30 PM", title: "The Sacred Vows", desc: "Outdoors in the sunken garden courtyard." },
                { time: "4:30 PM", title: "Cocktail Hour", desc: "Sip custom botanical gin tonics & meet other guests." },
                { time: "6:00 PM", title: "Grand Banquet", desc: "A four-course culinary journey, heartfelt speeches." },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-center w-full">
                  {/* Left Column (Times) */}
                  <div className="md:w-1/2 md:pr-12 md:text-right flex md:block justify-center mb-2 md:mb-0">
                    <span className="font-serif italic text-lg text-[#C5A880] tracking-wide">{item.time}</span>
                  </div>
                  
                  {/* Axis Node Indicator */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-[#C5A880] ring-4 ring-[#FDFBF7]" />
                  
                  {/* Right Column (Descriptions) */}
                  <div className="md:w-1/2 md:pl-12 text-center md:text-left">
                    <h4 className="font-serif font-bold text-xl text-[#4A433A] mb-2">{item.title}</h4>
                    <p className="text-sm text-[#7D7261] leading-relaxed max-w-xs mx-auto md:mx-0">{item.desc}</p>
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

            <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-lg mx-auto">
              We respectfully invite our elegant family and friends to match our theme and blend into our story with soft, sophisticated earthy tones. Please wear semi-formal attire:
            </p>

            <div className="flex flex-wrap justify-center gap-6 pt-4 max-w-2xl mx-auto">
              {[
                { hex: "bg-[#F3EFE0]", name: "Warm Champagne" },
                { hex: "bg-[#D8C3A5]", name: "Soft Sand" },
                { hex: "bg-[#8E8D8A]", name: "Earthy Taupe" },
                { hex: "bg-[#EAE7DC]", name: "Natural Linen" },
                { hex: "bg-[#D9B08C]", name: "Warm Gold" },
                { hex: "bg-[#116466]", name: "Deep Sage" },
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
        <img 
          src={COUPLE_PHOTOS.pre_rsvp} 
          alt="RSVP transition layout" 
          className="w-full h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50" 
        />
      </div>

      {/* ============================================================================
          BLOCK 8: THE RSVP (Luxurious Bordered Physical RSVP Card Redesign)
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
              <p className="font-serif text-xl sm:text-2xl text-[#C5A880] italic">February 15, 2027</p>
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
          BLOCK 9: LAYERED RECORD VISUALIZER PRE-HUB (Realistic Vinyl Record Overlay)
          ============================================================================ */}
      <section id="interactive" className="py-20 px-4 bg-[#FDFBF7] flex flex-col items-center">
        <div className="w-full max-w-md relative flex flex-col items-center mt-10">

          {/* Record Peeking from Top */}
          <div className="relative w-[280px] h-[280px] -mb-32 z-10 flex flex-col items-center justify-start pointer-events-none">
            <div 
              className={`absolute top-0 w-[260px] h-[260px] rounded-full bg-[#111111] border-4 border-[#222222] shadow-[0_-10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden transition-all duration-[4000ms] ease-linear pointer-events-auto ${
                isMusicPlaying ? "animate-spin" : ""
              }`}
              style={{
                backgroundImage: "repeating-radial-gradient(circle, #222222, #111111 2px, #222222 4px)"
              }}
            >
              {/* Arched text across grooves */}
              <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full z-20">
                <path id="vinyl-curve" d="M 30,130 A 100,100 0 0,1 230,130" fill="transparent" />
                <text className="text-[12px] uppercase tracking-[0.3em] font-serif fill-[#EADCC9] opacity-90 drop-shadow-md">
                  <textPath href="#vinyl-curve" startOffset="50%" textAnchor="middle">
                    《 ONLY FOR YOU 》
                  </textPath>
                </text>
              </svg>

              <div className="absolute inset-4 rounded-full border border-white/5" />
              <div className="absolute inset-10 rounded-full border border-white/5" />
              <div className="absolute inset-16 rounded-full border border-white/10" />

              {/* Center spindle photo */}
              <div className="absolute w-24 h-24 rounded-full bg-[#C5A880] border-2 border-white overflow-hidden shadow-inner flex items-center justify-center">
                <img src={COUPLE_PHOTOS.vinyl_center} alt="Couple label" className="w-full h-full object-cover" />
                <div className="absolute w-3 h-3 rounded-full bg-white border border-[#5C5346]" />
              </div>
            </div>
          </div>

          {/* Overlapping Glass Quote Card */}
          <div className="relative z-20 w-[90%] bg-white/80 backdrop-blur-xl p-8 rounded-t-[2rem] shadow-[0_-10px_20px_rgba(0,0,0,0.03)] border-t border-x border-white/60 text-center">
            <p className="font-serif italic text-xs sm:text-sm leading-loose text-[#5C5346] tracking-wide">
              "If the sun were to rise in the west, <br />
              I'd never change my mind to love you forever. <br />
              I love you not for who you are, but for who I am before you."
            </p>
          </div>

          {/* Main Portrait Frame with Redesigned Sleek Audio Player */}
          <div className="relative z-10 w-full bg-white rounded-b-[2rem] shadow-2xl overflow-hidden border border-white">
            <img src={COUPLE_PHOTOS.pre_rsvp} className="w-full h-[450px] sm:h-[500px] object-cover" alt="Couple portrait" />
            
            {/* Redesigned sleek play/pause media bar */}
            <div className="absolute bottom-6 left-6 right-6 z-30 bg-black/45 backdrop-blur-md border border-white/20 p-3 sm:p-4 rounded-2xl flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                  className="w-12 h-12 rounded-full bg-[#C5A880] text-white flex items-center justify-center hover:bg-[#B3966E] transition-all transform active:scale-95 shadow-md"
                >
                  {isMusicPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                <div className="text-left">
                  <p className="text-xs font-serif italic text-white tracking-wide mb-0.5">Procedural Wedding Chimes</p>
                  <p className="text-[9px] text-white/70 uppercase tracking-widest font-semibold">Ambient Synthesizer</p>
                </div>
              </div>
              
              {/* Animated Audio Visualizer */}
              <div className="flex items-end gap-[3px] h-8 pr-2">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div 
                    key={bar} 
                    className={`w-1 bg-[#C5A880] rounded-t-sm transition-all duration-300 ${isMusicPlaying ? 'animate-pulse' : 'h-1'}`}
                    style={{ 
                      height: isMusicPlaying ? `${Math.max(8, Math.random() * 28)}px` : '4px',
                      transitionDelay: `${bar * 50}ms`
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>

        </div>
      </section>

      {/* ============================================================================
          BLOCK 10 & 11: SONG REQUESTS & LEDGER (Stacked Vertical Design)
          ============================================================================ */}
      <section id="song-requests" className="py-24 px-4 bg-[#FAF6F0]">
        <div className="max-w-3xl mx-auto flex flex-col space-y-24">
          
          {/* Song Requests Section (On Top) */}
          <div className="space-y-8 bg-white p-8 sm:p-12 border border-[#EADCC9] shadow-sm rounded-sm">
            <div className="text-center space-y-2 border-b border-[#EADCC9]/50 pb-6">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Your Sound, Our Day</span>
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
                  {playlistRequests.map((s, i) => (
                    <span key={i} className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FAF6F0] text-[#7D7261] text-xs border border-[#EADCC9]/50 shadow-sm">
                      <Music className="w-3 h-3 mr-2 text-[#C5A880]" />
                      <span className="font-semibold text-[#4A433A] mr-1">{s.title}</span> by {s.artist}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Journal Ledger Section (On Bottom) */}
          <div className="space-y-8 bg-white p-8 sm:p-12 border border-[#EADCC9] shadow-sm rounded-sm">
            <div className="text-center space-y-2 border-b border-[#EADCC9]/50 pb-6">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Leave Your Blessings</span>
              <h3 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">The Sentiment Ledger</h3>
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
                placeholder="Write your beautiful note..."
                rows={3}
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
                <BookOpen className="w-4 h-4 text-[#C5A880]" /> Recent Messages
              </h4>
              <div className="space-y-8">
                {ledgerMessages.slice(0, 3).map((msg, i) => (
                  <div key={i} className="text-center space-y-2">
                    <p className="text-sm text-[#7D7261] italic leading-relaxed">"{msg.message}"</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#9C8F7E] font-semibold">— {msg.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================================
          BLOCK 12: CROWDSOURCED MEDIA UPLOAD GALLERY FEED
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
            <label className="flex items-center gap-3 px-10 py-4 bg-white border border-[#EADCC9] text-[#C5A880] font-semibold text-xs tracking-[0.2em] uppercase rounded-sm shadow-sm hover:bg-[#FAF6F0] transition-all cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>Upload Moments</span>
              <input type="file" multiple accept="image/*,video/mp4,video/quicktime,video/x-m4v" onChange={handleMediaUpload} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {mediaGallery.slice(0, 6).map((media, idx) => (
              <div 
                key={idx} 
                onClick={() => setLightboxIndex(idx)}
                className="aspect-square bg-[#EADCC9] overflow-hidden cursor-pointer relative group rounded-sm"
              >
                <img src={media.url} alt={`Gallery item ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 group-hover:opacity-100" />
              </div>
            ))}
          </div>

          {mediaGallery.length > 6 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowGalleryGrid(true)}
                className="px-8 py-3 bg-transparent border border-[#C5A880] text-[#C5A880] text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-[#C5A880] hover:text-white transition-all"
              >
                View Full Grid
              </button>
            </div>
          )}

        </div>
      </section>

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
          FLOATING NAV LAYER (SPEED DIAL)
          ============================================================================ */}
      {showFAB && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          
          <div className="flex flex-col items-end gap-2 transition-all duration-300">
            <button 
              onClick={() => scrollToAnchor('map')}
              className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Venue & Map</span>
            </button>
            
            <button 
              onClick={() => scrollToAnchor('timings')}
              className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Details</span>
            </button>

            {/* Anchors directly to the song-requests section header */}
            <button 
              onClick={() => scrollToAnchor('song-requests')}
              className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Interactive Hub</span>
            </button>

            <button 
              onClick={() => scrollToAnchor('gallery-header')}
              className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Shared Gallery</span>
            </button>
          </div>

          <button
            onClick={triggerOpenRsvp}
            className="w-14 h-14 bg-[#C5A880] hover:bg-[#B3966E] text-white rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
            title="RSVP Seating Form"
          >
            <Users className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* ============================================================================
          SMART RSVP PROFILE CHAINING SHEET (Redesigned Editorial Minimalist Inputs)
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
                        <div key={guest.id} className="bg-white p-6 sm:p-8 rounded-sm border border-[#EADCC9] shadow-sm space-y-6 relative">
                          <div className="flex justify-between items-center pb-4 border-b border-[#FAF6F0]">
                            <span className="text-xs font-serif font-semibold text-[#C5A880] uppercase tracking-widest">
                              Guest {index + 1}
                            </span>
                            {index > 0 && (
                              <button 
                                type="button"
                                onClick={() => handleRemoveGuest(guest.id)}
                                className="text-[10px] text-red-600 uppercase tracking-widest font-semibold hover:text-red-800 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {/* Minimalist Floating Label / Bottom Border Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="relative">
                              <input
                                type="text"
                                id={`fname-${guest.id}`}
                                placeholder=" "
                                value={guest.firstName}
                                onChange={(e) => handleUpdateGuest(guest.id, "firstName", e.target.value)}
                                className="block w-full px-0 py-3 text-sm text-[#4A433A] bg-transparent border-0 border-b border-[#DCD3BD] appearance-none focus:outline-none focus:ring-0 focus:border-[#C5A880] peer"
                                required
                              />
                              <label htmlFor={`fname-${guest.id}`} className="absolute text-[10px] uppercase tracking-widest text-[#9C8F7E] duration-300 transform -translate-y-4 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#C5A880] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">First Name</label>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                id={`lname-${guest.id}`}
                                placeholder=" "
                                value={guest.lastName}
                                onChange={(e) => handleUpdateGuest(guest.id, "lastName", e.target.value)}
                                className="block w-full px-0 py-3 text-sm text-[#4A433A] bg-transparent border-0 border-b border-[#DCD3BD] appearance-none focus:outline-none focus:ring-0 focus:border-[#C5A880] peer"
                                required
                              />
                              <label htmlFor={`lname-${guest.id}`} className="absolute text-[10px] uppercase tracking-widest text-[#9C8F7E] duration-300 transform -translate-y-4 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#C5A880] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Last Name</label>
                            </div>
                          </div>

                          {/* Refined Clickable Toggles instead of Select Box */}
                          <div className="relative pt-2">
                            <label className="text-[9px] uppercase font-bold text-[#9C8F7E] tracking-widest mb-3 block">Attendance Status</label>
                            <div className="flex gap-4">
                              <label className="flex-1 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`attending-${guest.id}`} 
                                  value="Attending"
                                  checked={guest.attending === "Attending"}
                                  onChange={(e) => handleUpdateGuest(guest.id, "attending", e.target.value)}
                                  className="peer sr-only" 
                                />
                                <div className="text-center py-3 border border-[#EADCC9] rounded-sm text-xs font-serif text-[#7D7261] peer-checked:bg-[#C5A880] peer-checked:text-white peer-checked:border-[#C5A880] transition-all">
                                  Joyfully Attending
                                </div>
                              </label>
                              <label className="flex-1 cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`attending-${guest.id}`} 
                                  value="Declining"
                                  checked={guest.attending === "Declining"}
                                  onChange={(e) => handleUpdateGuest(guest.id, "attending", e.target.value)}
                                  className="peer sr-only" 
                                />
                                <div className="text-center py-3 border border-[#EADCC9] rounded-sm text-xs font-serif text-[#7D7261] peer-checked:bg-[#FAF6F0] peer-checked:text-[#4A433A] peer-checked:border-[#DCD3BD] transition-all">
                                  Regretfully Declining
                                </div>
                              </label>
                            </div>
                          </div>

                          <div className="relative pt-4">
                            <input
                              type="text"
                              id={`diet-${guest.id}`}
                              placeholder=" "
                              value={guest.dietary}
                              onChange={(e) => handleUpdateGuest(guest.id, "dietary", e.target.value)}
                              className="block w-full px-0 py-3 text-sm text-[#4A433A] bg-transparent border-0 border-b border-[#DCD3BD] appearance-none focus:outline-none focus:ring-0 focus:border-[#C5A880] peer"
                            />
                            <label htmlFor={`diet-${guest.id}`} className="absolute text-[10px] uppercase tracking-widest text-[#9C8F7E] duration-300 transform -translate-y-4 scale-75 top-7 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#C5A880] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Dietary Requirements (e.g. Vegetarian, None)</label>
                          </div>
                        </div>
                      ))}

                      <div className="space-y-4 pt-4">
                        <button
                          type="button"
                          onClick={handleAddFamilyMember}
                          className="w-full py-4 bg-transparent border border-dashed border-[#C5A880] text-[#C5A880] rounded-sm text-xs font-semibold tracking-widest uppercase hover:bg-[#FAF6F0] transition-all flex items-center justify-center gap-2"
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
          FULL GRID GALLERY MODAL (Redesigned Gallery View)
          ============================================================================ */}
      {showGalleryGrid && (
        <div className="fixed inset-0 z-50 bg-[#FDFBF7] overflow-y-auto">
          <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EADCC9] z-20 px-6 py-4 flex justify-between items-center">
            <h3 className="font-serif text-2xl text-[#4A433A]">Full Gallery Grid</h3>
            <button 
              onClick={() => setShowGalleryGrid(false)}
              className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#7D7261] hover:text-[#C5A880] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Invite
            </button>
          </div>
          
          <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {mediaGallery.map((media, idx) => (
                <div key={idx} className="aspect-square bg-[#EADCC9] overflow-hidden rounded-sm">
                  {media.url.match(/\.(mp4|mov|m4v)$/i) ? (
                    <video 
                      src={media.url} 
                      className="w-full h-full object-cover" 
                      controls={false} // Disable controls for a clean aesthetic
                    />
                  ) : (
                    <img 
                      src={media.url} 
                      alt={`Gallery item ${idx}`} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          LIGHTBOX MODAL FOR IMAGES (Z-index 60 to sit above Grid Modal)
          ============================================================================ */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6">
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setLightboxIndex(null)}
              className="w-12 h-12 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-8 h-8" />
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

    </div>
  );
}