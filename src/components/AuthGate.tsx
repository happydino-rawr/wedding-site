import React from 'react';
import { Lock } from 'lucide-react';

interface AuthGateProps {
  passcode: string;
  authError: string;
  onPasscodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  backgroundImage: string;
}

export function AuthGate({
  passcode,
  authError,
  onPasscodeChange,
  onSubmit,
  title,
  backgroundImage,
}: AuthGateProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 font-sans overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})`, filter: 'blur(12px) brightness(0.5)' }}
      />

      <div className="relative z-10 w-full max-w-sm bg-[#FDFBF7] rounded-sm p-10 sm:p-14 shadow-2xl text-center flex flex-col items-center">
        <div className="absolute inset-2.5 border border-[#EADCC9]/80 pointer-events-none" />
        <div className="absolute inset-[14px] border border-[#EADCC9]/40 pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border border-[#C5A880] flex items-center justify-center mb-8">
            <Lock className="w-4 h-4 text-[#C5A880] stroke-[1.5px]" />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl text-[#4A433A] tracking-widest font-light mb-2">
            {title}
          </h1>
          <p className="text-[#9C8F7E] text-[12px] sm:text-[14px] uppercase tracking-[0.4em] mb-10 font-semibold">
            The Wedding Celebration
          </p>

          <form onSubmit={onSubmit} className="w-full space-y-8">
            <div className="space-y-2">
              <span className="text-[12px] uppercase tracking-[0.3em] text-[#C5A880] block font-bold">Private Access Key</span>
              <input
                type="password"
                placeholder="Enter Passcode"
                value={passcode}
                onChange={(e) => onPasscodeChange(e.target.value)}
                className="w-full px-4 py-2 bg-transparent border-b border-[#DCD3BD] text-center font-mono tracking-widest text-[#4A433A] placeholder-[#C5A880]/30 focus:outline-none focus:border-[#C5A880] transition-colors"
              />
            </div>
            {authError && (
              <p className="text-red-500 text-[15px] tracking-widest font-medium uppercase">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-[#C5A880] text-white font-serif tracking-[0.3em] text-[14px] uppercase hover:bg-[#B3966E] transition-all duration-300 shadow-sm"
            >
              Request Entrance
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
