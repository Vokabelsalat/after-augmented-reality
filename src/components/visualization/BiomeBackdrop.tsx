import type { CSSProperties } from "react";

export function BiomeBackdrop({
  progress = 0.38,
  quiet = false,
}: {
  progress?: number;
  quiet?: boolean;
}) {
  return (
    <div
      className={`biome-water pointer-events-none absolute inset-0 ${quiet ? "biome-water-quiet" : ""}`}
      style={{ "--tank-progress": progress } as CSSProperties}
      aria-hidden="true"
    >
      <span className="biome-current biome-current-one" />
      <span className="biome-current biome-current-two" />
      <span className="biome-current biome-current-three" />
      <span className="biome-floor" />
      <span className="biome-caustic biome-caustic-one" />
      <span className="biome-caustic biome-caustic-two" />
      <span className="biome-caustic biome-caustic-three" />
      <span className="biome-bloom biome-bloom-one" />
      <span className="biome-bloom biome-bloom-two" />
      <div className="biome-snow">
        {Array.from({ length: 28 }, (_, index) => (
          <i
            key={index}
            style={{
              "--snow-x": `${(index * 37) % 101}%`,
              "--snow-delay": `${-(index % 11) * 1.7}s`,
              "--snow-duration": `${12 + (index % 9) * 2}s`,
              "--snow-size": `${1 + (index % 3)}px`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
