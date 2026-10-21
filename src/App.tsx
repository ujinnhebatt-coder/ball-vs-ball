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

/** Id bola pertama (Pemain 1) di engine. */
const FIRST_BALL_ID = 1

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [classA, setClassA] = useState<BallClassId>('fire')
  const [classB, setClassB] = useState<BallClassId>('ice')
  const [result, setResult] = useState<BattleResult | null>(null)
  const [activeBallId, setActiveBallId] = useState(FIRST_BALL_ID)

  const handleBattleEnd = useCallback((battleResult: BattleResult) => {
    setResult(battleResult)
  }, [])

  const {
    engine,
    hud,
    launch,
    randomizeAim,
    restart,
    togglePause,
    isPaused,
    speed,
    setSpeed,
  } = useGameEngine({
    classA,
    classB,
    onBattleEnd: handleBattleEnd,
  })

  const enterBattle = useCallback(() => {
    setResult(null)
    setActiveBallId(FIRST_BALL_ID)
    setScreen('battle')
    // Siapkan arena di fase aim (menentukan arah) pada frame berikutnya.
    requestAnimationFrame(() => restart())
  }, [restart])

  const rematch = useCallback(() => {
    setResult(null)
    setActiveBallId(FIRST_BALL_ID)
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
      <BattleScreen engine={engine} activeBallId={activeBallId} onSelectBall={setActiveBallId} />
      {hud && (
        <BattleHUD
          hud={hud}
          isPaused={isPaused}
          speed={speed}
          activeBallId={activeBallId}
          onSelectBall={setActiveBallId}
          onLaunch={launch}
          onRandomAim={randomizeAim}
          onTogglePause={togglePause}
          onRestart={rematch}
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
