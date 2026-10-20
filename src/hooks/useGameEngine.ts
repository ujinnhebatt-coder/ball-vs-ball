import { useCallback, useEffect, useRef, useState } from 'react'
import { GameEngine } from '../game/GameEngine.ts'
import { MAX_FRAME_DT } from '../game/constants.ts'
import type { BallClassId, BattleResult, HudSnapshot } from '../types.ts'

const HUD_UPDATE_INTERVAL_MS = 66 // ~15Hz, cukup untuk HP bar & timer

export interface UseGameEngineOptions {
  classA: BallClassId
  classB: BallClassId
  /** Dipanggil sekali saat duel selesai. */
  onBattleEnd: (result: BattleResult) => void
}

/**
 * Menjalankan game loop (requestAnimationFrame) di luar React state,
 * lalu mendorong snapshot HUD ke React secara throttled.
 */
export function useGameEngine({ classA, classB, onBattleEnd }: UseGameEngineOptions) {
  const engineRef = useRef<GameEngine | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const speedRef = useRef(1)

  const [hud, setHud] = useState<HudSnapshot | null>(null)
  const [speed, setSpeedState] = useState(1)
  const [isPaused, setIsPaused] = useState(false)

  // Callback ref supaya rAF loop tidak perlu di-restart tiap render.
  const onBattleEndRef = useRef(onBattleEnd)
  useEffect(() => {
    onBattleEndRef.current = onBattleEnd
  })

  // Buat engine sekali.
  if (engineRef.current === null) {
    engineRef.current = new GameEngine({
      classA: classA,
      classB: classB,
      onBattleEnd: (result) => onBattleEndRef.current(result),
    })
  }
  const engine = engineRef.current

  // Ganti kelas bola ketika pilihan di Battle Setup berubah.
  // Hanya di-reset bila kelas memang berbeda, supaya duel yang baru dimulai
  // tidak ke-reset kembali oleh efek ini.
  useEffect(() => {
    const [first, second] = engine.balls
    if (first?.classId !== classA || second?.classId !== classB) {
      engine.setClasses(classA, classB)
      setHud(engine.getHudSnapshot())
    }
  }, [engine, classA, classB])

  // Loop utama.
  useEffect(() => {
    const loop = (time: number) => {
      const last = lastTimeRef.current || time
      lastTimeRef.current = time
      const frameDt = Math.min(MAX_FRAME_DT, (time - last) / 1000)

      // Engine_internal sudah menangani status pause.
      engine.update(frameDt, speedRef.current)

      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [engine])

  // Push HUD throttled.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setHud(engine.getHudSnapshot())
    }, HUD_UPDATE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [engine])

  const start = useCallback(() => {
    engine.start()
    setIsPaused(engine.paused)
  }, [engine])

  const togglePause = useCallback(() => {
    engine.togglePause()
    setIsPaused(engine.paused)
  }, [engine])

  const setSpeed = useCallback(
    (value: number) => {
      speedRef.current = value
      setSpeedState(value)
    },
    [],
  )

  const restart = useCallback(() => {
    engine.reset(classA, classB)
    engine.start()
    setIsPaused(engine.paused)
    setHud(engine.getHudSnapshot())
  }, [engine, classA, classB])

  return { engine, hud, start, restart, togglePause, isPaused, speed, setSpeed }
}
