/**
 * Uji duel headless: menjalankan kombinasi kelas tanpa browser untuk
 * memverifikasi bahwa duel selalu berakhir dengan pemenang yang wajar.
 *
 * Jalankan: npm run simulate
 */
import { GameEngine } from '../src/game/GameEngine.ts'
import { ARENA_HALF_SIZE, FIXED_DT, MAX_BATTLE_DURATION } from '../src/game/constants.ts'
import { BALL_CLASS_ORDER, getBallClass } from '../src/game/BallClasses.ts'
import type { BallClassId, BattleResult } from '../src/types.ts'

interface Row {
  matchup: string
  winner: string
  duration: number
  attacks: number
  hits: number
  accuracy: number
  timeout: boolean
  avgSpeed: number
  escapedArena: boolean
}

const rows: Row[] = []
const wins: Record<string, number> = {}
let launchDirectionMismatch = false

/** Selisih sudut minimum antara dua sudut (radian). */
function normalizeAngle(angle: number): number {
  let value = angle % (Math.PI * 2)
  if (value > Math.PI) value -= Math.PI * 2
  if (value < -Math.PI) value += Math.PI * 2
  return value
}

for (const a of BALL_CLASS_ORDER) {
  for (const b of BALL_CLASS_ORDER) {
    if (a === b) continue

    let result: BattleResult | null = null
    const engine = new GameEngine({
      classA: a as BallClassId,
      classB: b as BallClassId,
      onBattleEnd: (r) => {
        result = r
      },
    })
    // Arah luncur acak supaya skrip juga menguji jalur launch.
    engine.randomizeAim()
    engine.launch()

    // Verifikasi arah launch: velocity awal harus searah aimAngle.
    const launchAngles = engine.balls.map((ball) => {
      const angle = Math.atan2(ball.vy, ball.vx)
      const delta = Math.abs(normalizeAngle(angle - ball.aimAngle))
      return delta
    })
    if (launchAngles.some((delta) => delta > (15 * Math.PI) / 180)) {
      launchDirectionMismatch = true
    }

    const steps = Math.ceil(MAX_BATTLE_DURATION / FIXED_DT)
    let speedSum = 0
    let speedSamples = 0
    let escapedArena = false

    for (let i = 0; i < steps && !result; i += 1) {
      engine.update(FIXED_DT, 1)

      for (const ball of engine.balls) {
        const speed = Math.hypot(ball.vx, ball.vy)
        speedSum += speed
        speedSamples += 1

        // Bola tidak boleh keluar dari dinding arena persegi.
        const limit = ARENA_HALF_SIZE - ball.radius + 0.01
        if (Math.abs(ball.x) > limit || Math.abs(ball.y) > limit) {
          escapedArena = true
        }
      }
    }

    if (!result) {
      rows.push({
        matchup: `${a} vs ${b}`,
        winner: '-',
        duration: MAX_BATTLE_DURATION,
        attacks: 0,
        hits: 0,
        accuracy: 0,
        timeout: true,
        avgSpeed: speedSamples ? speedSum / speedSamples : 0,
        escapedArena,
      })
      continue
    }

    const finished = result as BattleResult
    const winner = finished.winnerClassId ?? 'none'
    wins[winner] = (wins[winner] ?? 0) + 1
    const totalAttacks = finished.stats.reduce((sum, s) => sum + s.attacks, 0)
    const totalHits = finished.stats.reduce((sum, s) => sum + s.hits, 0)

    rows.push({
      matchup: `${a} vs ${b}`,
      winner: winner ?? 'none',
      duration: finished.duration,
      attacks: totalAttacks,
      hits: totalHits,
      accuracy: totalAttacks > 0 ? (totalHits / totalAttacks) * 100 : 0,
      timeout: finished.duration >= MAX_BATTLE_DURATION,
      avgSpeed: speedSamples ? speedSum / speedSamples : 0,
      escapedArena,
    })
  }
}

console.log('\n== Hasil duel headless ==\n')
console.log(
  ['matchup', 'winner', 'duration(s)', 'attacks', 'hits', 'accuracy', 'avg speed', 'timeout']
    .map((h) => h.padEnd(14))
    .join(''),
)
for (const row of rows) {
  console.log(
    [
      row.matchup.padEnd(14),
      row.winner.padEnd(14),
      row.duration.toFixed(1).padEnd(14),
      String(row.attacks).padEnd(14),
      String(row.hits).padEnd(14),
      `${row.accuracy.toFixed(0)}%`.padEnd(14),
      `${row.avgSpeed.toFixed(0)} u/s`.padEnd(14),
      row.timeout ? 'YES' : 'no',
    ].join(''),
  )
}

console.log('\n== Total kemenangan ==\n')
for (const [name, count] of Object.entries(wins)) {
  console.log(`${name.padEnd(12)} ${count}`)
}

const timeouts = rows.filter((r) => r.timeout).length
const escaped = rows.filter((r) => r.escapedArena).length
const averageDuration = rows.reduce((sum, r) => sum + r.duration, 0) / rows.length
const averageSpeed = rows.reduce((sum, r) => sum + r.avgSpeed, 0) / rows.length

console.log('\n== Ringkasan ==\n')
console.log(`Duel timeout      : ${timeouts}/${rows.length}`)
console.log(`Bola keluar arena : ${escaped}/${rows.length}`)
console.log(`Durasi rata-rata  : ${averageDuration.toFixed(1)} detik`)
console.log(`Kecepatan rata-rata: ${averageSpeed.toFixed(0)} unit/detik`)
console.log(
  `Stat speed kelas   : ${BALL_CLASS_ORDER.map((id) => `${id}=${getBallClass(id).speed}`).join(', ')}`,
)

if (timeouts > 0) {
  console.error('\nGAGAL: ada duel yang tidak menghasilkan pemenang.')
  process.exit(1)
}
if (escaped > 0) {
  console.error('\nGAGAL: ada bola yang keluar dari dinding arena.')
  process.exit(1)
}
if (launchDirectionMismatch) {
  console.error('\nGAGAL: arah luncur tidak sesuai arah yang dipilih.')
  process.exit(1)
}
console.log('\nOK: semua duel menghasilkan pemenang dan bola tetap di dalam arena.')

