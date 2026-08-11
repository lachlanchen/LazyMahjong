function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
  return `{${entries.join(',')}}`
}

function lane(input: string, seed: number): string {
  let hash = seed >>> 0
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
    hash ^= hash >>> 13
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function digest(value: unknown): string {
  const input = canonical(value)
  return [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35]
    .map((seed) => lane(input, seed))
    .join('')
}

export function canonicalAction(action: unknown): string {
  return canonical(action)
}
