import { driver, DriveStep, Config, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { logger } from "./logger";

export interface TourConfig {
  storageKey: string;
  steps: DriveStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

const DEFAULT_DRIVER_CONFIG: Partial<Config> = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  progressText: '{{current}} of {{total}}',
  nextBtnText: 'Next →',
  prevBtnText: '← Previous',
  doneBtnText: 'Got it! ✓',
  animate: false,
  allowClose: true,
  disableActiveInteraction: false,
  overlayOpacity: 0.4,
  smoothScroll: true,
};

/**
 * BRUTE FORCE CLEANUP
 */
function bruteForceCleanup(): void {
  logger.info('💥 BRUTE FORCE CLEANUP');
  
  // Remove EVERYTHING with driver in the class name
  document.querySelectorAll('[class*="driver"]').forEach(el => {
    el.remove();
  });

  // Clean body
  document.body.className = document.body.className.replace(/driver-\S+/g, '').trim();
  document.body.style.overflow = '';
  
  logger.info('✅ Brute force cleanup done');
}

class Tour {
  private driverInstance: Driver | null = null;
  private config: TourConfig;
  private clickListener: ((e: Event) => void) | null = null;
  private escListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(config: TourConfig) {
    this.config = config;
  }

  hasCompleted(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(this.config.storageKey) === 'true';
  }

  private markCompleted(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.config.storageKey, 'true');
  }

  reset(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.config.storageKey);
  }

  private destroyNow(): void {
    logger.info('🔥 DESTROY NOW');
    
    // Remove listeners
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener, true);
      this.clickListener = null;
    }
    if (this.escListener) {
      document.removeEventListener('keydown', this.escListener, true);
      this.escListener = null;
    }

    // Destroy driver
    if (this.driverInstance) {
      try {
        this.driverInstance.destroy();
      } catch (e) {
        logger.error('Error destroying:', e);
      }
      this.driverInstance = null;
    }

    // BRUTE FORCE CLEANUP
    bruteForceCleanup();
    
    // Cleanup again after delays
    setTimeout(bruteForceCleanup, 50);
    setTimeout(bruteForceCleanup, 200);
  }

  start(force: boolean = false): void {
    logger.info('🚀 Starting tour');
    
    if (!force && this.hasCompleted()) {
      return;
    }

    this.destroyNow();

    setTimeout(() => {
      this.initializeTour();
    }, 300);
  }

  private initializeTour(): void {
    logger.info('🎬 Init tour');

    try {
      // Filter out steps whose element isn't in the DOM yet
      const activeSteps = this.config.steps.filter((step) => {
        if (!step.element) return true;
        return Boolean(document.querySelector(step.element as string));
      });

      if (activeSteps.length === 0) {
        logger.info('No visible steps — skipping tour');
        return;
      }

      this.driverInstance = driver({
        ...DEFAULT_DRIVER_CONFIG,
        steps: activeSteps,
      });

      this.driverInstance.drive();
      
      // INTERCEPT ALL CLICKS ON POPOVER
      this.interceptAllClicks();
      
      // INTERCEPT ESC KEY
      this.interceptEscKey();

    } catch (error) {
      logger.error('Error:', error);
      this.destroyNow();
    }
  }

  /**
   * ULTRA AGGRESSIVE: Intercept ALL clicks anywhere on the page
   */
  private interceptAllClicks(): void {
    logger.info('🎯 Intercepting ALL clicks');
    
    this.clickListener = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Check if click is inside popover
      const popover = document.querySelector('.driver-popover');
      if (!popover) return;

      // Check if clicked element is inside popover
      if (!popover.contains(target)) return;

      // Check if it's a button
      const button = target.closest('button');
      if (!button) return;

      logger.info('🖱️ BUTTON CLICKED:', button.textContent?.trim());

      // Get button text to determine action
      const buttonText = button.textContent?.trim().toLowerCase() || '';
      
      // Stop the event immediately
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Determine current step
      const currentStep = this.driverInstance?.getActiveIndex() ?? 0;
      const totalSteps = this.config.steps.length;
      const isLastStep = currentStep >= totalSteps - 1;

      // Check button type and handle
      if (buttonText.includes('got it') || buttonText.includes('done')) {
        logger.info('✅ Completion button detected');
        this.handleCompletion();
        this.destroyNow();
      } else if (buttonText.includes('next') && isLastStep) {
        logger.info('✅ Next on last step - completing');
        this.handleCompletion();
        this.destroyNow();
      } else if (buttonText.includes('next')) {
        logger.info('➡️ Next - navigating');
        // Navigate to next step
        if (this.driverInstance) {
          this.driverInstance.moveNext();
        }
      } else if (buttonText.includes('previous')) {
        logger.info('⬅️ Previous - navigating');
        // Navigate to previous step
        if (this.driverInstance) {
          this.driverInstance.movePrevious();
        }
      } else {
        // Any other button (like close X)
        logger.info('❌ Close button detected');
        if (isLastStep) {
          this.handleCompletion();
        } else {
          this.handleSkip();
        }
        this.destroyNow();
      }

      return false;
    };

    // Add listener at capture phase to intercept BEFORE driver.js
    document.addEventListener('click', this.clickListener, true);
  }

  /**
   * Intercept ESC key
   */
  private interceptEscKey(): void {
    this.escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        logger.info('⌨️ ESC pressed - destroying tour');
        e.preventDefault();
        e.stopPropagation();
        
        const currentStep = this.driverInstance?.getActiveIndex() ?? 0;
        const totalSteps = this.config.steps.length;
        
        if (currentStep >= totalSteps - 1) {
          this.handleCompletion();
        } else {
          this.handleSkip();
        }
        
        this.destroyNow();
      }
    };

    document.addEventListener('keydown', this.escListener, true);
  }

  private handleCompletion(): void {
    logger.info('🎉 COMPLETED');
    this.markCompleted();
    if (this.config.onComplete) {
      this.config.onComplete();
    }
  }

  private handleSkip(): void {
    logger.info('⏭️ SKIPPED');
    if (this.config.onSkip) {
      this.config.onSkip();
    }
  }

  forceDestroy(): void {
    logger.info('💥 FORCE DESTROY');
    this.destroyNow();
  }

  next(): void {
    this.driverInstance?.moveNext();
  }

  previous(): void {
    this.driverInstance?.movePrevious();
  }

  goTo(index: number): void {
    this.driverInstance?.moveTo(index);
  }

  getCurrentStep(): number | undefined {
    return this.driverInstance?.getActiveIndex();
  }
}

export function createTour(config: TourConfig): Tour {
  return new Tour(config);
}

export function emergencyDestroy(): void {
  logger.info('🚨 EMERGENCY');
  bruteForceCleanup();
}



export { Tour };