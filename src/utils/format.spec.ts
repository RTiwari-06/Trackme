import { describe, it, expect } from 'vitest'

function formatDistance(km: number) {
  return `${km.toFixed(1)} km`
}

describe('formatDistance', () => {
  it('formats km to one decimal', () => {
    expect(formatDistance(6.234)).toBe('6.2 km')
  })
})
