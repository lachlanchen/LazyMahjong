function seedWords(seed: string): [number, number, number, number] {
  let h1 = 0xdeadbeef ^ seed.length
  let h2 = 0x41c6ce57 ^ seed.length
  let h3 = 0xc0decafe ^ seed.length
  let h4 = 0x9e3779b9 ^ seed.length
  for (let index = 0; index < seed.length; index += 1) {
    const code = seed.charCodeAt(index)
    h1 = Math.imul(h1 ^ code, 2654435761)
    h2 = Math.imul(h2 ^ code, 1597334677)
    h3 = Math.imul(h3 ^ code, 2246822507)
    h4 = Math.imul(h4 ^ code, 3266489909)
  }
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0]
}

export function seededRandom(seed: string): () => number {
  let [a, b, c, d] = seedWords(seed)
  return () => {
    const t = (a + b + d) >>> 0
    d = (d + 1) >>> 0
    a = (b ^ (b >>> 9)) >>> 0
    b = (c + (c << 3)) >>> 0
    c = ((c << 21) | (c >>> 11)) >>> 0
    c = (c + t) >>> 0
    return t / 4294967296
  }
}

export function shuffled<T>(items: readonly T[], seed: string): T[] {
  const result = [...items]
  const random = seededRandom(seed)
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    const current = result[index]
    const replacement = result[target]
    if (current === undefined || replacement === undefined) continue
    result[index] = replacement
    result[target] = current
  }
  return result
}
