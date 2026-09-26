export const accentColors = [
  'blue',
  'teal',
  'green',
  'violet',
  'neutral',
] as const
export type AccentColor = (typeof accentColors)[number]

export const defaultAccent: AccentColor = 'blue'
export const ACCENT_COOKIE = 'accent'

export function isAccentColor(value: unknown): value is AccentColor {
  return accentColors.includes(value as AccentColor)
}
