# After Augmented Reality

**After Augmented Reality** is a mobile-first AR exhibition prototype about extending digital narratives. A visitor scans physical works; particles detach from each work, resolve into accessible exhibition content, and join a persistent personal constellation. The final screen turns the ordered path into a deterministic short poem.

The complete prototype loop works without a camera through the built-in simulator. Real image tracking uses MindAR through a narrow adapter and can be enabled by adding one compiled target bundle.

## Setup

Use a current Node.js release (Node 20 or newer; this repository was verified on Node 24).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Tap **Start experience**. Camera access is never requested until the separate **Start camera** action.

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

- **Poster 1**, **Poster 2**, and **Poster 3** — send the same semantic artifact event as a MindAR detection;
- **Reset journey** — clears the current Redux journey and its persisted record;
- **Finish journey** — opens the final constellation and generated narrative;
- **Hide** — reveals the camera interface; the no-camera simulator can be reopened from there.

The simulator is also offered as an accessible fallback whenever the real scanner is idle or fails. It does not maintain a second experience path: both inputs end at `handleArtifactDetected(artifactId)` in `ExhibitionExperience`.

Suggested acceptance path:

1. Start the experience.
2. Tap Poster 1 and watch the attached → release → formation → content handoff.
3. Continue scanning and repeat with Posters 2 and 3.
4. Open **My Journey** after any scan to see the constellation change.
5. Finish the reading, then reload to confirm persistence.

## Real AR testing

### 1. Add exact poster reference images

Add the final print artwork as high-quality JPG or PNG files in `public/images/`. Target images must be visually identical to the physical posters. Images with detailed, non-repeating texture track better than flat typography or large empty regions.

### 2. Compile a MindAR bundle

Open the [MindAR image target compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/), add the images in this exact order, compile, and export the bundle:

1. `poster-0.jpeg` → target index `0`
2. `poster-1.jpeg` → target index `1`
3. `poster-2.jpeg` → target index `2`

Save the downloaded file as:

```text
public/targets/exhibition.mind
```

The repository deliberately does not include a fake `.mind` file. An invalid placeholder would make scanner errors harder to diagnose; simulator mode remains fully functional until the real exhibition artwork exists.

### 3. Check the configuration mapping

`src/data/artifacts.ts` is the source of truth. `targetIndex` must match the image order used by the compiler. MindAR emits a number, the adapter forwards it, and `artifactByTargetIndex` resolves the exhibition content.

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
4. Replace `public/targets/exhibition.mind` and test both the simulator button (add one if moving beyond the three-target prototype) and the physical target.

Artifact content, target mapping, particles, persistence, constellation encoding, and narrative generation all read configuration data; no individual reveal component needs exhibition-specific logic.

## Persistence

The localStorage key is `say-hi:journey:v1`. It stores only session ID, start time, artifact IDs, discovery order, and timestamps. Hydration validates malformed data before handing it to Redux. **Start again** or the development reset returns to a clean intro state.

## Known prototype limitations

- Real tracking cannot be demonstrated until `public/targets/exhibition.mind` is compiled from the actual physical poster artwork.
- The current AR-first experiment retains the last valid particle pose when tracking is lost and realigns it when the poster is reacquired. Because MindAR image tracking is not world-tracking/SLAM, that frozen pose cannot remain physically registered if the camera moves significantly while the poster is outside the frame.
- Detection has been architected for Safari/Chrome lifecycle constraints, but final tracking quality and filter tuning must be validated against the actual prints and exhibition lighting.
- The poem is template-based and English-only. It varies by first/last work, intermediate order, narrative vocabulary, count, and repeated themes, but it is not an LLM.
- Prototype persistence is device/browser-local and has no account sync.
