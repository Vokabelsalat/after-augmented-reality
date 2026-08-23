type GeneratedNarrativeProps = {
  lines: string[];
};

export function GeneratedNarrative({ lines }: GeneratedNarrativeProps) {
  return (
    <div className="font-display text-[clamp(1.55rem,7vw,2.25rem)] leading-[1.22] tracking-[-0.025em] text-[#F3F0E8]">
      {lines.map((line, index) => (
        <p
          key={`${index}-${line}`}
          className={index === 0 || index === lines.length - 1 ? "mt-0 mb-5" : "my-1"}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
