/**
 * Celebration Utilities
 *
 * Confetti animations for key onboarding moments
 * Uses canvas-confetti for celebration effects
 *
 * Created: 2025-11-18
 */

import confetti from 'canvas-confetti';

/**
 * Trigger confetti celebration
 * Default: center burst
 */
export function celebrate() {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: NodeJS.Timeout = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Burst from center
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * Side cannons confetti
 * Shoots from both sides
 */
export function celebrateSideCannons() {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#a855f7', '#3b82f6', '#ec4899'], // purple, blue, pink
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#a855f7', '#3b82f6', '#ec4899'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Realistic confetti fall
 * More subtle, professional effect
 */
export function celebrateRealisticFall() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Fireworks effect
 * For major achievements
 */
export function celebrateFireworks() {
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: NodeJS.Timeout = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Random positions across the screen
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#a855f7', '#3b82f6'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#ec4899', '#f59e0b'],
    });
  }, 250);
}

/**
 * Quick burst
 * Subtle celebration for small wins
 */
export function celebrateQuick() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#a855f7', '#3b82f6', '#ec4899'],
    zIndex: 9999,
  });
}

/**
 * School pride style
 * Continuous confetti fall from top
 */
export function celebrateSchoolPride() {
  const end = Date.now() + 3000;

  const colors = ['#a855f7', '#3b82f6'];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Star burst
 * Single powerful burst
 */
export function celebrateStarBurst() {
  const defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    shapes: ['star'] as confetti.Shape[],
    colors: ['#a855f7', '#3b82f6', '#ec4899', '#f59e0b'],
    zIndex: 9999,
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star'],
    });

    confetti({
      ...defaults,
      particleCount: 10,
      scalar: 0.75,
      shapes: ['circle'],
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

/**
 * Celebration presets for specific moments
 */
export const celebrations = {
  // First value prop validated
  firstValueProp: celebrateQuick,

  // All value props reviewed
  allValueProps: celebrateRealisticFall,

  // Core truth revealed
  coreTruthRevealed: celebrateFireworks,

  // Buyer intelligence completed
  buyerIntelligence: celebrateSideCannons,

  // Campaign generated
  campaignGenerated: celebrateStarBurst,

  // Onboarding complete
  onboardingComplete: celebrateSchoolPride,
};

// Export default celebrate function
export default celebrate;
