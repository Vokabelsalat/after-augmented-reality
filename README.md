# After Augmented Reality

**After Augmented Reality** is a mobile-first AR exhibition prototype about extending digital narratives. A visitor scans physical works; particles detach from each work, resolve into accessible exhibition content, and join a persistent personal constellation. The final screen turns the ordered path into a deterministic short poem.

The complete prototype loop works without a camera through the built-in simulator. Real image tracking uses MindAR through a narrow adapter and can be enabled by adding one compiled target bundle.

## Setup

Use a current Node.js release (Node 20 or newer; this repository was verified on Node 24).

```bash
npm install
npm run dev
```

Open [http://localhost:3066](http://localhost:3066). Tap **Start experience**. Camera access is never requested until the separate **Start camera** action.

### Visualization design

All visitor-path visualizations are selected through one environment variable:

```bash
NEXT_PUBLIC_VISUALIZATION_DESIGN=fish
```

Supported values are:

- `constellation` — the node-link particle design from `main`;
- `creature` — the assembled upright form from `new_form`;
- `fish` — the articulated swimming design from `fishies` (the default).

Copy `.env.example` to `.env.local`, choose one value, and restart the development server after changing it. The setting controls reveal animations, journey views, navigation miniatures, collective-field glyphs, arrival focus, and recent contributions. All modes use the same contribution API and stored `parts` data, so changing the design does not require a database migration.

Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

MindAR 1.2.5 declares the old native `canvas@2` package for its Node-based compiler tooling. This project overrides that compiler-only dependency to `canvas@3.2.3`, which installs on Node 24. Browser tracking does not use `canvas`. A small dependency-free `postinstall` patch also updates MindAR's browser build from Three.js's removed `sRGBEncoding` API to `SRGBColorSpace` and removes a statically analyzed Node-only `fs` branch. The patch is intentionally narrow, repeatable, and guarded against unexpected upstream changes.

The development and production scripts use Next.js's supported webpack mode. With MindAR's large prebundled TensorFlow module and Node 24, webpack currently provides the most repeatable client-only split across local and restricted build environments.

## Development simulation

In `npm run dev`, the simulator controls appear automatically at the bottom of the scanner. They provide:

- the numbered artwork buttons — send the same semantic artifact event as a MindAR detection and expose every work from `public/exhibition.csv`;
- **Reset journey** — clears the current Redux journey and its persisted record;
- **Finish journey** — opens the final constellation and generated narrative;
- **Hide** — reveals the camera interface; the no-camera simulator can be reopened from there.

The simulator is also offered as an accessible fallback whenever the real scanner is idle or fails. It does not maintain a second experience path: both inputs end at `handleArtifactDetected(artifactId)` in `ExhibitionExperience`.

Suggested acceptance path:

1. Start the experience.
2. Tap the first artwork and watch the attached → release → formation → content handoff.
3. Continue scanning and repeat with other works.
4. Open **My Journey** after any scan to see the constellation change.
5. Finish the reading, then reload to confirm persistence.
6. Tap **Share with the exhibition**, then open [http://localhost:3066/collective](http://localhost:3066/collective) on the wall display.

## Shared exhibition screen

The finished-story screen can send a visitor's anonymous journey to the server. The submission contains only the journey session ID, completion time, and ordered artifact IDs with their scan timestamps. The server validates those values, regenerates the canonical narrative, attaches the configured glyph themes and colors, calculates each artifact's dwell time, and stores the result in SQLite.

Dwell time runs from an artifact's first scan until the next new artifact is scanned. The final artifact runs until the visitor finishes the story. On the collective screen, longer dwell times produce larger colored nodes. Sizing combines a bounded logarithmic absolute scale with relative contrast inside each story, making modest timing differences visible without allowing an unusually long visit to overwhelm the composition. Previously stored stories without timing data retain the original neutral node size.

Open `/collective` full-screen on the exhibition display. It polls the live contribution feed every 2.5 seconds. Each new story expands into focus, displays its narrative, then contracts into an abstract constellation and joins up to 60 other drifting contributions. Initial history appears directly as the ambient field, so restarting the display does not replay every old story.

The default database file is `data/exhibition.sqlite` and is ignored by Git. Set `EXHIBITION_DATABASE_PATH` to an absolute persistent volume path in production. Run one server instance against that volume; for horizontal scaling, replace the small database helper with a managed shared SQL store while preserving the API contract.

The server endpoints are:

- `POST /api/contributions` — validate and store a completed journey; duplicate session IDs are idempotent.
- `GET /api/contributions?after=<id>&limit=<n>` — return ordered contributions for the wall feed.

## Real AR testing

### 1. Add exact poster reference images

Add the final print artwork as high-quality JPG or PNG files in `public/images/`. Target images must be visually identical to the physical posters. Images with detailed, non-repeating texture track better than flat typography or large empty regions.

### 2. Compile a MindAR bundle

Open the [MindAR image target compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/), add the images in this exact order, compile, and export the bundle:

Compile the final artwork images in the same order as `public/exhibition.csv`. The current configuration assigns target indices `0` through `12`, from **Finding Frida** through **Goliath**.

Save the downloaded file as:

```text
public/targets/exhibition.mind
```

The repository deliberately does not include a fake `.mind` file. An invalid placeholder would make scanner errors harder to diagnose; simulator mode remains fully functional until the real exhibition artwork exists.

### 3. Check the configuration mapping

`src/data/artifacts.ts` is the runtime source of truth and follows the CSV row order. `targetIndex` must match the image order used by the compiler. MindAR emits a number, the adapter forwards it, and `artifactByTargetIndex` resolves the exhibition content. The curatorial themes are **Memory**, **Interface**, **Worldmaking**, **Embodiment**, and **Agency**. Until final artwork images are available, a separate `particleForm` field lets the 13 works reuse the existing memory, machine, and body images, colors, and formations without reducing their themes to those three visual placeholders.

### 4. Serve over HTTPS on a phone

Camera APIs require a secure context. `localhost` is treated as secure on the development computer, but a phone visiting a plain `http://192.168.x.x:3000` address is not. Use an HTTPS-capable local proxy/tunnel or deploy a preview build over HTTPS, then:

1. open the HTTPS URL in iPhone Safari or Android Chrome;
2. tap **Start experience**, then **Start camera**;
3. allow camera permission;
4. hold a compiled poster in view and move slowly while it locks on.

When the page is hidden, the prototype stops MindAR and releases the camera. Tap the restart control after returning.

## Architecture

```text
MindAR native Three.js tracker
          ↓ targetIndex
semantic adapter callback
          ↓ artifactId
Redux journey state + localStorage
          ↓
tracked AR particle volume + React content
          ↓
persistent particle constellation
          ↓
deterministic narrative generator
          ↓ share
validated contribution API + SQLite
          ↓ live feed
collective wall field
```

- `src/components/ar/MindARAdapter.ts` is the only application module that imports MindAR. It owns camera startup, anchors, its renderer loop, repeated-target gating, and disposal.
- `src/components/ar/ARScanner.tsx` dynamically imports the adapter only after the user taps **Start camera**. No MindAR or camera code runs during SSR.
- `src/store/journeySlice.ts` contains only serializable application state. Three.js scenes, anchors, buffers, cameras, and DOM nodes remain local.
- `src/lib/animation/revealMachine.ts` centralizes reveal phase timings. Real and simulated detections both use the R3F full-screen source, release, disappearance, and theme-formation sequence. Real detections then hand the same deterministic formation positions to a target-anchored MindAR point cloud. Neither path updates React or Redux each frame.
- `src/components/particles/JourneyConstellation.tsx` builds one point cloud and one chronological line geometry, keeping draw calls low.
- `src/lib/narrative/generateJourneyNarrative.ts` is pure and deterministic, so an external generator can replace it later without changing the view.

### MindAR / R3F bridge

The prototype uses the reliability-first handoff described in the brief:

1. MindAR owns its native Three.js tracking scene.
2. R3F plays the cinematic screen-space release: particles fill the view, disappear, and reform as the artifact's memory, machine, or body shape.
3. `onTargetFound(targetIndex)` crosses the boundary as a plain number.
4. The formation positions are shared as typed arrays, not tracking objects. At the content handoff, MindAR renders that shape as a separate `THREE.Points` group above the target. It follows the anchor while tracking is active and retains its last valid pose through brief tracking interruptions.
5. A normal HTML article sheet resolves over the lower part of the camera view. Pressing **Continue scanning** explicitly removes the anchored cluster.

MindAR transforms, cameras, and render loops are not shared with the R3F renderer. Only deterministic particle formation arrays cross the visual handoff, avoiding synchronized cameras or matrices across two scene owners on mobile Safari. R3F also owns the persistent journey constellation.

## Add another poster or artifact

1. Add a typed entry to `src/data/artifacts.ts`, including a unique `id`, the next `targetIndex`, its matching `posterImageSrc`, theme, color, content, and narrative words.
2. Add or adjust its theme definition in `src/data/themes.ts` if necessary.
3. Recompile **all** reference images into `exhibition.mind` in the same order as the configured indices.
4. Replace `public/targets/exhibition.mind` and test both the simulator button and the physical target.

Artifact content, target mapping, particles, persistence, constellation encoding, and narrative generation all read configuration data; no individual reveal component needs exhibition-specific logic.

## Persistence

The localStorage key is `say-hi:journey:v1`. It stores only session ID, start and completion times, artifact IDs, discovery order, and scan timestamps. Hydration validates malformed data before handing it to Redux. **Start again** or the development reset returns to a clean intro state. Shared journeys are separate, anonymous server records; resetting the phone does not remove a story already shared with the exhibition.

## Known prototype limitations

- Real tracking cannot be demonstrated until `public/targets/exhibition.mind` is compiled from the actual physical poster artwork.
- The current AR-first experiment retains the last valid particle pose when tracking is lost and realigns it when the poster is reacquired. Because MindAR image tracking is not world-tracking/SLAM, that frozen pose cannot remain physically registered if the camera moves significantly while the poster is outside the frame.
- Detection has been architected for Safari/Chrome lifecycle constraints, but final tracking quality and filter tuning must be validated against the actual prints and exhibition lighting.
- The poem is template-based and English-only. It varies by first/last work, intermediate order, narrative vocabulary, count, and repeated themes, but it is not an LLM.
- Personal in-progress journeys remain device/browser-local and have no account sync. Only an explicit share sends the completed path to the server.
