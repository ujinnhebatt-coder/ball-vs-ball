/**
 * Uji duel headless: menjalankan kombinasi kelas tanpa browser untuk
 * memverifikasi bahwa duel selalu berakhir dengan pemenang yang wajar.
 *
 * Jalankan: npm run simulate
 */
import { GameEngine } from '../src/game/GameEngine.ts'
import { FIXED_DT, MAX_BATTLE_DURATION } from '../src/game/constants.ts'
import { BALL_CLASS_ORDER } from '../src/game/BallClasses.ts'
import type { BallClassId, BattleResult } from '../src/types.ts'

interface Row {
  matchup: string
  winner: string
  duration: number
  attacks: number
  hits: number
  accuracy: number
  timeout: boolean
}

const rows: Row[] = []
const wins: Record<string, number> = {}

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
    engine.start()

    const steps = Math.ceil(MAX_BATTLE_DURATION / FIXED_DT)
    for (let i = 0; i < steps && !result; i += 1) {
      engine.update(FIXED_DT, 1)
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
    })
  }
}

console.log('\n== Hasil duel headless ==\n')
console.log(
  ['matchup', 'winner', 'duration(s)', 'attacks', 'hits', 'accuracy', 'timeout']
    .map((h, i) => (i === 0 ? h.padEnd(16) : h.padEnd(14)))
    .join(''),
)
for (const row of rows) {
  console.log(
    [
      row.matchup.padEnd(16),
      row.winner.padEnd(14),
      row.duration.toFixed(1).padEnd(14),
      String(row.attacks).padEnd(14),
      String(row.hits).padEnd(14),
      `${row.accuracy.toFixed(0)}%`.padEnd(14),
      row.timeout ? 'YES' : 'no',
    ].join(''),
  )
}

console.log('\n== Total kemenangan ==\n')
for (const [name, count] of Object.entries(wins)) {
  console.log(`${name.padEnd(12)} ${count}`)
}

const timeouts = rows.filter((r) => r.timeout).length
const averageDuration = rows.reduce((sum, r) => sum + r.duration, 0) / rows.length
const averageAccuracy =
  rows.reduce((sum, r) => sum + r.accuracy, 0) / rows.length

console.log('\n== Ringkasan ==\n')
console.log(`Duel timeout     : ${timeouts}/${rows.length}`)
console.log(`Durasi rata-rata : ${averageDuration.toFixed(1)} detik`)
console.log(`Akurasi rata-rata: ${averageAccuracy.toFixed(0)}%`)

if (timeouts > 0) {
  console.error('\nGAGAL: ada duel yang tidak menghasilkan pemenang.')
  process.exit(1)
}
console.log('\nOK: semua duel menghasilkan pemenang.')
