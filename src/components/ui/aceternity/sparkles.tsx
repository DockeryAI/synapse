// PRD Feature: SYNAPSE-V6
"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface Sparkle {
  id: string
  createdAt: number
  color: string
  size: number
  style: {
    top: string
    left: string
  }
}

const DEFAULT_COLOR = "#FFC700"

const generateSparkle = (color: string): Sparkle => {
  return {
    id: String(Math.random()),
    createdAt: Date.now(),
    color,
    size: Math.random() * 10 + 4,
    style: {
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
    },
  }
}

interface SparklesProps {
  children: React.ReactNode
  className?: string
  color?: string
}

export const Sparkles = ({
  children,
  className,
  color = DEFAULT_COLOR,
}: SparklesProps) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  useEffect(() => {
    const sparkleInterval = setInterval(() => {
      const now = Date.now()
      const sparkle = generateSparkle(color)
      const nextSparkles = [...sparkles, sparkle].filter((s) => {
        const delta = now - s.createdAt
        return delta < 750
      })
      setSparkles(nextSparkles)
    }, 250)

    return () => clearInterval(sparkleInterval)
  }, [sparkles, color])

  return (
    <span className={cn("relative inline-block", className)}>
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <SparkleInstance key={sparkle.id} {...sparkle} />
        ))}
      </AnimatePresence>
      <strong className="relative z-10 font-bold">{children}</strong>
    </span>
  )
}

const SparkleInstance = ({ color, size, style }: Sparkle) => {
  return (
    <motion.span
      className="pointer-events-none absolute z-20 block"
      style={style}
      initial={{ scale: 0, rotate: 0 }}
      animate={{ scale: 1, rotate: 75 }}
      exit={{ scale: 0, rotate: 150 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
          fill={color}
        />
      </svg>
    </motion.span>
  )
}
