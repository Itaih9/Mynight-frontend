import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class MarkerHighlightEffect {
  highlightedElement: HTMLElement;
  selectMarker: HTMLElement | null;
  highlightedChars: NodeListOf<Element>;
  animationDefaults: { duration: number; ease: string };

  constructor(el: HTMLElement) {
    if (!el || !(el instanceof HTMLElement)) {
      throw new Error('Invalid element provided.');
    }
    this.highlightedElement = el;
    this.selectMarker = this.highlightedElement.querySelector('.hx__select');
    this.highlightedChars = this.highlightedElement.querySelectorAll('.char');
    this.animationDefaults = {
      duration: 0.4,
      ease: 'power2.out',
    };
    this.initializeEffect();
  }
  
  initializeEffect() {
    this.scroll();
  }

  scroll() {
    ScrollTrigger.create({
      trigger: this.highlightedElement,
      start: 'top bottom',
      onEnter: () => this.animateChars(),
      onEnterBack: () => this.animateChars(),
      onLeave: () => this.resetChars(),
      onLeaveBack: () => this.resetChars()
    });
  }

  animateChars() {
    gsap
    .timeline({defaults: this.animationDefaults, delay: 0.6})
    .fromTo(this.highlightedChars, {
      willChange: 'filter',
      filter: 'drop-shadow(0px 0px 0px #e9d5ff)'
    }, { 
      stagger: 0.03,
      filter: 'drop-shadow(0px 0px 20px #e9d5ff)'
    })
    .to(this.selectMarker, {
      duration: 0.64,
      ease: 'power2.out',
      '--select-width': getComputedStyle(this.highlightedElement).getPropertyValue('--select-width-final'),
    }, 0);
  }

  resetChars() {
    gsap.killTweensOf([this.highlightedChars, this.selectMarker]);
    if (this.selectMarker) {
      gsap.set(this.selectMarker, {
        '--select-width': '0%',
      });
    }
    gsap.set(this.highlightedChars, {
      filter: 'drop-shadow(0px 0px 0px #e9d5ff)'
    });
  }
}
