import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Fakesheets — Fake Spreadsheet Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEADERS = ["first_name", "email", "company", "country"];
const ROWS = [
  ["Alice", "alice@example.com", "Acme Corp", "United States"],
  ["Bruno", "bruno@email.io", "TechFlow Ltd", "Brazil"],
  ["Carla", "carla@domain.dev", "NextGen Inc", "Germany"],
  ["David", "david@mail.net", "Globex LLC", "Canada"],
  ["Elena", "elena@corp.co", "Initech SA", "France"],
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#0F172A",
          padding: "40px",
          gap: "32px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left panel — spreadsheet preview */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            backgroundColor: "#1E293B",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #334155",
          }}
        >
          {/* Window chrome */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              backgroundColor: "#0F172A",
              borderBottom: "1px solid #334155",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#EF4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#F59E0B" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#22C55E" }} />
            <div
              style={{
                marginLeft: "12px",
                fontSize: "13px",
                color: "#64748B",
                fontFamily: "monospace",
              }}
            >
              fakesheets-1234567890.csv
            </div>
          </div>

          {/* Header row */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#1D4ED8",
              padding: "10px 16px",
              gap: "0px",
            }}
          >
            {HEADERS.map((h) => (
              <div
                key={h}
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  fontFamily: "monospace",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {ROWS.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                padding: "9px 16px",
                backgroundColor: i % 2 === 0 ? "#1E293B" : "#162032",
                borderBottom: "1px solid #1E3A5F",
              }}
            >
              {row.map((cell, j) => (
                <div
                  key={j}
                  style={{
                    flex: 1,
                    fontSize: "12px",
                    color: "#94A3B8",
                    fontFamily: "monospace",
                  }}
                >
                  {cell}
                </div>
              ))}
            </div>
          ))}

          {/* Ellipsis row */}
          <div
            style={{
              display: "flex",
              padding: "9px 16px",
              borderTop: "1px solid #334155",
              marginTop: "auto",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#475569",
                fontFamily: "monospace",
                fontStyle: "italic",
              }}
            >
              … 999,995 more rows
            </div>
          </div>
        </div>

        {/* Right column — branding */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "340px",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          {/* Label */}
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#3B82F6",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            FAKESHEETS
          </div>

          {/* Heading */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#F1F5F9",
              lineHeight: 1.2,
            }}
          >
            Fake Spreadsheet Generator
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#1D4ED8",
              borderRadius: "20px",
              padding: "6px 16px",
              width: "fit-content",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
              Up to 1,000,000 rows
            </div>
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              "CSV & XLSX export",
              "12 column types",
              "Shareable URLs",
              "100% client-side",
            ].map((feature) => (
              <div
                key={feature}
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#1D4ED8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>
                <div style={{ fontSize: "15px", color: "#CBD5E1" }}>{feature}</div>
              </div>
            ))}
          </div>

          {/* Domain footer */}
          <div
            style={{
              marginTop: "auto",
              fontSize: "13px",
              color: "#475569",
            }}
          >
            fakesheets.douglasluz.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
