# ADR 0003 — Leaflet (+ leaflet-geoman) over MapLibre GL

**Status.** Accepted — 2026-04-22. Owner's preference.

## Context

Two plausible mapping stacks:

1. **Leaflet + leaflet-geoman** — raster-first, DOM-based rendering,
   huge plugin ecosystem, leaflet-geoman is a first-class
   drawing/editing toolkit ("the most powerful leaflet plugin for
   drawing and editing geometry layers").
2. **MapLibre GL JS** — open-source fork of Mapbox GL, WebGL-based,
   richer styling, better for dense vector data (10k+ features),
   but its drawing/editing ecosystem (Mapbox GL Draw) is less
   polished than geoman.

## Decision

**Leaflet + leaflet-geoman**, as requested by the developer in this
planning session.

## Consequences

- **Positive.**
  - Vaggelis can draw/edit region polygons through a best-in-class
    UI in the admin — this is the single most important admin
    interaction and geoman is the tool of record.
  - Leaflet's plugin ecosystem (Leaflet.markercluster,
    Leaflet.VectorGrid, Leaflet.heat) covers every likely extension.
  - The public viewer load is modest — a few dozen region polygons
    + a few thousand villages. Within Leaflet's comfort zone when
    clustered.
- **Negative.**
  - Rendering is DOM/SVG/Canvas, not WebGL — heavier on CPU at
    scale. If village count turns out huge (>10k), we fall back to
    Leaflet.VectorGrid with MVT tiles from PostGIS (see §6.2 of
    [02-architecture.md](../02-architecture.md)).
  - Styling is less flexible than MapLibre's declarative style
    spec. We'll hand-style layers in JS and accept the verbosity.

## Alternatives rejected

- **MapLibre GL + terra-draw.** Re-evaluated April 2026:
  [terra-draw](https://terradraw.io/) v1.28 with the
  [maplibre-gl-terradraw](https://maplibre.org/maplibre-gl-js/docs/examples/draw-geometries-with-terra-draw/)
  adapter has matured into a credible drawing stack — single-line
  `map.addControl`, self-intersection validation, modes for point /
  line / polygon / rectangle / circle. It would win on rendering
  performance and style expressiveness. We'd reconsider only if
  village density rises above ~15 k points and Leaflet
  clustering degrades — not our current projection.
  leaflet-geoman remains more polished on precision vertex editing,
  snapping, autotrace, and measuring — the ergonomics Vaggelis
  needs as a non-developer.
- **mapbox-gl-draw on MapLibre.** Effectively unmaintained on the
  MapLibre fork; replaced by terra-draw in the ecosystem.
- **deck.gl on Leaflet/MapLibre.** Overkill for our data volumes.

## References

- [leaflet-geoman](https://geoman.io/)
- [Leaflet.VectorGrid](https://github.com/Leaflet/Leaflet.VectorGrid)
- [Terra Draw](https://terradraw.io/)
- [MapLibre + terra-draw example](https://maplibre.org/maplibre-gl-js/docs/examples/draw-geometries-with-terra-draw/)
- [Self-host Maps with Protomaps and Supabase Storage](https://supabase.com/blog/self-host-maps-storage-protomaps) — PMTiles alternative we'd keep in reserve
