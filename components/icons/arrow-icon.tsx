interface ArrowIconProps {
  dir?: "up" | "down" | "left" | "right";
  size?: number;
}

const ROTATION: Record<NonNullable<ArrowIconProps["dir"]>, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: -90,
};

export function ArrowIcon({ dir = "up", size = 15 }: ArrowIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: `rotate(${ROTATION[dir]}deg)` }}
      aria-hidden="true"
    >
      <path
        d="M12 4v16M6 10l6-6 6 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ArrowIcon;
