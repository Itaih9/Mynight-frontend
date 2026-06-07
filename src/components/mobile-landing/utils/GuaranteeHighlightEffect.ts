import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class GuaranteeHighlightEffect {
  highlightedElement: HTMLElement;
  highlightedChars: NodeListOf<Element>;
  highlightedWords: NodeListOf<Element>;
  iconElement: Element | null; // Added to track icon
  rainbow: boolean;
  animationDefaults: any;
  timerId: any = null;
  private tl: gsap.core.Timeline | null = null;

  constructor(el: HTMLElement, config: any = {}) {
    if (!el || !(el instanceof HTMLElement)) {
      throw new Error('Invalid element provided.');
    }
    this.highlightedElement = el;
    this.highlightedChars = this.highlightedElement.querySelectorAll('.char');
    this.highlightedWords = this.highlightedElement.querySelectorAll('.word');
    // Look for an icon (SVG or icon class) inside the container
    this.iconElement = this.highlightedElement.querySelector('svg, [class*="icon"]');
    
    this.rainbow = config.rainbow || false;
    this.animationDefaults = {
      duration: 0.3,
      ease: 'power3.in',
    };
    this.initializeEffect();
  }
  
  initializeEffect() {
    // Apply static offsets immediately
    gsap.set(this.highlightedChars, { y: 1 }); // Text 1 pixel lower
    if (this.iconElement) {
      gsap.set(this.iconElement, { y: 3 }); // Icon 3 pixels lower
    }
    this.scroll();
  }

  scroll() {
    ScrollTrigger.create({
      trigger: this.highlightedElement,
      start: 'top bottom',
      onEnter: () => this.startRepeatingAnimation(),
      onEnterBack: () => this.startRepeatingAnimation(),
      onLeave: () => this.stopRepeatingAnimation(),
      onLeaveBack: () => this.stopRepeatingAnimation()
    });
  }

  startRepeatingAnimation() {
    if (this.timerId) return;
    this.animateChars();
    this.scheduleNextAnimation();
  }

  scheduleNextAnimation() {
    if (this.timerId) clearTimeout(this.timerId);

    // Random interval: 4000ms, 5000ms, or 6000ms
    const nextInterval = (Math.floor(Math.random() * 3) + 4) * 1000;
    
    this.timerId = setTimeout(() => {
      this.animateChars();
      this.scheduleNextAnimation();
    }, nextInterval);
  }

  stopRepeatingAnimation() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.resetChars();
  }

  animateChars() {
    if (this.tl) this.tl.kill();
    gsap.killTweensOf(this.highlightedChars);

    const style = getComputedStyle(this.highlightedElement);
    const baseColor = style.color;
    const highlightEnd = style.getPropertyValue('--color-highlight-end');
    const highlightEndAlt = style.getPropertyValue('--color-highlight-end-alt');

    this.tl = gsap.timeline({ defaults: this.animationDefaults });
    
    this.tl
      .set(this.highlightedChars, { willChange: 'transform, opacity, color' })
      .to(this.highlightedChars, {
        stagger: 0.05,
        scale: 1.45,
        y: 1, // Keep text 1px lower during pop
        color: this.rainbow 
          ? (i: number) => `hsl(${(i * 360 / this.highlightedChars.length)}, 100%, 50%)` 
          : highlightEnd,
      })
      .to(this.highlightedChars, { 
        duration: 0.4,
        ease: 'sine', 
        stagger: 0.05,
        scale: 1,
        y: 1, // Ensure text settles back at 1px lower
        color: this.rainbow ? baseColor : highlightEndAlt,
        onComplete: () => {
          if (this.rainbow) {
            gsap.set(this.highlightedChars, { color: '' });
          }
        }
      }, this.animationDefaults.duration);
  }
  
  resetChars() {
    if (this.tl) this.tl.kill();
    gsap.killTweensOf(this.highlightedChars);
    // Reset to the requested lower positions
    gsap.set(this.highlightedChars, {
      scale: 1,
      y: 1, 
      color: '',
    });
    if (this.iconElement) {
        gsap.set(this.iconElement, { y: 3 });
    }
  }

  destroy() {
    this.stopRepeatingAnimation();
    ScrollTrigger.getAll().forEach(t => {
      if (t.trigger === this.highlightedElement) {
        t.kill();
      }
    });
  }
}