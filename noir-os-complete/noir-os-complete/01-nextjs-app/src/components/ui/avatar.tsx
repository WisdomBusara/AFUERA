export function Avatar({
  name,
  initials,
  color,
  size = 24,
}: {
  name?: string;
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      title={name}
      className="grid place-items-center rounded-full font-semibold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42, boxShadow: "0 1px 2px rgba(16,18,29,.15)" }}
    >
      {initials}
    </div>
  );
}
