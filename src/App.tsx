import { useCallback, useState } from 'react'
import { BattleHUD } from './components/BattleHUD.tsx'
import { BattleScreen } from './components/BattleScreen.tsx'
import { BattleSetup } from './components/BattleSetup.tsx'
import { HowToPlay } from './components/HowToPlay.tsx'
import { MainMenu } from './components/MainMenu.tsx'
import { ResultOverlay } from './components/ResultOverlay.tsx'
import { useGameEngine } from './hooks/useGameEngine.ts'
import type { BallClassId, BattleResult } from './types.ts'

type Screen = 'menu' | 'howto' | 'setup' | 'battle'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [classA, setClassA] = useState<BallClassId>('fire')
  const [classB, setClassB] = useState<BallClassId>('ice')
  const [result, setResult] = useState<BattleResult | null>(null)

  const handleBattleEnd = useCallback((battleResult: BattleResult) => {
    setResult(battleResult)
  }, [])

  const { engine, hud, restart, togglePause, isPaused, speed, setSpeed } = useGameEngine({
    classA,
    classB,
    onBattleEnd: handleBattleEnd,
  })

  const enterBattle = useCallback(() => {
    setResult(null)
    setScreen('battle')
    // Mulai duel baru pada frame berikutnya supaya engine sudah ter-mount.
    requestAnimationFrame(() => restart())
  }, [restart])

  const rematch = useCallback(() => {
    setResult(null)
    restart()
  }, [restart])

  if (screen === 'menu') {
    return (
      <MainMenu
        onPlay={() => setScreen('setup')}
        onHowToPlay={() => setScreen('howto')}
      />
    )
  }

  if (screen === 'howto') {
    return <HowToPlay onBack={() => setScreen('menu')} />
  }

  if (screen === 'setup') {
    return (
      <BattleSetup
        classA={classA}
        classB={classB}
        onChange={(a, b) => {
          setClassA(a)
          setClassB(b)
        }}
        onStart={enterBattle}
        onBack={() => setScreen('menu')}
      />
    )
  }

  return (
    <div className="screen battle-screen">
      <BattleScreen engine={engine} />
      {hud && (
        <BattleHUD
          hud={hud}
          isPaused={isPaused}
          speed={speed}
          onTogglePause={togglePause}
          onRestart={restart}
          onSpeedChange={setSpeed}
          onQuit={() => {
            setResult(null)
            setScreen('setup')
          }}
        />
      )}
      {result && (
        <ResultOverlay
          result={result}
          onRematch={rematch}
          onChangeBalls={() => {
            setResult(null)
            setScreen('setup')
          }}
          onMainMenu={() => {
            setResult(null)
            setScreen('menu')
          }}
        />
      )}
    </div>
  )
}
