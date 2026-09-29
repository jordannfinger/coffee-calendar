"use client";

import { useEffect, useRef } from "react";

export function LandingFilm() {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void video.current?.play().catch(() => {
        // The poster and native play control remain available when autoplay is blocked.
      });
    }
  }, []);

  return (
    <div>
      <video
        ref={video}
        className="aspect-video w-full bg-[#172b21]"
        src="/film/coffee-calendar.mp4"
        poster="/film/coffee-calendar-poster.jpg"
        preload="metadata"
        muted
        playsInline
        controls
        aria-describedby="film-description"
      />
      <p id="film-description" className="sr-only">
        A 20-second film of filter coffee blooming, pouring, and filling a cup.
        On-screen text: The cup starts before the pour. Every roast has its
        moment. Catch yours. Know what&apos;s ready. Brew at its best. Coffee
        Calendar. Filter coffee, in its time. There is music and no narration.
      </p>
    </div>
  );
}
