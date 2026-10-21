import { useEffect, useRef, type ReactNode } from 'react'
import { Renderer } from '../game/Renderer.ts'
import { AIM_PICK_TOLERANCE, MAX_DPR } from '../game/constants.ts'
import type { GameEngine } from '../game/GameEngine.ts'

interface BattleScreenProps {
  engine: GameEngine
  /** Id bola yang sedang diatur arahnya. */
  activeBallId: number
  /** Dipanggil ketika pengguna memilih bola lain (klik pada bola/panah). */
  onSelectBall: (ballId: number) => void
  children?: ReactNode
}

/**
 * Area arena. Canvas mengikuti ukuran wrapper (kotak persegi contain-fit)
 * dan digambar ulang setiap frame oleh renderer.
 *
 * Saat fase aim, canvas bisa dipakai untuk mengatur arah luncur:
 * klik bola untuk langsung mengarahkannya, atau tarik panahnya.
 */
export function BattleScreen({
  engine,
  activeBallId,
  onSelectBall,
  children,
}: BattleScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const draggingRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const renderer = new Renderer(canvas)
    rendererRef.current = renderer

    const resize = () => {
      const rect = wrapper.getBoundingClientRect()
      const size = Math.max(1, Math.min(rect.width, rect.height))
      renderer.resize(size, size, Math.min(window.devicePixelRatio || 1, MAX_DPR))
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)
    window.addEventListener('resize', resize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', resize)
      rendererRef.current = null
    }
  }, [])

  // Loop render terpisah dari loop simulasi React.
  useEffect(() => {
    let frame = 0
    const loop = () => {
      rendererRef.current?.render(engine, activeBallId)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [engine, activeBallId])

  /**
   * Mencari bola terdekat dari titik pointer (dalam koordinat arena).
   * Bisa grabbed dari badan bola maupun dari ujung panah arah.
   */
  const pickBall = (clientX: number, clientY: number): number | null => {
    const renderer = rendererRef.current
    if (!renderer) return null

    const point = renderer.toArena(clientX, clientY)
    const tolerance = AIM_PICK_TOLERANCE / Math.max(renderer.arenaScale(), 0.001)
    let bestId: number | null = null
    let bestDistance = Infinity

    for (const ball of engine.balls) {
      const bodyDistance = Math.hypot(ball.x - point.x, ball.y - point.y)
      // Ujung panah arah (dalam unit arena).
      const tipX = ball.x + Math.cos(ball.aimAngle) * ball.radius * 3.9
      const tipY = ball.y + Math.sin(ball.aimAngle) * ball.radius * 3.9
      const tipDistance = Math.hypot(tipX - point.x, tipY - point.y)

      const distance = Math.min(bodyDistance, tipDistance)
      const reach = ball.radius + tolerance
      if (distance < reach && distance < bestDistance) {
        bestDistance = distance
        bestId = ball.id
      }
    }
    return bestId
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (engine.phase !== 'aim') return
    const ballId = pickBall(event.clientX, event.clientY)
    if (ballId === null) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingRef.current = ballId
    onSelectBall(ballId)

    // Klik langsung pada bola = arahkan ke arah klik tersebut.
    const renderer = rendererRef.current
    if (renderer) {
      const point = renderer.toArena(event.clientX, event.clientY)
      const ball = engine.balls.find((b) => b.id === ballId)
      if (ball) {
        const angle = Math.atan2(point.y - ball.y, point.x - ball.x)
        engine.setAimAngle(ballId, angle)
      }
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ballId = draggingRef.current
    if (ballId === null || engine.phase !== 'aim') return

    const renderer = rendererRef.current
    if (!renderer) return
    const point = renderer.toArena(event.clientX, event.clientY)
    const ball = engine.balls.find((b) => b.id === ballId)
    if (!ball) return

    const angle = Math.atan2(point.y - ball.y, point.x - ball.x)
    engine.setAimAngle(ballId, angle)
  }

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingRef.current === null) return
    draggingRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div className="arena-area" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className={`arena-canvas${engine.phase === 'aim' ? ' is-aiming' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      {children}
    </div>
  )
}
