"use client";
import { useState, useEffect, useRef } from 'react';

export default function FadeInSection({ children, className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const handleCheck = () => {
      if (!domRef.current) return;
      const rect = domRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      
      // Trigger reveal when 5% of the element is inside the viewport
      const isPartiallyInViewport = rect.top < viewportHeight * 0.95;
      if (isPartiallyInViewport) {
        setIsVisible(true);
        window.removeEventListener('scroll', handleCheck);
      }
    };

    handleCheck(); // Immediate check on mount for items above the fold

    window.addEventListener('scroll', handleCheck, { passive: true });
    window.addEventListener('resize', handleCheck, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleCheck);
      window.removeEventListener('resize', handleCheck);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}
