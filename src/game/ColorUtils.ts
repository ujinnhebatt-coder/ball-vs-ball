/**
 * Utilitas warna untuk rendering realistis (gradasi, highlight, rim light).
 */

/** Mengubah hex color (#rgb / #rrggbb) menjadi tuple RGB. */
export function hexToRgb(hex: string): [number, number, number] {
  let value = hex.replace('#', '').trim()
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('')
  }
  const int = Number.parseInt(value, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

/** Mengubah tuple RGB menjadi string CSS rgb(). */
export function rgbToCss(r: number, g: number, b: number, alpha = 1): string {
  return alpha >= 1
    ? `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
    : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`
}

/**
 * Mencerahkan (amount > 0) atau gelapkan (amount < 0) sebuah warna hex.
 * Amount 0..1.
 */
export function shadeColor(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const target = amount >= 0 ? 255 : 0
  const t = Math.abs(amount)
  return rgbToCss(r + (target - r) * t, g + (target - g) * t, b + (target - b) * t)
}

/** Menghasilkan warna dengan alpha tertentu dari hex. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToCss(r, g, b, alpha)
}

/** Mencampur dua warna hex dengan rasio t (0 = warna pertama, 1 = warna kedua). */
export function mixColors(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from)
  const [r2, g2, b2] = hexToRgb(to)
  return rgbToCss(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}
