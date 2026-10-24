import React, { useEffect, useRef } from 'react'

export const BackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    let mouseX = width / 2
    let mouseY = height / 3

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove)

    let angle = 0

    const render = () => {
      angle += 0.003
      ctx.clearRect(0, 0, width, height)

      // Base atmospheric deep gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#07090e')
      bgGrad.addColorStop(1, '#0c0e17')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Primary interactive subtle glow (Cyan / Sky)
      const grad1 = ctx.createRadialGradient(
        mouseX,
        mouseY,
        10,
        mouseX,
        mouseY,
        Math.max(width, height) * 0.45
      )
      grad1.addColorStop(0, 'rgba(14, 165, 233, 0.08)')
      grad1.addColorStop(0.5, 'rgba(14, 165, 233, 0.02)')
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad1
      ctx.fillRect(0, 0, width, height)

      // Secondary floating ambient orb (Emerald / Amber balance)
      const orbX = width * 0.7 + Math.sin(angle) * 120
      const orbY = height * 0.4 + Math.cos(angle * 0.8) * 90
      const grad2 = ctx.createRadialGradient(orbX, orbY, 20, orbX, orbY, 400)
      grad2.addColorStop(0, 'rgba(16, 185, 129, 0.05)')
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad2
      ctx.fillRect(0, 0, width, height)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ filter: 'blur(20px)' }}
    />
  )
}
