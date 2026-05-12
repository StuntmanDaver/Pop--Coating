import { readFile } from "fs/promises";
import { join } from "path";

import { ImageResponse } from "next/og";

export const OG_ALT = "Pop's Industrial Coatings — Premium industrial finishing, Lakeland FL";
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const INTER_WOFF = [
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-400-normal.woff",
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-600-normal.woff",
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.woff",
] as const;

async function logoDataUrl(): Promise<string> {
  const paths = [
    join(
      /* turbopackIgnore: true */
      process.cwd(),
      "public",
      "images",
      "pops-logo-primary.png",
    ),
    join(
      /* turbopackIgnore: true */
      process.cwd(),
      "apps",
      "pops-website",
      "public",
      "images",
      "pops-logo-primary.png",
    ),
  ];
  for (const logoPath of paths) {
    try {
      const buf = await readFile(logoPath);
      return `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      /* try next candidate */
    }
  }
  throw new Error("OG share card: logo asset not found under public/images");
}

type OgFont = {
  name: "Inter";
  data: ArrayBuffer;
  style: "normal";
  weight: 400 | 600 | 700;
};

const INTER_ENTRIES: ReadonlyArray<{ url: string; weight: 400 | 600 | 700 }> = [
  { url: INTER_WOFF[0], weight: 400 },
  { url: INTER_WOFF[1], weight: 600 },
  { url: INTER_WOFF[2], weight: 700 },
];

async function loadInterFonts(): Promise<OgFont[]> {
  const fonts: OgFont[] = [];
  for (const { url, weight } of INTER_ENTRIES) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.arrayBuffer();
      fonts.push({
        name: "Inter",
        data,
        style: "normal",
        weight,
      });
    } catch {
      /* optional fonts */
    }
  }
  return fonts;
}

/** Cinematic OG / Twitter card — static raster for link previews (iMessage, Slack, etc.). */
export async function createShareImageResponse(): Promise<ImageResponse> {
  const [logoSrc, fonts] = await Promise.all([logoDataUrl(), loadInterFonts()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(152deg, #020202 0%, #0a0a0a 38%, #060606 68%, #030303 100%)",
        }}
      >
        {/* Ambient gold wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 95% 70% at 50% -8%, rgba(254, 205, 8, 0.22), transparent 58%), radial-gradient(ellipse 55% 45% at 100% 100%, rgba(254, 205, 8, 0.08), transparent 52%), radial-gradient(ellipse 40% 35% at 0% 85%, rgba(254, 205, 8, 0.06), transparent 50%)",
            display: "flex",
          }}
        />

        {/* Outer frame */}
        <div
          style={{
            margin: 44,
            flex: 1,
            display: "flex",
            borderRadius: 28,
            border: "1px solid rgba(254, 205, 8, 0.26)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 120px rgba(0,0,0,0.65), 0 0 100px rgba(254,205,8,0.09)",
            background:
              "linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 22%, transparent 55%), linear-gradient(180deg, rgba(17,17,17,0.85), rgba(8,8,8,0.92))",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top highlight */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "12%",
              right: "12%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(254,205,8,0.45), transparent)",
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flex: 1,
              padding: "52px 56px 48px",
              gap: 48,
              alignItems: "stretch",
            }}
          >
            {/* Logo column */}
            <div
              style={{
                width: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src={logoSrc}
                alt=""
                height={188}
                width={260}
                style={{
                  height: 188,
                  width: 260,
                  objectFit: "contain",
                  objectPosition: "center",
                  filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.5))",
                }}
              />
            </div>

            {/* Copy column */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.length ? "Inter" : "system-ui",
                  fontSize: 54,
                  fontWeight: 700,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.05,
                  color: "#ffffff",
                  marginBottom: 22,
                }}
              >
                Pop&apos;s Industrial Coatings
              </div>
              <div
                style={{
                  fontFamily: fonts.length ? "Inter" : "system-ui",
                  fontSize: 26,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: "rgba(236, 238, 242, 0.78)",
                  maxWidth: 620,
                }}
              >
                Premium powder coating, wet paint &amp; abrasive blasting for mission-critical
                parts — family-owned in Lakeland, Florida since 1972.
              </div>

              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 40,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid rgba(254, 205, 8, 0.14)",
                  paddingBottom: 4,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.length ? "Inter" : "system-ui",
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: "rgba(254, 205, 8, 0.95)",
                  }}
                >
                  popsindustrial.com
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: fonts.length ? "Inter" : "system-ui",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#fecd08",
                  }}
                >
                  Request a quote
                  <span style={{ fontSize: 30, lineHeight: 1 }}>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts:
        fonts.length > 0
          ? fonts.map((f) => ({
              name: f.name,
              data: f.data,
              style: f.style,
              weight: f.weight,
            }))
          : undefined,
    },
  );
}
