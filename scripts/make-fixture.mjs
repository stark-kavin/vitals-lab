// Builds src/fixtures/sample-report.json from Lighthouse's own sample result
// (core/test/results/sample_v2.json), wrapped in a PSI v5 envelope with
// illustrative CrUX field data. Usage: node scripts/make-fixture.mjs <sample_v2.json>
import { readFileSync, writeFileSync } from 'node:fs'

const src = process.argv[2]
if (!src) throw new Error('Pass the path to sample_v2.json')

let text = readFileSync(src, 'utf8')
text = text
  .replaceAll(
    'http://localhost:10200/dobetterweb/dbw_tester.html',
    'https://northwind-pantry.example/',
  )
  .replaceAll('http://localhost:10200/dobetterweb/', 'https://northwind-pantry.example/assets/')
  .replaceAll('http://localhost:10200/', 'https://cdn.northwind-pantry.example/')
  .replaceAll('localhost:10200', 'northwind-pantry.example')
  .replace(/"entity": *"localhost"/g, '"entity": "northwind-pantry.example"')
  .replaceAll('localhost:10503', 'static.northwind-pantry.example')

const lhr = JSON.parse(text)
for (const k of ['fullPageScreenshot', 'i18n', 'timing', 'entities', 'stackPacks']) delete lhr[k]
delete lhr.categories['agentic-browsing']
for (const audit of Object.values(lhr.audits)) {
  const t = audit.details?.type
  if (t === 'treemap-data' || t === 'debugdata') delete audit.details
}
lhr.fetchTime = '2026-10-24T09:12:41.118Z'
lhr.runWarnings = []

const dist = (good, ni, edges) => [
  { min: 0, max: edges[0], proportion: good },
  { min: edges[0], max: edges[1], proportion: ni },
  { min: edges[1], proportion: Math.round((1 - good - ni) * 10000) / 10000 },
]

const urlData = {
  id: 'https://northwind-pantry.example/',
  metrics: {
    LARGEST_CONTENTFUL_PAINT_MS: {
      percentile: 3180,
      distributions: dist(0.6912, 0.2104, [2500, 4000]),
      category: 'AVERAGE',
    },
    INTERACTION_TO_NEXT_PAINT: {
      percentile: 236,
      distributions: dist(0.7121, 0.2213, [200, 500]),
      category: 'AVERAGE',
    },
    CUMULATIVE_LAYOUT_SHIFT_SCORE: {
      percentile: 4,
      distributions: dist(0.8833, 0.0712, [10, 25]),
      category: 'FAST',
    },
    FIRST_CONTENTFUL_PAINT_MS: {
      percentile: 2240,
      distributions: dist(0.6403, 0.2581, [1800, 3000]),
      category: 'AVERAGE',
    },
    EXPERIMENTAL_TIME_TO_FIRST_BYTE: {
      percentile: 1020,
      distributions: dist(0.6187, 0.2905, [800, 1800]),
      category: 'AVERAGE',
    },
  },
  overall_category: 'AVERAGE',
  initial_url: 'https://northwind-pantry.example/',
}
const originData = {
  id: 'https://northwind-pantry.example',
  metrics: {
    LARGEST_CONTENTFUL_PAINT_MS: {
      percentile: 2410,
      distributions: dist(0.7702, 0.1588, [2500, 4000]),
      category: 'FAST',
    },
    INTERACTION_TO_NEXT_PAINT: {
      percentile: 188,
      distributions: dist(0.7804, 0.1702, [200, 500]),
      category: 'FAST',
    },
    CUMULATIVE_LAYOUT_SHIFT_SCORE: {
      percentile: 7,
      distributions: dist(0.8411, 0.1009, [10, 25]),
      category: 'FAST',
    },
    FIRST_CONTENTFUL_PAINT_MS: {
      percentile: 1790,
      distributions: dist(0.7511, 0.1802, [1800, 3000]),
      category: 'FAST',
    },
    EXPERIMENTAL_TIME_TO_FIRST_BYTE: {
      percentile: 840,
      distributions: dist(0.7011, 0.2389, [800, 1800]),
      category: 'AVERAGE',
    },
  },
  overall_category: 'FAST',
}

const psi = {
  captchaResult: 'CAPTCHA_NOT_NEEDED',
  kind: 'pagespeedonline#result',
  id: 'https://northwind-pantry.example/',
  loadingExperience: urlData,
  originLoadingExperience: originData,
  lighthouseResult: lhr,
  analysisUTCTimestamp: lhr.fetchTime,
}
writeFileSync('src/fixtures/sample-report.json', JSON.stringify(psi))
console.log('wrote', JSON.stringify(psi).length, 'bytes')
