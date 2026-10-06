// Scroll reveal — IntersectionObserver, no dependencies
// Elemen dengan class "reveal" dimulai dari opacity:0 + translateY(24px)
// dan transition ke visible saat masuk viewport.
// prefers-reduced-motion: langsung visible tanpa animasi.

export function initReveal(): void {
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  const els = document.querySelectorAll<HTMLElement>('.reveal');

  if (prefersReduced) {
    // Langsung tampilkan semua tanpa animasi
    els.forEach(el => el.classList.add('reveal--visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('reveal--visible');
        observer.unobserve(entry.target); // sekali reveal, tidak di-unobserve lagi
      });
    },
    { threshold: 0.08 },
  );

  els.forEach(el => observer.observe(el));
}
