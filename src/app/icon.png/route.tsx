import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 112,
          background: "linear-gradient(145deg, #10152d, #07131e)",
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 150,
            background: "linear-gradient(135deg, #7b2ff7, #00d4ff 65%, #ff2e97)",
          }}
        >
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: 100,
              background: "#0a0a1a",
              border: "12px solid rgba(255,255,255,0.8)",
            }}
          />
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}