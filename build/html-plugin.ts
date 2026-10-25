import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

const MARKER = /<!-- theme-init:[^>]*-->/

/**
 * - Inlines build/theme-init.js so the saved theme applies before first paint
 *   without an extra blocking request.
 * - In production builds, adds a strict Content-Security-Policy that allows
 *   that one inline script by hash, and network access only to googleapis.com.
 *   (Dev skips the CSP because Vite's HMR preamble is an inline script.)
 * - Preloads the Latin Archivo file (headings and body) so text doesn't shift
 *   when it swaps in. Martian Mono isn't preloaded: it would compete with the
 *   main script on slow connections, and numerals are rarely the LCP element.
 */
export function htmlPlugin(): Plugin {
  const code = readFileSync(new URL('./theme-init.js', import.meta.url), 'utf8').trim()
  const hash = createHash('sha256').update(code).digest('base64')
  let isBuild = false

  return {
    name: 'vitals-lab-html',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        let out = html.replace(MARKER, `<script>${code}</script>`)
        if (!isBuild) return out

        const csp = [
          "default-src 'self'",
          `script-src 'self' 'sha256-${hash}'`,
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self'",
          "img-src 'self' data:",
          'connect-src https://www.googleapis.com',
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')

        const fonts = Object.keys(ctx.bundle ?? {}).filter((f) =>
          /archivo-latin-wdth-normal-[\w-]+\.woff2$/.test(f),
        )
        const preloads = fonts
          .map(
            (f) => `<link rel="preload" href="./${f}" as="font" type="font/woff2" crossorigin />`,
          )
          .join('\n    ')

        out = out.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
        )
        return out.replace('</title>', `</title>\n    ${preloads}`)
      },
    },
  }
}
