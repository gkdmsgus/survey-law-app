import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params;
  const size = parseInt(sizeStr) || 192;
  const radius = Math.round(size * 0.2);
  const fontSize = Math.round(size * 0.5);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: fontSize,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        측
      </div>
    ),
    { width: size, height: size }
  );
}
