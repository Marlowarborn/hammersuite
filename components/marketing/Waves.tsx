"use client";

import { useEffect, useRef } from "react";

export default function Waves({ dark = false }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const waveColor = dark
      ? "rgba(255,255,255,0.04)"
      : "rgba(139,111,71,0.08)";
    const waveColor2 = dark
      ? "rgba(255,255,255,0.03)"
      : "rgba(139,111,71,0.05)";

    const drawWave = (
      amplitude: number,
      frequency: number,
      speed: number,
      yOffset: number,
      color: string,
      phase: number
    ) => {
      if (!ctx || !canvas) return;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x++) {
        const y =
          yOffset +
          Math.sin((x / canvas.width) * frequency * Math.PI * 2 + t * speed + phase) * amplitude +
          Math.sin((x / canvas.width) * frequency * 0.5 * Math.PI * 2 + t * speed * 0.7 + phase) * amplitude * 0.5;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const h = canvas.height;
      drawWave(60, 3, 0.3, h * 0.5, waveColor, 0);
      drawWave(50, 4, 0.4, h * 0.55, waveColor2, 1);
      drawWave(40, 5, 0.5, h * 0.6, waveColor, 2);
      drawWave(55, 2, 0.2, h * 0.45, waveColor2, 3);
      t += 0.01;
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [dark]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, background: dark ? "#0f0f0e" : "#faf9f7" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
