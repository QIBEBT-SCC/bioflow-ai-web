'use client'

import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  pulsePhase: number
}

const NODE_COUNT = 55
const MAX_DIST = 160
const NODE_SPEED = 0.25

function initNodes(w: number, h: number): Node[] {
  return Array.from({ length: NODE_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * NODE_SPEED,
    vy: (Math.random() - 0.5) * NODE_SPEED,
    radius: Math.random() < 0.15 ? 4 : 2.5,
    pulsePhase: Math.random() * Math.PI * 2,
  }))
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let nodes: Node[] = []

    const isDark = () =>
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      nodes = initNodes(canvas.width, canvas.height)
    }

    const draw = (t: number) => {
      const w = canvas.width
      const h = canvas.height
      const dark = isDark()

      ctx.clearRect(0, 0, w, h)

      const nodeColor = dark ? '120, 180, 255' : '59, 120, 220'
      const lineColor = dark ? '100, 160, 255' : '80, 140, 230'

      // update positions
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }

      // draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.35
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      // draw nodes
      for (const n of nodes) {
        const pulse = Math.sin(t * 0.001 + n.pulsePhase) * 0.5 + 0.5
        const baseAlpha = n.radius > 3 ? 0.7 : 0.45
        const alpha = baseAlpha + pulse * 0.2

        // glow for larger nodes
        if (n.radius > 3) {
          const glow = ctx.createRadialGradient(
            n.x,
            n.y,
            0,
            n.x,
            n.y,
            n.radius * 3.5,
          )
          glow.addColorStop(0, `rgba(${nodeColor}, ${alpha * 0.4})`)
          glow.addColorStop(1, `rgba(${nodeColor}, 0)`)
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.radius * 3.5, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${nodeColor}, ${alpha})`
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    animId = requestAnimationFrame(draw)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className='absolute inset-0 size-full pointer-events-none'
      aria-hidden
    />
  )
}
