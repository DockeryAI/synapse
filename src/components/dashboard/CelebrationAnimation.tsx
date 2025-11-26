/**
 * Celebration Animation Component
 * Framer Motion celebration for high-scoring content
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Sparkles, Star, Award, Trophy } from 'lucide-react';

export interface CelebrationAnimationProps {
  trigger: boolean;
  score: number;
  onComplete?: () => void;
  enableSound?: boolean;
  duration?: number; // Duration in milliseconds
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  Icon: typeof Sparkles;
  color: string;
}

// Confetti colors
const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

export function CelebrationAnimation({
  trigger,
  score,
  onComplete,
  enableSound = false,
  duration = 3000,
}: CelebrationAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Determine intensity based on score
  const getIntensity = () => {
    if (score >= 90) return { count: 40, label: 'OUTSTANDING!', Icon: Trophy };
    if (score >= 85) return { count: 25, label: 'EXCELLENT!', Icon: Award };
    return { count: 15, label: 'GREAT WORK!', Icon: Star };
  };

  const intensity = getIntensity();

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    if (trigger && !prefersReducedMotion) {
      setIsVisible(true);

      // Generate particles
      const newParticles: Particle[] = Array.from({ length: intensity.count }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -50,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 0.5,
        Icon: [Sparkles, Star][Math.floor(Math.random() * 2)],
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      setParticles(newParticles);

      // Play sound effect if enabled
      if (enableSound) {
        playSuccessSound();
      }

      // Auto-dismiss
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, score, enableSound, duration, onComplete, prefersReducedMotion, intensity.count]);

  // Simple success sound using Web Audio API
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play success sound:', error);
    }
  };

  if (!isVisible || prefersReducedMotion) {
    return null;
  }

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {/* Center Message */}
        <motion.div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-6 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <intensity.Icon className="w-12 h-12" />
              <div>
                <p className="text-3xl font-bold">{intensity.label}</p>
                <p className="text-lg opacity-90">Score: {score}/100</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Confetti Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute pointer-events-none"
            initial={{
              x: particle.x,
              y: particle.y,
              rotate: particle.rotation,
              scale: particle.scale,
              opacity: 1,
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: particle.rotation + 720,
              opacity: 0,
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: particle.delay,
              ease: 'easeIn',
            }}
          >
            <particle.Icon
              className="w-6 h-6"
              style={{ color: particle.color }}
              fill={particle.color}
            />
          </motion.div>
        ))}

        {/* Radial Pulse */}
        <motion.div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-xl" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Use portal to render at document body level
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

export default CelebrationAnimation;
