import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { targetBundleVersion } from "@/data/targetBundle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves public/targets/exhibition.mind. MindAR's bundle is msgpack, which
// neither Next nor Caddy compresses by default, so the precompressed copies
// written by `npm run targets:compile` are served here instead. Under the
// current ?v= hash the response is immutable and browsers keep it cached.
const directory = join(process.cwd(), "public/targets");
const variants = [
  { encoding: "br", file: "exhibition.mind.br" },
  { encoding: "gzip", file: "exhibition.mind.gz" },
  { encoding: null, file: "exhibition.mind" },
] as const;
const cachedFiles = new Map<string, Promise<Buffer>>();

function acceptedEncodings(request: Request) {
  return new Set(
    (request.headers.get("accept-encoding") ?? "")
      .split(",")
      .map((entry) => entry.trim().split(";"))
      .filter(([, quality]) => quality?.trim() !== "q=0")
      .map(([token]) => token.toLowerCase()),
  );
}

async function bundleResponse(request: Request, withBody: boolean) {
  const accepted = acceptedEncodings(request);
  const variant = variants.find(({ encoding }) => encoding === null || accepted.has(encoding))!;
  let body: Buffer;
  try {
    if (!cachedFiles.has(variant.file)) {
      cachedFiles.set(variant.file, readFile(join(directory, variant.file)));
    }
    body = await cachedFiles.get(variant.file)!;
  } catch {
    cachedFiles.delete(variant.file);
    return new Response("Compiled MindAR targets are missing.", { status: 404 });
  }

  const versioned = new URL(request.url).searchParams.get("v") === targetBundleVersion;
  const headers = new Headers({
    "Content-Type": "application/octet-stream",
    "Content-Length": String(body.length),
    "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "no-cache",
    Vary: "Accept-Encoding",
  });
  if (variant.encoding) headers.set("Content-Encoding", variant.encoding);
  return new Response(withBody ? new Uint8Array(body) : null, { headers });
}

export function GET(request: Request) {
  return bundleResponse(request, true);
}

export function HEAD(request: Request) {
  return bundleResponse(request, false);
}
