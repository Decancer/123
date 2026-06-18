"use client";

import { useEffect, useRef, useState } from "react";

// 可点击切换的动作池
const MOTIONS = [
  "smile01", "smile02", "smile03",
  "angry01",
  "cry01",
  "sad01", "sad02",
  "surprised01",
  "thinking01",
  "bye01",
  "kandou01",
  "kime01",
  "uziuzi01", "uziuzi02",
  "serious01", "serious02",
];

function pickRandomMotion(exclude?: string): string {
  const pool = exclude ? MOTIONS.filter((m) => m !== exclude) : MOTIONS;
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

    // 如果 cubismcore 已经加载过（全局已存在），直接初始化
    const w = window as Window & { Live2DCubismCore?: unknown };

    function bootstrap() {
      initLive2D(container!).catch((e) => {
        console.error("Live2D 初始化失败:", e);
        setError(e instanceof Error ? e.message : "初始化失败");
      });
    }

    if (w.Live2DCubismCore) {
      bootstrap();
      return;
    }

    // 手动注入 cubismcore 脚本，确保在一切之前加载
    const script = document.createElement("script");
    script.src = "/live2dcubismcore.min.js";
    script.async = false; // 同步加载保证全局变量就位
    script.onload = () => {
      // 等一个微任务确保全局变量写入
      setTimeout(bootstrap, 0);
    };
    script.onerror = () => {
      setError(
        "缺少 live2dcubismcore.min.js，请从 Live2D 官网下载 Cubism 4 SDK for Web，" +
          "解压后将 Core/live2dcubismcore.min.js 放到 public/ 目录"
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
  const w = window as Window & { Live2DCubismCore?: unknown };
  if (!w.Live2DCubismCore) {
    throw new Error("Cubism Core 未加载");
  }

  const [{ Application, Ticker }, { Live2DModel }] =
    await Promise.all([
      import("pixi.js"),
      import("pixi-live2d-display"),
    ]);

  // 注册 Ticker（类型兼容性用 any 绕开）
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
    "/mashiro live2d/mashiro_school_winter-2023.moc"
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
  let currentMotion = "idle01";
  model.motion(currentMotion);

  // 点击切换动作
  let motionTimer: ReturnType<typeof setTimeout> | null = null;
  function onModelClick() {
    if (motionTimer) clearTimeout(motionTimer);
    currentMotion = pickRandomMotion(currentMotion);
    model.motion(currentMotion);
    motionTimer = setTimeout(() => {
      currentMotion = "idle01";
      model.motion("idle01");
    }, 5000);
  }

  const canvas = app.view as HTMLCanvasElement;
  canvas.style.cursor = "pointer";
  canvas.addEventListener("click", onModelClick);
}
