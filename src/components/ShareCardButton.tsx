"use client";

export type ShareCardData = {
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
};

function draw(canvas: HTMLCanvasElement, data: ShareCardData) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = 600;
  const h = 800;
  canvas.width = w;
  canvas.height = h;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#03070f");
  bg.addColorStop(1, "#0a1a2e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, w - 32, h - 32);

  ctx.fillStyle = "#22d3ee";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("◆ ARISE", w / 2, 70);

  ctx.fillStyle = "#e5faff";
  ctx.font = "bold 40px sans-serif";
  wrapText(ctx, data.title, w / 2, 160, w - 80, 46);

  ctx.fillStyle = "#67e8f9";
  ctx.font = "20px sans-serif";
  ctx.fillText(data.subtitle, w / 2, 220);

  let y = 320;
  for (const stat of data.stats) {
    ctx.fillStyle = "rgba(34, 211, 238, 0.08)";
    ctx.fillRect(60, y - 36, w - 120, 64);
    ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(60, y - 36, w - 120, 64);

    ctx.fillStyle = "#9ae6f0";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(stat.label, 80, y - 8);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(stat.value, w - 80, y + 4);

    y += 84;
  }

  ctx.fillStyle = "rgba(103, 232, 249, 0.4)";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("arise.app", w / 2, h - 40);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  ctx.textAlign = "center";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, lineY);
}

export default function ShareCardButton({ data }: { data: ShareCardData }) {
  function handleDownload() {
    const canvas = document.createElement("canvas");
    draw(canvas, data);
    const link = document.createElement("a");
    link.download = `arise-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <button
      onClick={handleDownload}
      className="rounded-lg border border-primary-container/40 bg-primary-container/10 px-4 py-2 font-mono-label text-label-sm uppercase tracking-wider text-primary hover:bg-primary-container/20"
    >
      📤 Compartilhar
    </button>
  );
}
