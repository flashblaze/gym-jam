export function LogoMark({ size = 32 }: { size?: number }) {
  const r = Math.round(size * 0.27);
  return (
    <div
      className="flex items-center justify-center shrink-0 bg-verdio-600"
      style={{
        width: size,
        height: size,
        borderRadius: r,
      }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.5}
        viewBox="0 0 18 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M1.5 1L9 12.5L16.5 1H14L9 9.5L4 1H1.5Z" fill="white" />
      </svg>
    </div>
  );
}
