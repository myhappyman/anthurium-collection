import { createQrMatrix } from "@/lib/qr/qr-code";

type QrCodeProps = {
  value: string;
  label: string;
  size?: number;
};

export function QrCode({ value, label, size = 112 }: QrCodeProps) {
  const matrix = createQrMatrix(value);
  const quietZone = 4;
  const dimension = matrix.length + quietZone * 2;
  const path = matrix
    .flatMap((row, rowIndex) =>
      row.flatMap((isDark, columnIndex) =>
        isDark
          ? [`M${columnIndex + quietZone},${rowIndex + quietZone}h1v1h-1z`]
          : [],
      ),
    )
    .join("");

  return (
    <svg
      aria-label={label}
      className="qr-code"
      height={size}
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${dimension} ${dimension}`}
      width={size}
    >
      <rect fill="#fff" height={dimension} width={dimension} />
      <path d={path} fill="#111" />
    </svg>
  );
}
