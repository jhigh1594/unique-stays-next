export function l2Normalize(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0))
  if (magnitude === 0) return new Array(vec.length).fill(0) as number[]
  return vec.map((v) => v / magnitude)
}

export function cosineSimilarity(a: number[] | Float32Array, b: Float32Array): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}
