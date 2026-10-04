# After Augmented Reality

**After Augmented Reality** is a mobile-first AR exhibition prototype about extending digital narratives. A visitor scans physical works; particles detach from each work, resolve into accessible exhibition content, and join a persistent personal constellation. The final screen turns the ordered path into a deterministic short poem.

The complete prototype loop works without a camera through the built-in simulator. Real image tracking uses MindAR through a narrow adapter and can be enabled by adding one compiled target bundle.

## Setup

Use a current Node.js release (Node 20 or newer; this repository was verified on Node 24).

```bash
npm install
npm run dev
```

Open [http://localhost:3066](http://localhost:3066). Tap **Scan an artwork marker** to enter the scanner and request camera access.

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

Use the **Time map** switch on the collective display to see cumulative dwell time for all 13 artwork stations. This view aggregates every stored contribution (not only the recent stories in the ambient field), ranks the stations by total attention, and shows visit count plus average dwell time. Missing timing data from older stories is excluded from the totals.

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
2. tap **Scan an artwork marker**;
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
- `src/components/ar/ARScanner.tsx` dynamically imports the adapter when the visitor enters the scanner. No MindAR or camera code runs during SSR.
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

## Production deployment on Ubuntu with Caddy

Run the application as one persistent Next.js Node process behind Caddy. This is not a static-export deployment: the contribution API and SQLite storage require the Node server runtime. Caddy terminates HTTPS, which is also required for camera access on visitor devices.

The commands below use:

- `/opt/after-augmented-reality` for the application checkout;
- `/var/lib/after-augmented-reality` for persistent SQLite data;
- `afterar` as the unprivileged service account;
- `127.0.0.1:3066` as the private Next.js listener.

Replace `exhibition.example.com` with the real public domain. Its DNS `A` and/or `AAAA` record must point to the Ubuntu server, and inbound ports 80 and 443 must be open.

### 1. Prepare the service account and directories

Install Node.js 20 or newer, then check the installed paths and versions:

```bash
node --version
npm --version
command -v npm
```

Create the account and directories:

```bash
sudo adduser \
  --system \
  --group \
  --home /opt/after-augmented-reality \
  afterar

sudo install -d \
  -o afterar \
  -g afterar \
  /opt/after-augmented-reality \
  /var/lib/after-augmented-reality
```

Clone or copy this repository into `/opt/after-augmented-reality`, then give the service account ownership:

```bash
sudo chown -R afterar:afterar /opt/after-augmented-reality
```

### 2. Add the production environment

Create a service environment file that is readable by the service account but not by other users:

```bash
sudo install \
  -m 0640 \
  -o root \
  -g afterar \
  /dev/null \
  /etc/after-augmented-reality.env

sudoedit /etc/after-augmented-reality.env
```

Add:

```ini
NODE_ENV=production
EXHIBITION_DATABASE_PATH=/var/lib/after-augmented-reality/exhibition.sqlite
NEXT_PUBLIC_VISUALIZATION_DESIGN=fish
```

`NEXT_PUBLIC_VISUALIZATION_DESIGN` must be set while running `npm run build`; Next.js embeds public environment variables into the client bundle. Change `fish` to `creature` or `constellation` before building if a different visualization is required.

### 3. Install dependencies and build on the server

```bash
sudo -u afterar sh -c '
  cd /opt/after-augmented-reality
  set -a
  . /etc/after-augmented-reality.env
  set +a
  npm ci
  npm run build
'
```

### 4. Run Next.js as a systemd service

Create `/etc/systemd/system/after-augmented-reality.service`:

```bash
sudoedit /etc/systemd/system/after-augmented-reality.service
```

Add:

```ini
[Unit]
Description=After Augmented Reality exhibition
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=afterar
Group=afterar
WorkingDirectory=/opt/after-augmented-reality
EnvironmentFile=/etc/after-augmented-reality.env

ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3066

Restart=on-failure
RestartSec=5
TimeoutStopSec=30
KillSignal=SIGTERM
UMask=0027

NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
```

If `command -v npm` did not report `/usr/bin/npm`, replace the path in `ExecStart` with the reported absolute path.

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now after-augmented-reality
sudo systemctl status after-augmented-reality
```

Check that Next.js is available only on the server's loopback interface:

```bash
curl -I http://127.0.0.1:3066
sudo journalctl -u after-augmented-reality -f
```

Do not expose port 3066 through the public firewall.

### 5. Install Caddy

Use the [official Caddy Debian/Ubuntu package](https://caddyserver.com/docs/install):

```bash
sudo apt install -y \
  debian-keyring \
  debian-archive-keyring \
  apt-transport-https \
  curl

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor \
  -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list

sudo chmod o+r \
  /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
  /etc/apt/sources.list.d/caddy-stable.list

sudo apt update
sudo apt install caddy
```

### 6. Configure HTTPS and the reverse proxy

Edit `/etc/caddy/Caddyfile`:

```bash
sudoedit /etc/caddy/Caddyfile
```

Add:

```caddyfile
exhibition.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3066
}
```

Caddy automatically obtains and renews the TLS certificate and redirects HTTP to HTTPS when the domain resolves to this server. Validate and reload the configuration:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

If UFW is enabled, allow HTTP and HTTPS through the packaged Caddy profile:

```bash
sudo ufw allow 'Caddy Full'
```

Verify the public endpoint:

```bash
curl -I https://exhibition.example.com
```

Useful production logs are available with:

```bash
sudo journalctl -u after-augmented-reality --since "10 minutes ago"
sudo journalctl -u caddy --since "10 minutes ago"
```

The submitted exhibition stories live in `/var/lib/after-augmented-reality/exhibition.sqlite`. Include that directory in the server backup plan; deploying a new application checkout must not replace it.

## Persistence

The localStorage key is `say-hi:journey:v1`. It stores only session ID, start and completion times, artifact IDs, discovery order, and scan timestamps. Hydration validates malformed data before handing it to Redux. **Start again** or the development reset returns to a clean intro state. Shared journeys are separate, anonymous server records; resetting the phone does not remove a story already shared with the exhibition.

## Known prototype limitations

- Real tracking cannot be demonstrated until `public/targets/exhibition.mind` is compiled from the actual physical poster artwork.
- The current AR-first experiment retains the last valid particle pose when tracking is lost and realigns it when the poster is reacquired. Because MindAR image tracking is not world-tracking/SLAM, that frozen pose cannot remain physically registered if the camera moves significantly while the poster is outside the frame.
- Detection has been architected for Safari/Chrome lifecycle constraints, but final tracking quality and filter tuning must be validated against the actual prints and exhibition lighting.
- The poem is template-based and English-only. It varies by first/last work, intermediate order, narrative vocabulary, count, and repeated themes, but it is not an LLM.
- Personal in-progress journeys remain device/browser-local and have no account sync. Only an explicit share sends the completed path to the server.
