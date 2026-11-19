/**
 * Parallax Scroll System
 * 
 * Multi-layer depth illusion dengan smooth RAF-based scrolling
 * 
 * Features:
 * - Different scroll speeds per layer (0.5x slow, 1.2x fast)
 * - RAF throttle for 60fps performance
 * - Mobile disabled (performance)
 * - Reduced motion support
 * 
 * Usage:
 * Add data-parallax attribute to elements:
 * <div data-parallax="0.5">Slow layer</div>
 * <div data-parallax="1.2">Fast layer</div>
 */

interface ParallaxElement {
  element: HTMLElement;
  speed: number;
  initialY: number;
  maxTravel: number;
}

class ParallaxScroll {
  private layers: ParallaxElement[] = [];
  private ticking: boolean = false;
  private scrollY: number = 0;
  private prefersReducedMotion: boolean = false;
  private isMobile: boolean = false;

  constructor() {
    this.checkReducedMotion();
    this.checkMobile();
    
    if (this.prefersReducedMotion || this.isMobile) {
      return; // Skip parallax on mobile or reduced motion
    }

    this.initLayers();
    this.setupEventListeners();
    this.update(); // Initial position
  }

  private checkReducedMotion() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private checkMobile() {
    this.isMobile = window.matchMedia('(max-width: 900px)').matches;
  }

  private initLayers() {
    // Auto-detect elements with data-parallax attribute
    const elements = document.querySelectorAll<HTMLElement>('[data-parallax]');
    
    elements.forEach(element => {
      const speed = parseFloat(element.dataset.parallax || '1');
      const maxRaw = element.dataset.parallaxMax;
      const rect = element.getBoundingClientRect();
      
      this.layers.push({
        element,
        speed,
        initialY: rect.top + window.scrollY,
        maxTravel: maxRaw ? parseFloat(maxRaw) : Infinity,
      });

      // Prepare element for GPU acceleration
      element.style.willChange = 'transform';
    });

    // Add predefined layers if they exist
    this.addPredefinedLayers();
  }

  private addPredefinedLayers() {
    // Hero grid - slow movement for depth
    const heroGrid = document.querySelector('.hero__grid') as HTMLElement;
    if (heroGrid && !heroGrid.dataset.parallax) {
      heroGrid.dataset.parallax = '0.5';
      this.layers.push({
        element: heroGrid,
        speed: 0.5,
        initialY: 0,
        maxTravel: Infinity,
      });
      heroGrid.style.willChange = 'transform';
    }

    // Hero glow - faster movement for float effect
    const heroGlow = document.querySelector('.hero__glow') as HTMLElement;
    if (heroGlow && !heroGlow.dataset.parallax) {
      heroGlow.dataset.parallax = '1.2';
      this.layers.push({
        element: heroGlow,
        speed: 1.2,
        initialY: 0,
        maxTravel: Infinity,
      });
      heroGlow.style.willChange = 'transform';
    }

    // About photo - subtle lag, clamped so it can never drift over the
    // stats row below it
    const aboutPhoto = document.querySelector('.about__photo') as HTMLElement | null;
    if (aboutPhoto && !aboutPhoto.dataset.parallax) {
      aboutPhoto.dataset.parallax = '0.8';
      aboutPhoto.dataset.parallaxMax = '24';
      this.layers.push({
        element: aboutPhoto,
        speed: 0.8,
        initialY: aboutPhoto.offsetTop,
        maxTravel: 24,
      });
      aboutPhoto.style.willChange = 'transform';
    }

    // Gallery header - fade and move, clamped so it stays at the section top
    const galleryHeader = document.querySelector('.gallery3d__header') as HTMLElement;
    if (galleryHeader && !galleryHeader.dataset.parallax) {
      galleryHeader.dataset.parallax = '0.6';
      galleryHeader.dataset.parallaxMax = '24';
      this.layers.push({
        element: galleryHeader,
        speed: 0.6,
        initialY: galleryHeader.offsetTop,
        maxTravel: 24,
      });
      galleryHeader.style.willChange = 'transform';
    }
  }

  private handleScroll = () => this.onScroll();
  private handleResize = () => this.onResize();

  private setupEventListeners() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleResize);
  }

  private onScroll() {
    this.scrollY = window.scrollY;

    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private onResize() {
    // Re-check mobile state
    this.checkMobile();
    
    if (this.isMobile) {
      this.disable();
    } else {
      // Recalculate initial positions
      this.layers.forEach(layer => {
        const rect = layer.element.getBoundingClientRect();
        layer.initialY = rect.top + window.scrollY;
      });
    }
  }

  private update() {
    this.layers.forEach(layer => {
      // Calculate offset based on scroll and speed
      // speed < 1: slower than scroll (background)
      // speed > 1: faster than scroll (foreground)
      // maxTravel clamps far-from-top layers so they can't drift over
      // neighbouring content
      const raw = this.scrollY * (1 - layer.speed);
      const offset = Math.max(-layer.maxTravel, Math.min(layer.maxTravel, raw));
      
      // Apply transform
      layer.element.style.transform = `translateY(${offset}px)`;
      
      // Optional: Add opacity fade for elements far from viewport
      const rect = layer.element.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);
      const maxDistance = window.innerHeight;
      
      // Fade out when far from center (optional, subtle)
      if (layer.speed < 1) { // Only for background layers
        const opacity = Math.max(0.3, 1 - (distance / maxDistance) * 0.7);
        layer.element.style.opacity = String(opacity);
      }
    });
  }

  private disable() {
    this.layers.forEach(layer => {
      layer.element.style.transform = '';
      layer.element.style.opacity = '';
      layer.element.style.willChange = '';
    });
    this.layers = [];
  }

  public destroy() {
    this.disable();
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
  }
}

// Initialize
let parallaxScroll: ParallaxScroll;

export function initParallax() {
  // Clean up existing instance
  if (parallaxScroll) {
    parallaxScroll.destroy();
  }

  // Create new instance
  parallaxScroll = new ParallaxScroll();
}

// Auto-init on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParallax);
  } else {
    initParallax();
  }

  // Re-init on Astro page navigation
  document.addEventListener('astro:page-load', initParallax);
  
  // Cleanup before navigation
  document.addEventListener('astro:before-swap', () => {
    if (parallaxScroll) {
      parallaxScroll.destroy();
    }
  });
}
