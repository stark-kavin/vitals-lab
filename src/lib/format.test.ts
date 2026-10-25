import { describe, expect, it } from 'vitest'
import {
  displayUrl,
  formatBytes,
  formatCls,
  formatElapsed,
  formatMs,
  formatRelative,
} from './format'

describe('format', () => {
  it('formats milliseconds', () => {
    expect(formatMs(840)).toBe('840 ms')
    expect(formatMs(1234)).toBe('1.2 s')
    expect(formatMs(null)).toBe('–')
  })

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(1536)).toBe('1.5 KiB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MiB')
  })

  it('formats CLS', () => {
    expect(formatCls(0)).toBe('0')
    expect(formatCls(0.1)).toBe('0.1')
    expect(formatCls(0.01234)).toBe('0.012')
  })

  it('formats elapsed and relative time', () => {
    expect(formatElapsed(75)).toBe('1:15')
    const now = 1_000_000_000
    expect(formatRelative(now - 10_000, now)).toBe('just now')
    expect(formatRelative(now - 5 * 60_000, now)).toBe('5 min ago')
    expect(formatRelative(now - 3 * 3_600_000, now)).toBe('3 h ago')
    expect(formatRelative(now - 2 * 86_400_000, now)).toBe('2 days ago')
  })

  it('shortens URLs for display', () => {
    expect(displayUrl('https://example.com/')).toBe('example.com')
  })
})
