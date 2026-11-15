# MVP integration QA

Executed in the integration workspace:

- `python -m unittest discover -s tests -v`: 16 tests passed (root integration run).
- `node --test frontend/tests/data.test.mjs`: 15 tests passed, 0 failed.
- Contract checks cover both unchanged NASA datasets, finite observations/fit,
  location/unit identity, year order and counts, 30-year policy, missing-data and
  suppressed-fit behavior. Numerical pipeline tests independently check annual
  aggregation and OLS against the cached responses.

## Browser verification limitation

Actual Playwright launch was attempted with installed system Chromium. The
browser terminated before page creation:
`FATAL:chrome/browser/process_singleton_posix.cc:297 ... socket() failed: Operation not permitted (1)`
followed by SIGABRT. Retrying direct Chromium with no-zygote/single-process flags
produced the same error. No browser screenshots, rendered responsive checks,
keyboard walkthrough or browser end-to-end pass are claimed.

## Technical Lead release checks

- Confirm automatic Python and frontend CI are green on the final PR head.
- Open the production build locally; at 360px and desktop widths confirm no
  horizontal page overflow and readable chart labels.
- Use keyboard only to change location and open source/method details.
- Switch Hanoi/Can Tho; chart, statistics, label and provenance must update
  together. Confirm no stale data flashes while loading.
- Check missing JSON, malformed JSON and below-threshold data states; fit outputs
  must remain hidden when suppressed, while observations/exclusions stay visible.
- Review NASA attribution, requested versus returned geometry and exploratory
  p-value/autocorrelation caveat. Approve deployment separately.

## Static accessibility/science inspection

The source provides a labelled native location selector, visible keyboard focus,
a skip link, SVG title/description, accessible annual-value table, live loading
announcements, alert errors and keyboard-operable native disclosure elements.
The fit is dashed as well as a different color. Annual observation paths split
at excluded years. Chart fit values use the supplied intercept and annual slope;
statistics use the supplied scientific outputs. Layout source includes mobile
breakpoints. These source checks do not substitute for rendered browser QA.

Final integration run: Vite 6.4.6 production build passed (25 modules).
A local Vite preview smoke served `/`, `/data/hanoi.json` and
`/data/can-tho.json` with HTTP 200. Both JSON responses matched canonical
processed inputs byte for byte. `git diff --check` passed.
