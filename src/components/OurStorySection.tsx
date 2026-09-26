import FadeInSection from './FadeInSection';
import { COUPLE_PHOTOS } from '../lib/constants';

export default function OurStorySection() {
  return (
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
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Jan 30, 2012</span>
                </div>

                <div className="w-full md:w-1/2 md:pr-16 flex flex-col items-center md:items-end text-center md:text-right order-3 md:order-1 mt-6 md:mt-0 px-4 md:px-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">Where it Began</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm mx-auto md:mr-0 md:ml-auto">
                      We met on the very first day of high school, same year 7 class.
                    </p>
                  </FadeInSection>
                </div>
                
                <div className="w-full md:w-1/2 md:pl-16 flex justify-center md:justify-start order-2 md:order-2 z-10">
                  <img src={COUPLE_PHOTOS.story1} alt="Where it Began" className="w-4/5 max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                </div>
              </div>

              {/* Story Event 2 (Desktop: Image L, Text R. Mobile: Text B, Image T) */}
              <div className="flex flex-col md:flex-row items-center w-full relative">
                {/* Center Floating Date Pill */}
                <div className="flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#C5A880] shadow-sm items-center justify-center z-20 mb-6 md:mb-0 order-1 md:order-none">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Sep 21, 2017</span>
                </div>

                <div className="w-full md:w-1/2 md:pr-16 flex justify-center md:justify-end order-2 md:order-1 z-10">
                  <img src={COUPLE_PHOTOS.story2} alt="High School Days" className="w-4/5 max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                </div>

                <div className="w-full md:w-1/2 md:pl-16 flex flex-col items-center md:items-start text-center md:text-left order-3 md:order-2 mt-6 md:mt-0 px-4 md:px-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">High School Days</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm mx-auto md:ml-0 md:mr-auto">
                      Years as friends, right through to Year 12 formal and then we graduated.
                    </p>
                  </FadeInSection>
                </div>
              </div>

              {/* Story Event 3 (Desktop: Text L, Image R. Mobile: Text B, Image T) */}
              <div className="flex flex-col md:flex-row items-center w-full relative">
                {/* Center Floating Date Pill */}
                <div className="flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#C5A880] shadow-sm items-center justify-center z-20 mb-6 md:mb-0 order-1 md:order-none">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Oct 09, 2018</span>
                </div>

                <div className="w-full md:w-1/2 md:pl-16 flex justify-center md:justify-start order-2 md:order-2 z-10">
                  <img src={COUPLE_PHOTOS.story3} alt="Our Story Starts" className="w-4/5 max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                </div>

                <div className="w-full md:w-1/2 md:pr-16 flex flex-col items-center md:items-end text-center md:text-right order-3 md:order-1 mt-6 md:mt-0 px-4 md:px-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">Our Story Starts</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm mx-auto md:mr-0 md:ml-auto">
                      Somewhere along the way, there was us.
                    </p>
                  </FadeInSection>
                </div>
              </div>

              {/* Story Event 4 (Desktop: Image L, Text R. Mobile: Text B, Image T) */}
              <div className="flex flex-col md:flex-row items-center w-full relative">
                {/* Center Floating Date Pill */}
                <div className="flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#C5A880] shadow-sm items-center justify-center z-20 mb-6 md:mb-0 order-1 md:order-none">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">May 10, 2025</span>
                </div>

                <div className="w-full md:w-1/2 md:pr-16 flex justify-center md:justify-end order-2 md:order-1 z-10">
                  <img src={COUPLE_PHOTOS.story4} alt="Surprise Proposal" className="w-4/5 max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                </div>

                <div className="w-full md:w-1/2 md:pl-16 flex flex-col items-center md:items-start text-center md:text-left order-3 md:order-2 mt-6 md:mt-0 px-4 md:px-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">Surprise Proposal</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm mx-auto md:ml-0 md:mr-auto">
                      A sunset proposal over Sydney harbour, and of course the answer was YES!
                    </p>
                  </FadeInSection>
                </div>
              </div>

              {/* Story Event 5 (Desktop: Text L, Image R. Mobile: Text B, Image T) */}
              <div className="flex flex-col md:flex-row items-center w-full relative">
                {/* Center Floating Date Pill */}
                <div className="flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-[#C5A880] shadow-sm items-center justify-center z-20 mb-6 md:mb-0 order-1 md:order-none">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A880] font-bold">Mar 06, 2027</span>
                </div>

                <div className="w-full md:w-1/2 md:pr-16 flex flex-col items-center md:items-end text-center md:text-right order-3 md:order-1 mt-6 md:mt-0 px-4 md:px-0">
                  <FadeInSection>
                    <h4 className="font-serif text-2xl font-light text-[#4A433A] mb-3">Our Next Chapter</h4>
                    <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-sm mx-auto md:mr-0 md:ml-auto">
                      From where it all began to forever - we can’t wait to celebrate our special day with you.
                    </p>
                  </FadeInSection>
                </div>

                <div className="w-full md:w-1/2 md:pl-16 flex justify-center md:justify-start order-2 md:order-2 z-10">
                  <img src={COUPLE_PHOTOS.story5} alt="Our Next Chapter" className="w-4/5 max-w-[280px] aspect-[4/5] object-cover rounded-sm shadow-md border border-[#EADCC9]/40 p-1.5 bg-white" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
	);
}