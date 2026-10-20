import type { BallClassDef, BallClassId } from '../types.ts'

/**
 * Data 4 kelas bola sesuai GDD bagian 6.
 * Semua statistik masih nilai awal untuk playtesting.
 */
export const BALL_CLASSES: Record<BallClassId, BallClassDef> = {
  fire: {
    id: 'fire',
    name: 'Fire Ball',
    role: 'Penyerang',
    description:
      'Bola api yang agresif dan berbahaya. Serangan dasarnya paling besar, tetapi pertahanan tipis.',
    skillName: 'Fire Burst',
    skillDescription: 'Damage area dan knockback ke lawan.',
    maxHp: 100,
    attack: 12,
    defense: 1,
    speed: 165,
    attackRange: 80,
    color: '#ef4444',
    strokeColor: '#b91c1c',
    ai: {
      preferredRange: 62,
      aggression: 0.85,
      recoverDuration: 0.25,
      steerForce: 1.15,
    },
  },
  ice: {
    id: 'ice',
    name: 'Ice Ball',
    role: 'Pengendali',
    description:
      'Bola es yang menjaga jarak dan mengatur ritme. Pertahanan bagus, serangan dasar cukup.',
    skillName: 'Frost Pulse',
    skillDescription: 'Memperlambat lawan selama 2 detik.',
    maxHp: 110,
    attack: 9,
    defense: 3,
    speed: 140,
    attackRange: 80,
    color: '#38bdf8',
    strokeColor: '#0369a1',
    ai: {
      preferredRange: 70,
      aggression: 0.45,
      recoverDuration: 0.35,
      steerForce: 0.95,
    },
  },
  thunder: {
    id: 'thunder',
    name: 'Thunder Ball',
    role: 'Mobilitas tinggi',
    description:
      'Bola petir paling lincah dengan serangan besar, tapi HP paling rendah. Sangat agresif.',
    skillName: 'Thunder Dash',
    skillDescription: 'Dash cepat dan damage kontak.',
    maxHp: 85,
    attack: 10,
    defense: 1,
    speed: 215,
    attackRange: 80,
    color: '#facc15',
    strokeColor: '#a16207',
    ai: {
      preferredRange: 58,
      aggression: 1,
      recoverDuration: 0.2,
      steerForce: 1.35,
    },
  },
  nature: {
    id: 'nature',
    name: 'Nature Ball',
    role: 'Bertahan',
    description:
      'Bola daun yang paling tahan banting dan tebal. Serangan dasarnya paling lemah.',
    skillName: 'Regeneration',
    skillDescription: 'Memulihkan 15 HP.',
    maxHp: 120,
    attack: 8,
    defense: 4,
    speed: 125,
    attackRange: 80,
    color: '#22c55e',
    strokeColor: '#15803d',
    ai: {
      preferredRange: 66,
      aggression: 0.3,
      recoverDuration: 0.4,
      steerForce: 0.85,
    },
  },
}

/** Urutan tampilan kartu di UI. */
export const BALL_CLASS_ORDER: BallClassId[] = ['fire', 'ice', 'thunder', 'nature']

export function getBallClass(id: BallClassId): BallClassDef {
  return BALL_CLASSES[id]
}
