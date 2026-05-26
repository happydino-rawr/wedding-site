"use client";
import { useState, useEffect, useRef } from 'react';

export default function FadeInSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting && setIsVisible(true));
    }, { threshold: 0.1 });

    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);

  return (
    <div ref={domRef} className={`transition-all duration-1000 ease-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}