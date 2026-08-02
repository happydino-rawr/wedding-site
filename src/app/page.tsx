"use client";
import React, { useState, useEffect, useRef } from 'react';

// --- Core Components ---
import { AuthGate } from '../components/AuthGate';
import InvitationEnvelopeSection, { type WeddingInfo } from '../components/InvitationEnvelopeSection';
import CountdownSection from '../components/CountdownSection';
import CeremonyVenueSection from '../components/CeremonyVenueSection';
import ReceptionVenueSection from '../components/ReceptionVenueSection';
import ItinerarySection from '../components/ItinerarySection';
import RsvpSection from '../components/RsvpSection';

// --- Newly Extracted UI Components ---
import HeroSection from '../components/HeroSection';
import VinylVisualizerSection from '../components/VinylVisualizerSection';
import OurStorySection from '../components/OurStorySection';
import Footer from '../components/Footer';

// --- Modals & Overlays ---
import RsvpSheetModal from '../components/RsvpSheetModal';
import FloatingActionMenu from '../components/FloatingActionMenu';

// --- Utilities & Constants ---
import { 
  COUPLE_PHOTOS, 
  ACCESS_PASSCODE, 
  WEDDING_DATE, 
  RSVP_CUTOFF_DATE,
  WEDDING_DAY_START,
  WEDDING_DAY_END,
  ITINERARY_TIMINGS
} from '../lib/constants';
import { audio, initAudio, getAudio } from '../utils/audio';

// --- Interfaces ---
export interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  attending: 'Attending both ceremony and reception' | 'Reception only' | 'Declining' | '';
  email: string;
  dietary: string;
}

export interface MediaItem {
  type?: string;
  url: string;
  key: string;
  isVideo?: boolean;
}

export default function WeddingPage() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [passcode, setPasscode] = useState("");
  
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Gallery State
  const [showGalleryGrid, setShowGalleryGrid] = useState(false);
  const [_myUploadedKeys, setMyUploadedKeys] = useState<string[]>([]);
  const [uploadToast, setUploadToast] = useState<string>("");

  // RSVP State
  const [guestsList, setGuestsList] = useState<Guest[]>([]); 
  const [isEditing, setIsEditing] = useState(false);
  const isCutoffPassed = new Date() > RSVP_CUTOFF_DATE;

  // Envelope State
  const [envelopeVisible, setEnvelopeVisible] = useState(false);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const [openTranslateY, setOpenTranslateY] = useState<number>(-160);
  const [closedTranslateY, setClosedTranslateY] = useState<number>(10);
  const lastScrollY = useRef(0);

  // Day-Of State
  const [isWeddingDay, setIsWeddingDay] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);

  // Constants
  const weddingInfo: WeddingInfo = {
    coupleNames: 'Jessica & William',
    ceremonyName: 'Harbour View Lawn',
    ceremonyAddress: 'Royal Botanic Garden Sydney, Sydney NSW 2000',
    receptionName: 'Cabravale Club Resort',
    receptionAddress: '1 Bartley Street, Canley Vale NSW 2166',
    ceremonyTime: '2:00 PM',
    receptionTime: '6:30 PM',
    eventDateLabel: 'Saturday, 6 March 2027',
    eventDateShort: '06·03·2027',
    calendarTitle: "Jessica & William's Wedding",
    calendarDescription: 'Please join us for our wedding ceremony and reception. Kindly bring your ID for venue entry.',
    calendarLocation: 'Harbour View Lawn, Royal Botanic Garden Sydney, Sydney NSW 2000',
  };

  const rsvpDeadlineLabel = RSVP_CUTOFF_DATE.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ============================================================================
  // EFFECTS & LIFECYCLES
  // ============================================================================
  
  useEffect(() => {
    const saved = localStorage.getItem("my_wedding_uploads");
    if (saved) setMyUploadedKeys(JSON.parse(saved));
    
    const session = localStorage.getItem("wedding_session_token");
    if (session === "true") setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!uploadToast) return;
    const timer = window.setTimeout(() => setUploadToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [uploadToast]);

  useEffect(() => {
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
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setEnvelopeVisible(true);
    }, { threshold: 0.35 }); 
    if (envelopeRef.current) observer.observe(envelopeRef.current);
    return () => { if (envelopeRef.current) observer.unobserve(envelopeRef.current); };
  }, []);

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

  useEffect(() => {
    const handleEnvelopeCheck = () => {
      if (!envelopeRef.current) return;
      const rect = envelopeRef.current!.getBoundingClientRect();
      const vh = window.innerHeight;
      const currentScrollY = window.scrollY;
      const shouldOpen = rect.top < vh * 0.85;
      const shouldClose = rect.bottom < vh * 0.3;
      const isScrollingUp = currentScrollY < lastScrollY.current;

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
    initAudio('/wedding_song.mp3');
    const handleInteraction = () => {
      if (audio) {
        audio.play().catch(e => console.error("Playback failed:", e));
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []); 

  useEffect(() => {
    if (audio) {
      if (isMusicPlaying) {
        audio.play().catch(e => console.log("Play toggle blocked:", e));
      } else {
        audio.pause();
      }
    }
  }, [isMusicPlaying]);

  useEffect(() => {
    const startMusic = () => {
      const audioInstance = getAudio('/wedding_song.mp3');
      if (audioInstance && audioInstance.paused) {
        audioInstance.currentTime = 6;
        audioInstance.play().catch(console.error);
        window.removeEventListener('click', startMusic);
        window.removeEventListener('touchstart', startMusic);
      }
    };
    window.addEventListener('click', startMusic);
    window.addEventListener('touchstart', startMusic);
    return () => {
      window.removeEventListener('click', startMusic);
      window.removeEventListener('touchstart', startMusic);
    }
  }, []);

  useEffect(() => {
		const handleTimeCheck = () => {
				const now = Date.now();
				
				// Use the imported constants here!
				setIsWeddingDay(now >= WEDDING_DAY_START && now < WEDDING_DAY_END);

				let activeIdx = -1;
				for (let i = 0; i < ITINERARY_TIMINGS.length; i++) {
					const eventTime = ITINERARY_TIMINGS[i].time;
					const nextEventTime = ITINERARY_TIMINGS[i + 1]?.time || WEDDING_DAY_END;
					if (now >= eventTime && now < nextEventTime) {
						activeIdx = i;
						break;
					}
				}
				setCurrentEventIndex(activeIdx);
			};

    handleTimeCheck();
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') handleTimeCheck(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleTimeCheck);
    const timer = setInterval(handleTimeCheck, 5 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleTimeCheck);
      clearInterval(timer);
    };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleAuthSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passcode.trim() === ACCESS_PASSCODE) {
      localStorage.setItem("wedding_session_token", "true");
      setIsAuthenticated(true);
      setIsMusicPlaying(true);
    } else {
      setAuthError("Incorrect passcode. Please refer to your invitation card.");
    }
  };

  const handleAddToCalendar = () => {
    const title = `${weddingInfo.calendarTitle} (Please bring your ID)`;
    const description = `${weddingInfo.calendarDescription}\nPlease RSVP and check the details on our wedding website.`;
    const location = weddingInfo.calendarLocation;

    const formatIcsDate = (date: Date) => {
      const pad = (value: number) => String(value).padStart(2, '0');
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    };

    const startTime = formatIcsDate(WEDDING_DATE);
    const endTime = formatIcsDate(new Date(WEDDING_DATE.getTime() + 6 * 60 * 60 * 1000));

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

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Jessica-and-William-Wedding.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const scrollToAnchor = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };
  const triggerOpenRsvp = () => {
    setIsRsvpOpen(!isRsvpOpen);
    setIsMenuOpen(false);
  };

  // ============================================================================
  // CONDITIONAL RENDERING (Auth Gate)
  // ============================================================================
  
  if (!isAuthenticated) {
    return (
      <AuthGate
        passcode={passcode}
        authError={authError}
        onPasscodeChange={setPasscode}
        onSubmit={handleAuthSubmit}
        title={weddingInfo.coupleNames}
        backgroundImage={COUPLE_PHOTOS.pre_map}
      />
    );
  }

  const renderSections = () => {
    const envelopeSectionComponent = (
      <InvitationEnvelopeSection
        envelopeRef={envelopeRef}
        envelopeVisible={envelopeVisible}
        openTranslateY={openTranslateY}
        closedTranslateY={closedTranslateY}
        weddingInfo={weddingInfo}
        onAddToCalendar={handleAddToCalendar}
      />
    );
    const countdownSectionComponent = <CountdownSection timeLeft={timeLeft} />;
    const ceremonyMapSectionComponent = (
      <CeremonyVenueSection ceremonyName={weddingInfo.ceremonyName} ceremonyAddress={weddingInfo.ceremonyAddress} />
    );
    const receptionMapSectionComponent = (
      <ReceptionVenueSection receptionName={weddingInfo.receptionName} receptionAddress={weddingInfo.receptionAddress} />
    );
    const timingsSectionComponent = (
      <ItinerarySection isWeddingDay={isWeddingDay} currentEventIndex={currentEventIndex} weddingInfo={weddingInfo} />
    );
    const rsvpSectionComponent = (
      <RsvpSection onOpenRsvp={triggerOpenRsvp} deadlineLabel={rsvpDeadlineLabel} />
    );

    return (
      <>
        {isWeddingDay ? (
          <>
            {timingsSectionComponent}
            {ceremonyMapSectionComponent}
            {receptionMapSectionComponent}
          </>
        ) : (
          <>
            {envelopeSectionComponent}
            {countdownSectionComponent}
            {ceremonyMapSectionComponent}
            {receptionMapSectionComponent}
            {timingsSectionComponent}
            {rsvpSectionComponent}
          </>
        )}
      </>
    );
  };

  // ============================================================================
  // THE MAIN RETURN STATEMENT
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#5C5346] font-sans selection:bg-[#C5A880] selection:text-white pb-20 relative overflow-x-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Fascinate&family=Fascinate+Inline&display=swap');
        .script-font {
          font-family: 'Alex Brush', cursive !important;
          transform: rotate(-2deg);
        }
      `}</style>

      {/* --- 1. Top Content --- */}
      <HeroSection 
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={() => setIsMusicPlaying(!isMusicPlaying)}
        onBeginClick={() => scrollToAnchor('countdown-anchor')}
      />

      {/* --- 2. Dynamic Middle Sections --- */}
      {renderSections()}

      {/* --- 3. Bottom Content --- */}
      <VinylVisualizerSection 
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={() => setIsMusicPlaying(!isMusicPlaying)}
      />

      <OurStorySection />

			<div className="py-20 text-center bg-[#FDFBF7]">
			<h3 className="font-serif text-2xl text-[#4A433A] mb-4">Capture the Day</h3>
      <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
      <p className="text-[13px] text-[#7D7261] max-w-md mx-auto pt-4 mb-8 leading-relaxed">
        Our story, seen through your eyes. Please upload your photos below to help us preserve every single moment of our special day.
      </p>			<a
				href="/share-gallery"
				className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all"
			>
				Open Shared Gallery
			</a>
			</div>

      <Footer />

      {/* --- 4. Overlays & Modals --- */}
      {isRsvpOpen && (
        <RsvpSheetModal 
          onClose={() => setIsRsvpOpen(false)}
          isCutoffPassed={isCutoffPassed}
          guestsList={guestsList}
          setGuestsList={setGuestsList}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      )}

      {!showGalleryGrid && !isRsvpOpen && (
        <FloatingActionMenu 
          showFAB={showFAB}
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
          onScrollTo={scrollToAnchor}
          onOpenRsvp={triggerOpenRsvp}
        />
      )}
    </div>
  );
}