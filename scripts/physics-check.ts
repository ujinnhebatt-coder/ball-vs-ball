/**
 * Uji fisika arena: memastikan gerak bola "sesuai" —
 * memantul di dinding dengan benar, tidak menembus, tidak bertumpuk,
 * knockback bertahan, dan tidak nyangkut/getar di dinding.
 *
 * Jalankan: npm run physics
 */
import { GameEngine } from '../src/game/GameEngine.ts'
import {
  ARENA_HALF_SIZE,
  BALL_RADIUS,
  FIXED_DT,
  LAUNCH_DURATION,
  LINEAR_DAMPING,
  WALL_RESTITUTION,
} from '../src/game/constants.ts'
import * as Physics from '../src/game/Physics.ts'
import type { Ball } from '../src/types.ts'

const HALF = ARENA_HALF_SIZE
const LIMIT = HALF - BALL_RADIUS

let failures = 0

function check(label: string, passed: boolean, detail: string): void {
  console.log(`  ${passed ? 'OK  ' : 'GAGAL'} ${label} — ${detail}`)
  if (!passed) failures += 1
}

function makeBall(x: number, y: number, vx: number, vy: number): Ball {
  return {
    id: 1,
    classId: 'fire',
    name: 'Test',
    x,
    y,
    vx,
    vy,
    radius: BALL_RADIUS,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 0,
    speed: 200,
    attackRange: 80,
    color: '#ef4444',
    strokeColor: '#b91c1c',
    attackCooldown: 0,
    recoverTimer: 0,
    repositionTimer: 0,
    hitFlash: 0,
    aiState: 'idle',
    aimAngle: 0,
    launchTimer: 0,
    facing: 0,
  }
}

/** Menggerakkan bola bebas (tanpa AI) selama satu langkah. */
function stepFree(ball: Ball): boolean {
  const damping = Math.exp(-LINEAR_DAMPING * FIXED_DT)
  ball.vx *= damping
  ball.vy *= damping
  ball.x += ball.vx * FIXED_DT
  ball.y += ball.vy * FIXED_DT
  return Physics.collideWithArena(ball, HALF)
}

console.log('\n== 1) Pantul dinding: komponen normal dibalik & dikecilkan ==')
for (const degrees of [20, 35, 50]) {
  const radians = (degrees * Math.PI) / 180
  const speed = 250
  const ball = makeBall(
    -HALF + BALL_RADIUS + 2,
    -300,
    Math.cos(radians) * speed,
    Math.sin(radians) * speed,
  )
  let verified = false
  for (let i = 0; i < 6000; i += 1) {
    const before = { vx: ball.vx, vy: ball.vy }
    const damping = Math.exp(-LINEAR_DAMPING * FIXED_DT)
    ball.vx *= damping
    ball.vy *= damping
    ball.x += ball.vx * FIXED_DT
    ball.y += ball.vy * FIXED_DT

    // Tentukan sumbu normal dinding yang terkena.
    let normal: 'x' | 'y' | null = null
    if (ball.x < -LIMIT || ball.x > LIMIT) normal = 'x'
    else if (ball.y < -LIMIT || ball.y > LIMIT) normal = 'y'
    if (!normal) continue

    Physics.collideWithArena(ball, HALF)
    const beforeNormal = normal === 'x' ? before.vx : before.vy
    const afterNormal = normal === 'x' ? ball.vx : ball.vy
    const beforeTangent = normal === 'x' ? before.vy : before.vx
    const afterTangent = normal === 'x' ? ball.vy : ball.vx

    const normalFlipped = Math.sign(afterNormal) === -Math.sign(beforeNormal)
    const normalScaled =
      Math.abs(afterNormal) <= Math.abs(beforeNormal) * WALL_RESTITUTION + 0.001
    const tangentKept = Math.abs(afterTangent) >= Math.abs(beforeTangent) * 0.97

    check(
      `pantul ${degrees}° (normal ${normal})`,
      normalFlipped && normalScaled && tangentKept,
      `normal ${beforeNormal.toFixed(0)} -> ${afterNormal.toFixed(0)} u/s, ` +
        `tangensial ${beforeTangent.toFixed(0)} -> ${afterTangent.toFixed(0)} u/s`,
    )
    verified = true
    break
  }
  if (!verified) check(`pantul ${degrees}°`, false, 'tidak mengenai dinding')
}

console.log('\n== 2) Dinding: bola memantul & mencapai dinding ==')
{
  const ball = makeBall(-HALF + BALL_RADIUS + 5, 0, 250, 0)
  let bounces = 0
  for (let i = 0; i < 60 * 30; i += 1) {
    if (stepFree(ball)) bounces += 1
  }
  check('bola bebas memantul di dinding', bounces >= 1, `${bounces} kali pantul`)
}

console.log('\n== 3) Anti-penetrasi dinding pada kecepatan tinggi ==')
for (const speed of [100, 250, 420, 560]) {
  const ball = makeBall(0, 0, speed, speed * 0.3)
  let maxOut = 0
  for (let i = 0; i < 4000; i += 1) {
    ball.x += ball.vx * FIXED_DT
    ball.y += ball.vy * FIXED_DT
    Physics.collideWithArena(ball, HALF)
    maxOut = Math.max(maxOut, Math.abs(ball.x) - LIMIT, Math.abs(ball.y) - LIMIT)
  }
  check(`v=${speed}`, maxOut <= 0.001, `tembus ${Math.max(0, maxOut).toFixed(3)} unit`)
}

console.log('\n== 4) Anti-overlap antar bola ==')
for (const speed of [100, 300, 560]) {
  const a = makeBall(-150, 0, speed, 0)
  const b = makeBall(150, 0, -speed, 0)
  let maxOverlap = 0
  for (let i = 0; i < 200; i += 1) {
    a.x += a.vx * FIXED_DT
    a.y += a.vy * FIXED_DT
    b.x += b.vx * FIXED_DT
    b.y += b.vy * FIXED_DT
    Physics.collideBalls(a, b)
    const distance = Math.hypot(b.x - a.x, b.y - a.y)
    maxOverlap = Math.max(maxOverlap, BALL_RADIUS * 2 - distance)
  }
  check(
    `v=${speed}`,
    maxOverlap <= 0.5,
    `overlap maks ${Math.max(0, maxOverlap).toFixed(2)} unit`,
  )
}

console.log('\n== 5) Pantulan sudut (kedua sumbu berbalik) ==')
{
  const ball = makeBall(-HALF + 60, -HALF + 60, -250, -250)
  let ok = false
  for (let i = 0; i < 600; i += 1) {
    ball.x += ball.vx * FIXED_DT
    ball.y += ball.vy * FIXED_DT
    if (Physics.collideWithArena(ball, HALF)) {
      ok = ball.vx > 0 && ball.vy > 0
      check(
        'bouncing sudut',
        ok,
        `v = (${ball.vx.toFixed(0)}, ${ball.vy.toFixed(0)}) — dua sumbu harus berbalik`,
      )
      break
    }
  }
  if (!ok && !failures) check('bouncing sudut', false, 'tidak mengenai sudut')
}

console.log('\n== 6) Knockback bertahan setelah benturan ==')
{
  const engine = new GameEngine({ classA: 'fire', classB: 'ice' })
  engine.launch()
  const [a, b] = engine.balls
  a.x = -60
  a.y = 0
  a.vx = 400
  a.vy = 0
  b.x = 60
  b.y = 0
  b.vx = -400
  b.vy = 0
  engine.update(FIXED_DT, 1)
  const rightAfter = Math.hypot(b.vx, b.vy)
  for (let i = 0; i < 36; i += 1) engine.update(FIXED_DT, 1)
  const afterHalfSecond = Math.hypot(b.vx, b.vy)
  check(
    'knockback tidak dibatalkan AI',
    afterHalfSecond > rightAfter * 0.45,
    `${rightAfter.toFixed(0)} u/s -> ${afterHalfSecond.toFixed(0)} u/s setelah 0,6 dtk`,
  )
}

console.log('\n== 7) Luncur menuju dinding: bola sampai & memantul ==')
{
  const engine = new GameEngine({ classA: 'thunder', classB: 'nature' })
  engine.setAimAngle(engine.balls[0].id, Math.PI)
  engine.launch()
  const [ball] = engine.balls
  let reachedWall = false
  for (let i = 0; i < 60 * 6; i += 1) {
    engine.update(FIXED_DT, 1)
    if (Math.abs(ball.x) <= LIMIT + 2) reachedWall = true
  }
  check('luncur mencapai dinding', reachedWall, `posisi akhir x = ${ball.x.toFixed(0)}`)
}

console.log('\n== 8) Bola tidak nyangkut / getar di dinding ==')
for (const classId of ['fire', 'thunder'] as const) {
  const engine = new GameEngine({ classA: classId, classB: 'nature' })
  engine.launch()
  let stuck = 0
  let nearWall = 0
  for (let i = 0; i < 60 * 40; i += 1) {
    engine.update(FIXED_DT, 1)
    for (const ball of engine.balls) {
      const edge = Math.min(HALF - Math.abs(ball.x), HALF - Math.abs(ball.y))
      if (edge < BALL_RADIUS + 8) {
        nearWall += 1
        if (Math.hypot(ball.vx, ball.vy) < 15) stuck += 1
      }
    }
  }
  check(
    `${classId}: tidak nyangkut di dinding`,
    stuck === 0,
    `${stuck} frame diam dari ${nearWall} frame dekat dinding`,
  )
}

console.log('\n== 9) Energi pantul tidak bertambah ==')
{
  const ball = makeBall(-HALF + BALL_RADIUS + 2, 0, 250, 120)
  let before = Math.hypot(ball.vx, ball.vy)
  for (let i = 0; i < 6000; i += 1) {
    if (stepFree(ball)) {
      const after = Math.hypot(ball.vx, ball.vy)
      check(
        'pantul tidak menambah energi',
        after <= before + 0.001,
        `${before.toFixed(0)} -> ${after.toFixed(0)} u/s (restitusi ${WALL_RESTITUTION})`,
      )
      break
    }
  }
}

console.log('')
if (failures > 0) {
  console.error(`GAGAL: ${failures} pemeriksaan fisika tidak lolos.`)
  process.exit(1)
}
console.log(`OK: seluruh pemeriksaan fisika lolos (damping ${LINEAR_DAMPING}/s, luncur ${LAUNCH_DURATION}s).`)
