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
    let targetMouseX = mouseX
    let targetMouseY = mouseY

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX
      targetMouseY = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Nodes for technical geometric grid
    const cols = 28
    const rows = 18
    let tick = 0

    const render = () => {
      tick += 0.015
      mouseX += (targetMouseX - mouseX) * 0.08
      mouseY += (targetMouseY - mouseY) * 0.08

      ctx.clearRect(0, 0, width, height)

      // Stark Obsidian Base
      ctx.fillStyle = '#060709'
      ctx.fillRect(0, 0, width, height)

      // Interactive Specular Spotlight (Cyan highlight tracking mouse)
      const spotGrad = ctx.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        450
      )
      spotGrad.addColorStop(0, 'rgba(56, 189, 248, 0.07)')
      spotGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.015)')
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = spotGrad
      ctx.fillRect(0, 0, width, height)

      // Micro grid crosshairs
      const stepX = width / cols
      const stepY = height / rows

      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      for (let i = 1; i < cols; i++) {
        for (let j = 1; j < rows; j++) {
          const x = i * stepX
          const y = j * stepY

          const dx = x - mouseX
          const dy = y - mouseY
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 260) {
            const factor = 1 - dist / 260
            ctx.fillStyle = `rgba(56, 189, 248, ${0.08 + factor * 0.2})`
            ctx.fillRect(x - 1, y - 1, 2, 2)
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.025)'
            ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5)
          }
        }
      }

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
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      <div className="fixed inset-0 pointer-events-none z-0 film-grain" />
    </>
  )
}
