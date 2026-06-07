import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class HighlightEffect {
  highlightedElement: HTMLElement;
  highlightedChars: NodeListOf<Element>;
  animationDefaults: { duration: number; ease: string };
  delay: number;

  constructor(el: HTMLElement, delay: number = 0) {
    if (!el || !(el instanceof HTMLElement)) return;
    
    this.highlightedElement = el;
    this.highlightedChars = this.highlightedElement.querySelectorAll('.char');
    this.delay = delay;
    
    this.animationDefaults = {
      duration: 1.2,
      ease: 'sine.out'
    };
    this.initializeEffect();
  }
  
  initializeEffect() {
    gsap.set(this.highlightedChars, { opacity: 0 });
    this.scroll();
  }

  scroll() {
    ScrollTrigger.create({
      trigger: this.highlightedElement,
      start: 'top bottom',
      once: true,
      onEnter: () => this.animateChars()
    });
  }

  animateChars() {
    gsap.to(this.highlightedChars, {
      ...this.animationDefaults,
      delay: this.delay,
      stagger: 0.04,
      opacity: 1,
    });
  }

  resetChars() {
    gsap.killTweensOf(this.highlightedChars);
    gsap.set(this.highlightedChars, { opacity: 1 });
  }

  destroy() {
    ScrollTrigger.getAll().forEach(t => {
      if (t.trigger === this.highlightedElement) t.kill();
    });
    gsap.killTweensOf(this.highlightedChars);
  }
}