/* ============================================================
   stxrm808 — VIDEO SCROLL SCRUB
   Desktop: GSAP ScrollTrigger scrubs video.currentTime
   Mobile/iOS: autoplay fallback (iOS blocks currentTime seeking)
   Video file: assets/explosion.mp4
   ============================================================ */

'use strict';

(function initVideoScrub() {
  const section = document.getElementById('videoScrub');
  const video   = document.getElementById('scrubVideo');
  const bar     = document.getElementById('scrubProgress');
  if (!section || !video) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  video.addEventListener('error', () => {
    section.classList.add('video-scrub--hidden');
  });

  // iOS / Android: currentTime seeking is blocked until user interaction.
  // Fall back to autoplay so the video still plays on mobile.
  const isMobile = window.innerWidth < 768 ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    video.setAttribute('autoplay', '');
    video.play().catch(() => {});
    // Headline stays visible, then CSS transition fades it out after video ends
    const headline = document.getElementById('scrubHeadline');
    if (headline) {
      headline.classList.add('is-mobile-visible');
    }
    return;
  }

  video.pause();
  video.currentTime = 0;

  function setup() {
    const duration = video.duration;
    if (!duration || isNaN(duration)) return;

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      video.play();
      return;
    }

    const headline = document.getElementById('scrubHeadline');
    const counter  = document.getElementById('scrubCounter');
    const pctEl    = document.getElementById('scrubPct');

    let lastSet = -1;
    const FRAME = 1 / 30;

    ScrollTrigger.create({
      trigger: section,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   2,
      onUpdate(self) {
        const p = self.progress;
        const t = p * duration;

        // Seek video
        if (Math.abs(t - lastSet) >= FRAME) {
          video.currentTime = t;
          lastSet = t;
        }

        // Progress bar
        if (bar) {
          bar.style.width = `${p * 100}%`;
          bar.classList.toggle('is-hot', p > 0.6);
        }

        // Headline: vollsichtbar bis 0.55, dann nach oben raus bis 0.80
        if (headline) {
          let hlOpacity, hlY;
          if (p < 0.55) {
            hlOpacity = 1;
            hlY = 0;
          } else if (p > 0.80) {
            hlOpacity = 0;
            hlY = -140;
          } else {
            const t = (p - 0.55) / 0.25;
            hlOpacity = 1 - t;
            hlY = Math.round(t * -140);
          }
          headline.style.opacity  = hlOpacity;
          headline.style.transform = `translateY(${hlY}px)`;
        }

        // Counter: erscheint ab 0.15, verschwindet ab 0.85
        if (counter && pctEl) {
          let cOpacity;
          if (p < 0.10)      cOpacity = 0;
          else if (p < 0.20) cOpacity = (p - 0.10) / 0.10;
          else if (p < 0.82) cOpacity = 1;
          else if (p > 0.95) cOpacity = 0;
          else               cOpacity = 1 - (p - 0.82) / 0.13;
          counter.style.opacity = cOpacity;
          pctEl.textContent = Math.round(p * 100);
        }
      },
    });
  }

  if (video.readyState >= 1) {
    setup();
  } else {
    video.addEventListener('loadedmetadata', setup, { once: true });
  }

})();
