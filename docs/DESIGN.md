# Vitals Lab design direction

## Concept: the bench instrument

Vitals Lab is a measuring tool, so it borrows from the objects people already trust to measure things: bench test equipment and analog panel meters. Think of the front panel of an old oscilloscope or a calibrated pressure gauge: an enamel-grey panel, printed scale markings, a needle, a readout window, and one colored control that tells you where to press.

The report is the instrument's printout of a single test. It should feel precise and calm, never alarming, and it should explain every number in plain English right next to it.

### Why not the suggested "warm paper editorial" concept

The brief suggested a warm paper background, ink text, a serif display face and editorial hairline layout. We kept the _measurement-lab_ half and dropped the _paper editorial_ half, because cream paper + high-contrast serif + broadsheet rules is now one of the most common generated looks and would read as a template. The bench-instrument direction is closer to the subject (measuring), gives the gauges a natural home, and still delivers everything the brief asked for: one brand accent separate from rating colors, a characterful display treatment, monospace numerals, instrument-like gauges, asymmetric layout, generous whitespace, and a real (not inverted) dark mode.

## Color

Light ("enamel panel")

| Token      | Hex       | Role                                                                          |
| ---------- | --------- | ----------------------------------------------------------------------------- |
| `--panel`  | `#E3E5E0` | Page background: cool enamel grey with a hint of green                        |
| `--plate`  | `#F5F6F3` | Raised surfaces: report plates, inputs, popovers                              |
| `--well`   | `#D5D9D3` | Recessed surfaces: readout windows, skeletons, filmstrip tray                 |
| `--ink`    | `#1E252A` | Primary text, needles, ticks                                                  |
| `--ink-2`  | `#525C62` | Secondary text                                                                |
| `--rule`   | `#A9B0AA` | Hairlines and scale markings (decorative, not boundaries)                     |
| `--edge`   | `#7A847E` | Control borders (3:1 against panel and plate)                                 |
| `--signal` | `#2A3FD1` | Brand accent: chart-recorder pen blue. Buttons, links, focus, selected states |
| `--bezel`  | `#1E252A` | Device frame around the tested-page screenshot                                |

Dark ("instrument at night"), its own palette rather than an inversion: graphite panel, lit scale markings, a lighter pen blue.

| Token      | Hex       |
| ---------- | --------- |
| `--panel`  | `#141A1E` |
| `--plate`  | `#1C2328` |
| `--well`   | `#0F1417` |
| `--ink`    | `#E4E8E5` |
| `--ink-2`  | `#9AA4A8` |
| `--rule`   | `#3A454C` |
| `--edge`   | `#6B777E` |
| `--signal` | `#9AA8FF` |

Rating colors are reserved for ratings and are never used for brand or decoration. They always ship with an icon and a text label (Good / Needs work / Poor), so color is never the only signal.

| Rating     | Light     | Dark      | Icon            |
| ---------- | --------- | --------- | --------------- |
| Good       | `#17663F` | `#53C88F` | `CircleCheck`   |
| Needs work | `#8A4B00` | `#F2A64A` | `TriangleAlert` |
| Poor       | `#A92E26` | `#FF8378` | `OctagonAlert`  |

All text colors pass WCAG AA (4.5:1) on panel, plate and well in both themes (checked with a contrast script during design).

## Type

- **Archivo** (variable, weight and width axes), the single text family. Its width axis does the work of a second family:
  - _Display_: Archivo at 75% width, weight 650-750, tight tracking. Used for headings and instrument labels, the way scale markings are printed on a meter face.
  - _Text_: Archivo at 100% width, weight 400-500, for body copy and UI.
- **Martian Mono** (variable) for every number: scores, metric values, timers, percentages, timestamps. Large score numerals use regular width; dense tables use the narrow width axis.

Scale (rem): 0.75 / 0.8125 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4. Body is 1rem with 1.55 line height; display sizes use 1.05-1.15. Line length stays under ~72 characters.

Not used: all-caps tracked eyebrows, middle-dot meta strings, arrows appended to button text, single accented words in headlines.

## Spacing, radius, elevation

- Spacing on a 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius follows hierarchy, not one value everywhere:
  - Plates (report sections): 14px
  - Controls (inputs, buttons, segmented switches): 8px
  - Badges and chips: 4px
  - Readout windows: 6px, with a 1px inner edge to look recessed
- No drop shadows on content. Depth comes from the panel / plate / well steps. The only shadow is on floating layers (popovers, dialogs).

## Layout

- Left-aligned everywhere. The home screen is a tool, not a landing page: the URL input is the first thing on screen.
- Home (wide): a 7/5 split. Left: heading, the "probe" (URL field + device switch + Analyze), category chips, key status. Right: the logbook of recent runs.
- Report (wide): a sticky left rail (about 300px) with the specimen (final screenshot in a device bezel), test details and actions. The main column carries the summary, the dial panel, field data, lab readouts, filmstrip and the audit lists.
- Report (narrow, mobile-first): one column. The specimen collapses to a compact header with a small screenshot.
- Hairlines are used only where they carry meaning: scale ticks, table rows, the filmstrip time axis.

```
wide report
+-----------+---------------------------------------------+
| specimen  | summary sentence (large, plain English)     |
| [screen]  | +-----------------------------------------+ |
| url       | |  dial  |  dial  |  dial  |  dial         | |  <- one plate, four dials
| device    | +-----------------------------------------+ |
| time      | Real visitors (field)   [This URL|Origin]  |
| actions   | Lab readouts (strip gauges)                 |
|           | Filmstrip                                    |
|           | Opportunities [All|FCP|LCP|TBT|CLS]         |
|           | Accessibility / Best practices / SEO        |
+-----------+---------------------------------------------+
```

## Signature element: the dial

The category gauge is a 240° panel meter, not a donut:

- A printed scale with minor ticks every 5 and major ticks every 10, numerals at 0, 50, 90 and 100 (the rating boundaries).
- A thin zone band under the scale: 0-49 poor, 50-89 needs work, 90-100 good, at low opacity so the needle and numerals stay dominant.
- A graphite needle with a round pivot.
- The score sits in a recessed readout window below the pivot, in Martian Mono, with the rating icon and label underneath.
- On reveal, the needle sweeps from 0 and the readout counts up (about 900ms, ease-out). Under `prefers-reduced-motion` it renders at its final value.

Metric values use a _strip gauge_: a short horizontal scale divided into good / needs work / poor zones with a marker at the measured value. It shows how far a value is from the target without needing a chart.

The loading state reuses the dial: the needle hunts back and forth like a meter settling, with an elapsed timer and rotating stage labels marked as indicative. No fake percentage.

## Motion

- One orchestrated moment: when a report arrives, the dials sweep in sequence (80ms stagger). Other sections simply appear.
- Motion that answers a user action is welcome: expanding an audit, switching field data scope, toggling theme.
- `prefers-reduced-motion: reduce` disables the sweep, count-up, needle hunting and all transitions.

## Voice

Plain verbs, sentence case, no filler. Errors say what happened and what to do next, without apologizing. Every metric gets a one-line explanation and a "What's this?" popover.

## Accessibility rules

- Visible focus: 2px `--signal` outline with 2px offset on every interactive element.
- Status and errors announced with `aria-live`.
- Every gauge exposes its value as text (`role="img"` with an `aria-label`, plus the visible numeral).
- Minimum hit target 40px for primary controls.
- No information by color alone.
