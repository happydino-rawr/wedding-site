import React from 'react';
import { Heart } from 'lucide-react';
import { COUPLE_PHOTOS } from '../lib/constants';
import RsvpSection from './RsvpSection';

export interface WeddingInfo {
  coupleNames: string;
  ceremonyName: string;
  ceremonyAddress: string;
  receptionName: string;
  receptionAddress: string;
  ceremonyTime: string;
  receptionTime: string;
  eventDayOfWeek: string;
  eventDateShort: string;
  calendarTitle?: string;
  calendarDescription?: string;
  calendarLocation?: string;
}

interface InvitationEnvelopeSectionProps {
  envelopeRef: React.RefObject<HTMLDivElement | null>;
  envelopeVisible: boolean;
  openTranslateY: number;
  closedTranslateY: number;
  weddingInfo: WeddingInfo;
  onAddToCalendar: () => void;
  onOpenRsvp?: () => void;
  deadlineLabel?: string;
}

export default function InvitationEnvelopeSection({
  envelopeRef,
  envelopeVisible,
  openTranslateY,
  closedTranslateY,
  weddingInfo,
  onAddToCalendar,
  onOpenRsvp,
  deadlineLabel,
}: InvitationEnvelopeSectionProps) {
  return (
    <section className="py-20 md:py-32 px-4 bg-[#FDFBF7] flex flex-col items-center min-h-[700px] justify-center overflow-visible">
      <div className="max-w-xl md:max-w-2xl w-full text-center">
        <div
          ref={envelopeRef}
          className="relative w-[280px] sm:w-[340px] md:w-[480px] h-[200px] sm:h-[240px] md:h-[340px] mx-auto mb-20 md:mb-32 mt-8 md:mt-12 lg:mt-20 xl:mt-24 select-none overflow-visible animate-pulse-subtle"
          style={{ perspective: '1200px' }}
        >
          <div className="absolute inset-0 bg-[#E8E1D5] rounded-sm shadow-inner border border-[#D5CBA7] overflow-hidden z-0">
            <div className="absolute inset-1 bg-[#EBE5DA] rounded-sm" />
          </div>

          <div
            className="absolute left-4 right-4 bottom-0 h-[210px] sm:h-[255px] md:h-[360px] bg-white p-2 sm:p-3 md:p-4 pb-6 sm:pb-8 md:pb-12 rounded-sm shadow-xl border border-slate-200/60 transition-[transform,opacity] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
            style={{
              transform: envelopeVisible
                ? `translateY(${openTranslateY}px) rotate(1deg) scale(1.02)`
                : `translateY(${closedTranslateY}px) rotate(0deg) scale(0.95)`,
              opacity: envelopeVisible ? 1 : 0,
              pointerEvents: envelopeVisible ? 'auto' : 'none',
            }}
          >
            <img
              src={COUPLE_PHOTOS.envelope_couple}
              alt="Envelope portrait"
              className="w-full h-[175px] sm:h-[210px] md:h-[300px] object-cover rounded-sm border border-slate-100"
            />
          </div>

          <svg viewBox="0 0 400 280" preserveAspectRatio="none" className="absolute inset-0 w-full h-full drop-shadow-xl z-20 pointer-events-none">
            <polygon points="0,280 0,0 200,160" fill="#F4EFE8" stroke="#E3D8C8" strokeWidth="1" />
            <polygon points="400,280 400,0 200,160" fill="#F0EBE3" stroke="#E3D8C8" strokeWidth="1" />
            <polygon points="0,280 400,280 200,158" fill="#F7F3ED" stroke="#E3D8C8" strokeWidth="1" />
          </svg>

          <div
            className="absolute top-0 inset-x-0 h-[115px] sm:h-[138px] md:h-[195px] origin-top transition-[transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none will-change-transform"
            style={{
              transform: envelopeVisible ? 'rotateX(180deg)' : 'rotateX(0deg)',
              zIndex: envelopeVisible ? 5 : 30,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full h-full drop-shadow-md">
              <polygon points="0,0 400,0 200,160" fill="#F4EFE8" stroke="#E3D8C8" strokeWidth="1" />
            </svg>
          </div>

          <div className="absolute top-[52%] sm:top-[54%] inset-x-0 flex flex-col items-center z-40 pointer-events-none">
            <div className="w-[80px] sm:w-24 md:w-32 h-auto -mt-3">
              <svg viewBox="0 0 100 50" fill="none" className="w-full h-full">
                <path d="M50,25 C25,5 5,10 15,30 C20,40 45,35 50,25" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50,25 C85,5 105,15 90,30 C80,35 60,30 50,25" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="50" cy="26" r="3" fill="#BE123C" />
                <path d="M48,27 C30,45 25,55 35,55" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
                <path d="M52,27 C60,40 65,42 60,42" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

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

            <div className="mt-2 text-center select-none">
              <span
                className="block text-[#BE123C] text-[37px] sm:text-3xl md:text-5xl leading-none tracking-wide -mt-4 mb-6"
                style={{ fontFamily: "'Alex Brush', 'Brush Script MT', cursive", transform: 'rotate(-2deg)' }}
              >
                Our Wedding
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-7 pt-6 text-center relative z-20">
          <h3 className="font-serif text-lg md:text-2xl tracking-[0.2em] text-[#5C5346]">Inviting You To Our Wedding</h3>
          <div className="flex justify-center items-center gap-4 text-2xl md:text-4xl font-serif text-[#4A433A]">
            <span>{weddingInfo.coupleNames}</span>
          </div>
          <div className="space-y-6">
            <span className="text-[15px] md:text-xs uppercase tracking-[0.3em] text-[#9C8F7E] block font-serif">Save the Date</span>
              <p className="font-serif text-lg md:text-xl tracking-wider text-[#BE123C]">{weddingInfo.eventDateShort}</p>
              <p className="text-xs md:text-sm text-[#7D7261]">{weddingInfo.eventDayOfWeek}</p>
            <div className="w-8 md:w-12 h-[1px] bg-[#EADCC9] mx-auto my-2" />
          </div>
        </div>

        <div className="max-w-sm md:max-w-md mx-auto px-4 py-2 mt-4 relative z-20">
          <div className="grid grid-cols-7 gap-3 text-center text-[15px] md:text-xs font-serif text-[#9C8F7E] lowercase border-b border-[#EADCC9]/40 pb-2 mb-3">
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
            <span className="text-[#D5CBA7]">1</span><span className="text-[#D5CBA7]">2</span><span className="text-[#D5CBA7]">3</span>
          </div>

          <div className="mt-12 space-y-1 text-center text-[#5C5346]">
            <div className="w-12 h-[1px] bg-[#EADCC9]/40 mx-auto my-3" />
            <span className="text-[15px] md:text-xs uppercase tracking-widest text-[#9C8F7E] block italic">Ceremony</span>
            <p className="font-serif text-xl md:text-2xl text-[#4A433A]">{weddingInfo.ceremonyTime}</p>
            <span className="mt-5 text-[15px] md:text-xs uppercase tracking-widest text-[#9C8F7E] block italic">Reception</span>
            <p className="font-serif text-xl md:text-2xl text-[#4A433A]">{weddingInfo.receptionTime}</p>
          </div>
        </div>

        {onOpenRsvp && deadlineLabel && (
          <div className="mt-6">
            <RsvpSection onOpenRsvp={onOpenRsvp} deadlineLabel={deadlineLabel} />
          </div>
        )}

        <button
          onClick={onAddToCalendar}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 mt-6 mb-4 rounded-full border border-[#C5A880] text-[#7D7261] hover:bg-[#C5A880] hover:text-white transition-all text-xs md:text-sm tracking-widest uppercase font-light shadow-sm"
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Add to Calendar
        </button>

        <div className="flex flex-col items-center pt-2 pb-0 relative z-20">
          <p className="text-[18px] md:text-xs text-[#D5CBA7] italic tracking-wider max-w-xs md:max-w-sm mx-auto">
            We warmly invite you to celebrate this special day with us.
          </p>
        </div>
      </div>
    </section>
  );
}
