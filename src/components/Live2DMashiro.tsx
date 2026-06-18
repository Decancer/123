"use client";

import { useEffect, useRef, useState } from "react";

// 有模型配置后，用 group 名来切换动作
const MOTION_GROUPS = [
  "smile", "surprised", "angry", "cry", "sad",
  "serious", "thinking", "bye", "kandou", "kime",
  "uziuzi", "nf", "nnf",
];

function pickRandomGroup(exclude?: string): string {
  const pool = exclude
    ? MOTION_GROUPS.filter((g) => g !== exclude)
    : MOTION_GROUPS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function Live2DMashiro() {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    const w = window as Window & { Live2D?: unknown };

    function bootstrap() {
      initLive2D(container!).catch((e) => {
        console.error("Live2D 初始化失败:", e);
        setError(e instanceof Error ? e.message : "初始化失败");
      });
    }

    if (w.Live2D) {
      bootstrap();
      return;
    }

    // 手动注入 Cubism 2 核心脚本
    const script = document.createElement("script");
    script.src = "/live2d.min.js";
    script.async = false;
    script.onload = () => setTimeout(bootstrap, 0);
    script.onerror = () => {
      setError(
        "缺少 live2d.min.js。请从 Live2D 官网下载 Cubism 2.1 SDK for Web，" +
          "解压后将 lib/live2d.min.js 放到 public/ 目录"
      );
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-4 z-20 select-none pointer-events-auto"
      style={{ width: 300, height: 400 }}
      title="点我互动~"
    >
      {error && (
        <div className="flex h-full items-center justify-center rounded-xl bg-white/80 p-4 text-xs text-zinc-400 dark:bg-zinc-900/80">
          {error}
        </div>
      )}
    </div>
  );
}

async function initLive2D(container: HTMLDivElement) {
  const w = window as Window & { Live2D?: unknown };
  if (!w.Live2D) {
    throw new Error("Cubism 2 Core 未加载");
  }

  const [{ Application, Ticker }, { Live2DModel }] =
    await Promise.all([
      import("pixi.js"),
      import("pixi-live2d-display/cubism2"),
    ]);

  Live2DModel.registerTicker(Ticker as any);

  const canvasWidth = 300;
  const canvasHeight = 400;

  const app = new Application({
    backgroundAlpha: 0,
    width: canvasWidth,
    height: canvasHeight,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  container.innerHTML = "";
  container.appendChild(app.view as HTMLCanvasElement);

  const model = await Live2DModel.from(
    "/mashiro live2d/mashiro.model.json"
  );

  // 缩放到合适大小
  const modelBounds = model.getBounds();
  const scale =
    Math.min(
      canvasWidth / modelBounds.width,
      canvasHeight / modelBounds.height
    ) * 0.9;

  model.scale.set(scale);
  model.x = canvasWidth / 2;
  model.y = canvasHeight * 0.55;
  model.anchor.set(0.5, 0.5);

  app.stage.addChild(model as any);

  // 播放待机
  model.motion("idle", 0);

  // 点击切换动作
  let currentGroup = "idle";
  let motionTimer: ReturnType<typeof setTimeout> | null = null;
  function onModelClick() {
    if (motionTimer) clearTimeout(motionTimer);
    currentGroup = pickRandomGroup(currentGroup);
    model.motion(currentGroup, 0);
    motionTimer = setTimeout(() => {
      currentGroup = "idle";
      model.motion("idle", 0);
    }, 5000);
  }

  const canvas = app.view as HTMLCanvasElement;
  canvas.style.cursor = "pointer";
  canvas.addEventListener("click", onModelClick);
}
