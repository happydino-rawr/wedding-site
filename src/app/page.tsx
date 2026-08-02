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
import GalleryPreviewSection from '../components/GalleryPreviewSection';
import Footer from '../components/Footer';

// --- Modals & Overlays ---
import FullGalleryModal from '../components/FullGalleryModal';
import RsvpSheetModal from '../components/RsvpSheetModal';
import FloatingActionMenu from '../components/FloatingActionMenu';

// --- Utilities & Constants ---
import { COUPLE_PHOTOS, ACCESS_PASSCODE, WEDDING_DATE, RSVP_CUTOFF_DATE } from '../lib/constants';
import { audio, initAudio, getAudio } from '../utils/audio';

// --- Interfaces ---
export interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  attending: string;
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
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [showGalleryGrid, setShowGalleryGrid] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [_myUploadedKeys, setMyUploadedKeys] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadToast, setUploadToast] = useState<string>("");

  // Deletion State
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keysToDelete, setKeysToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');

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
  
  // Initial Loads
  useEffect(() => {
    const saved = localStorage.getItem("my_wedding_uploads");
    if (saved) setMyUploadedKeys(JSON.parse(saved));
    refreshGallery();
    
    const session = localStorage.getItem("wedding_session_token");
    if (session === "true") setIsAuthenticated(true);
  }, []);

  // Toast Timer
  useEffect(() => {
    if (!uploadToast) return;
    const timer = window.setTimeout(() => setUploadToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [uploadToast]);

  // Scroll Listeners
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

  // Countdown Logic
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

  // Envelope Visibility & Responsiveness
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

  // Audio Logic
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
      const audioInstance = getAudio('/wedding_song.mp3'); // Fixed missing underscore from previous code
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

  // Day-Of Tracker
  useEffect(() => {
    const weddingDayStart = new Date('2027-03-06T00:00:00').getTime();
    const weddingDayEnd = new Date('2027-03-07T00:00:00').getTime();
    const itineraryTimings = [
      { time: new Date('2027-03-06T12:00:00').getTime(), title: "Tea Ceremony" },
      { time: new Date('2027-03-06T13:30:00').getTime(), title: "Guest Arrival" },
      { time: new Date('2027-03-06T14:00:00').getTime(), title: "The Ceremony" },
      { time: new Date('2027-03-06T15:00:00').getTime(), title: "Travel & Rest" },
      { time: new Date('2027-03-06T18:30:00').getTime(), title: "Grand Banquet" },
    ];

    const handleTimeCheck = () => {
      const now = Date.now();
      setIsWeddingDay(now >= weddingDayStart && now < weddingDayEnd);

      let activeIdx = -1;
      for (let i = 0; i < itineraryTimings.length; i++) {
        const eventTime = itineraryTimings[i].time;
        const nextEventTime = itineraryTimings[i + 1]?.time || weddingDayEnd;
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

  const refreshGallery = async () => {
    try {
      const res = await fetch('/api/gallery'); 
      const data = await res.json();
      const publicBaseUrl = "https://pub-24a198c3bcd44e7ab19fd37353cb5c07.r2.dev";
      const rawImages = Array.isArray(data.images) ? data.images : [];

      const parseKeyTimestamp = (key: string) => {
        const match = key.match(/^(\d{13})_/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const sortedImages = [...rawImages].sort((a, b) => parseKeyTimestamp(b) - parseKeyTimestamp(a));

      const itemsWithUrls = sortedImages.map((key: string) => {
        const lowerKey = key.toLowerCase();
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
          isVideo: isVideoFile 
        };
      });
      setMediaGallery(itemsWithUrls);
    } catch (err) {
      console.error("Failed to refresh gallery:", err);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const filesArray = Array.from(files);
      const totalBytes = filesArray.reduce((sum, file) => sum + file.size, 0);
      let uploadedBytes = 0;
      
      setUploadError("");
      setIsUploading(true);
      setUploadProgress(0);
      setUploadToast("");

      const beforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener('beforeunload', beforeUnload);

      const newOptimisticFiles = filesArray.map((file) => {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name);
        return {
          url: URL.createObjectURL(file),
          type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          isVideo,
          key: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
      });

      setMediaGallery((prev) => [...newOptimisticFiles, ...prev]);

      const uploadSingleFile = (file: File) => {
        return new Promise<string | null>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append("file", file);

          xhr.open('POST', '/api/upload');
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round(((uploadedBytes + event.loaded) / totalBytes) * 100);
              setUploadProgress(Math.min(100, progress));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.key ?? null);
              } catch (parseError) {
                resolve(null);
              }
            } else {
              reject(new Error(`Upload failed for ${file.name}`));
            }
          };
          xhr.onerror = () => reject(new Error(`Network error`));
          xhr.send(formData);
        });
      };

      try {
        let hasUploadError = false;
        for (const file of filesArray) {
          try {
            const key = await uploadSingleFile(file);
            if (key) {
              setMyUploadedKeys((prev) => {
                const updated = [...prev, key];
                localStorage.setItem("my_wedding_uploads", JSON.stringify(updated));
                return updated;
              });
            }
          } catch (uploadErr) {
            hasUploadError = true;
            setUploadError((prev) => prev || `Upload failed for ${file.name}.`);
          } finally {
            uploadedBytes += file.size;
            setUploadProgress(Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)));
          }
        }
        await refreshGallery();
        setUploadToast(hasUploadError ? "Upload finished with some errors." : "Uploads complete!");
      } catch (error) {
        setUploadError("Upload interrupted.");
      } finally {
        window.removeEventListener('beforeunload', beforeUnload);
        setIsUploading(false);
        setUploadProgress(0);
        e.target.value = "";
      }
  };

  // UI Nav Handlers
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
  // CONDITIONAL RENDERING (Auth Gate & Day-of Layouts)
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

      <GalleryPreviewSection 
        mediaGallery={mediaGallery}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
        uploadToast={uploadToast}
        onUpload={handleMediaUpload}
        onOpenFullGallery={() => setShowGalleryGrid(true)}
        onSetLightboxIndex={setLightboxIndex}
      />

      <Footer />

      {/* --- 4. Overlays & Modals --- */}
      {showGalleryGrid && (
        <FullGalleryModal 
          mediaGallery={mediaGallery}
          onClose={() => {
            setShowGalleryGrid(false);
            setIsDeleteMode(false);
            setSelectedKeys([]);
          }}
          lightboxIndex={lightboxIndex}
          setLightboxIndex={setLightboxIndex}
          // Pass down any delete state/functions your modal needs
          isDeleteMode={isDeleteMode}
          setIsDeleteMode={setIsDeleteMode}
          selectedKeys={selectedKeys}
          setSelectedKeys={setSelectedKeys}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          deleteStatus={deleteStatus}
          setDeleteStatus={setDeleteStatus}
          isDeleting={isDeleting}
          setKeysToDelete={setKeysToDelete}
          keysToDelete={keysToDelete}
        />
      )}

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