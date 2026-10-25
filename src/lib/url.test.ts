import { describe, expect, it } from 'vitest'
import { isPrivateHost, normalizeUrl, NOT_PUBLIC_MESSAGE } from './url'

describe('normalizeUrl', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['  example.com/shop?x=1  ', 'https://example.com/shop?x=1'],
    ['http://example.com', 'http://example.com/'],
    ['HTTPS://Example.COM/Path', 'https://example.com/Path'],
    ['example.com:8080/a', 'https://example.com:8080/a'],
    ['example.com/#section', 'https://example.com/'],
    ['//example.com', 'https://example.com/'],
  ])('accepts %s', (input, expected) => {
    expect(normalizeUrl(input)).toEqual({ ok: true, url: expected })
  })

  it.each([
    ['', /Enter a web address/],
    ['exa mple.com', /spaces/],
    ['ftp://example.com', /publicly reachable/],
    ['javascript:alert(1)', /publicly reachable/],
    ['file:///etc/passwd', /publicly reachable/],
    ['localhost:3000', /publicly reachable/],
    ['http://127.0.0.1', /publicly reachable/],
    ['192.168.1.20', /publicly reachable/],
    ['http://10.0.0.1/admin', /publicly reachable/],
    ['172.20.1.1', /publicly reachable/],
    ['http://[::1]/', /publicly reachable/],
    ['printer.local', /publicly reachable/],
    ['intranet', /full domain/],
    ['https://user:pass@example.com', /username or password/],
    ['http://', /doesn’t look like a web address/],
  ])('rejects %j', (input, message) => {
    const r = normalizeUrl(input)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(message)
  })

  it('uses the exact required message for private hosts', () => {
    expect(normalizeUrl('localhost')).toEqual({ ok: false, error: NOT_PUBLIC_MESSAGE })
  })

  it('catches decimal-encoded loopback that URL normalizes', () => {
    expect(normalizeUrl('http://2130706433/').ok).toBe(false)
  })
})

describe('isPrivateHost', () => {
  it.each([
    '169.254.1.1',
    '100.64.0.1',
    'fd12:3456::1',
    'fe80::1',
    '::ffff:7f00:1',
    '0.0.0.0',
    'app.localhost',
  ])('%s is private', (h) => expect(isPrivateHost(h)).toBe(true))

  it.each(['8.8.8.8', '172.32.0.1', 'example.com', '2606:4700::1111'])('%s is public', (h) =>
    expect(isPrivateHost(h)).toBe(false),
  )
})
