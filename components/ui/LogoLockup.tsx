interface LogoLockupProps {
  size?: "sm" | "md" | "lg";
  inverse?: boolean;
}

const sizes = {
  sm: { h: 26, text: "text-[16px]" },
  md: { h: 32, text: "text-[20px]" },
  lg: { h: 40, text: "text-[26px]" },
};

export function LogoLockup({ size = "md", inverse = false }: LogoLockupProps) {
  const { h, text } = sizes[size];
  const color    = inverse ? "#F5EFE0" : "#3E2B1F";
  const eyeWhite = inverse ? "#3E2B1F" : "#FAF5E8";
  const w = Math.round(h * 0.9);

  return (
    <div className="flex items-center gap-2">
      {/* Hat mascot */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 46 50"
        fill="none"
        aria-hidden="true"
      >
        {/* Brim */}
        <ellipse cx="23" cy="38" rx="23" ry="7" fill={color} />
        {/* Crown */}
        <path
          d="M7 37 C6 18 12 4 23 4 C34 4 40 18 39 37 Z"
          fill={color}
        />
        {/* Left eye — white */}
        <ellipse cx="16.5" cy="27" rx="4.8" ry="5.8" fill={eyeWhite} />
        {/* Right eye — white */}
        <ellipse cx="29.5" cy="27" rx="4.8" ry="5.8" fill={eyeWhite} />
        {/* Left pupil */}
        <ellipse cx="16.5" cy="28.2" rx="2.8" ry="3.4" fill={color} />
        {/* Right pupil */}
        <ellipse cx="29.5" cy="28.2" rx="2.8" ry="3.4" fill={color} />
      </svg>

      {/* Wordmark */}
      <span
        className={`font-display font-bold leading-none ${text}`}
        style={{ color, letterSpacing: "-0.03em" }}
      >
        WearHub
      </span>
    </div>
  );
}
