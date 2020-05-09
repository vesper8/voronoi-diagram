export function inverseLerp(a, b, v) {
  return (v - a) / (b - a)
}

export function lerp(a, b, t) {
  return a * (1 - t) + b * t
}
