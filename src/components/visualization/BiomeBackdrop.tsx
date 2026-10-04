import type { CSSProperties } from "react";

export function BiomeBackdrop({
  progress = 0.38,
  quiet = false,
  surfaceRays = false,
}: {
  progress?: number;
  quiet?: boolean;
  surfaceRays?: boolean;
}) {
  return (
    <div
      className={`biome-water pointer-events-none absolute inset-0 ${quiet ? "biome-water-quiet" : ""}`}
      style={{ "--tank-progress": progress } as CSSProperties}
      aria-hidden="true"
    >
      {surfaceRays ? (
        <div className="biome-sunlight" aria-hidden="true">
          <span className="biome-waterline" />
          <span className="biome-sunray biome-sunray-one" />
          <span className="biome-sunray biome-sunray-two" />
          <span className="biome-sunray biome-sunray-three" />
          <span className="biome-sunray biome-sunray-four" />
          <span className="biome-sunray biome-sunray-five" />
          <span className="biome-sunray biome-sunray-six" />
          <span className="biome-sunray biome-sunray-seven" />
          <span className="biome-sunray biome-sunray-eight" />
          <span className="biome-surface-glimmer" />
        </div>
      ) : null}
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
