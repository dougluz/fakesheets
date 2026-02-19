import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const grid = [0, 1, 2];
  const cellSize = 7;
  const gap = 2;
  const offset = 4;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#0F172A",
          borderRadius: "6px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${gap}px`,
          }}
        >
          {grid.map((row) => (
            <div
              key={row}
              style={{ display: "flex", gap: `${gap}px` }}
            >
              {grid.map((col) => (
                <div
                  key={col}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor:
                      row === 0 ? "#1D4ED8" : col === 0 ? "#2563EB" : "#3B82F6",
                    borderRadius: "1px",
                    opacity: row === 0 || col === 0 ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
