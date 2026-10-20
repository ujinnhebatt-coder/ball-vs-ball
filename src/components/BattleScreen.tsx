import { useEffect, useRef, type ReactNode } from 'react'
import { Renderer } from '../game/Renderer.ts'
import { MAX_DPR } from '../game/constants.ts'
import type { GameEngine } from '../game/GameEngine.ts'

interface BattleScreenProps {
  engine: GameEngine
  children?: ReactNode
}

/**
 * Area arena. Canvas mengikuti ukuran wrapper (kotak persegicontain-fit)
 * dan digambar ulang setiap frame oleh renderer.
 */
export function BattleScreen({ engine, children }: BattleScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Renderer | null>(null)

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
      rendererRef.current?.render(engine)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [engine])

  return (
    <div className="arena-area" ref={wrapperRef}>
      <canvas ref={canvasRef} className="arena-canvas" />
      {children}
    </div>
  )
}
