// PRD Feature: SYNAPSE-V6
"use client"

import React, { useRef, useState, useCallback } from "react"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

interface SpotlightProps {
  children: React.ReactNode
  className?: string
  spotlightClassName?: string
}

export function Spotlight({
  children,
  className,
  spotlightClassName,
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return
      const { left, top } = containerRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - left)
      mouseY.set(e.clientY - top)
    },
    [mouseX, mouseY]
  )

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn("relative overflow-hidden", className)}
    >
      <motion.div
        className={cn(
          "pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300",
          isHovering && "opacity-100",
          spotlightClassName
        )}
        style={{
          background: useMotionTemplate`
            radial-gradient(
              350px circle at ${mouseX}px ${mouseY}px,
              rgba(14, 165, 233, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  )
}

// Spotlight Card variant
export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Spotlight
      className={cn(
        "group rounded-xl border border-white/10 bg-gray-900/50 p-8 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </Spotlight>
  )
}
