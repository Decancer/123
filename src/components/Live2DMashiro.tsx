"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";

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
  const [coreReady, setCoreReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initLive2D = useCallback(async () => {
    if (typeof window === "undefined") return;

    // 确保 Cubism Core 已加载
    const w = window as Window & { Live2DCubismCore?: unknown };
    if (!w.Live2DCubismCore) {
      setError("Cubism Core 未加载");
      return;
    }

    // 动态导入，确保在 Cubism Core 之后
    const [PIXI, { Live2DModel }] = await Promise.all([
      import("pixi.js"),
      import("pixi-live2d-display"),
    ]);

    // pixi-live2d-display 与 pixi.js 有内部类型不兼容，运行时正常
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Live2DModel.registerTicker(PIXI.Ticker as any);

    const canvasWidth = 300;
    const canvasHeight = 400;

    const app = new PIXI.Application({
      backgroundAlpha: 0,
      width: canvasWidth,
      height: canvasHeight,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // 把 canvas 插入 DOM
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    container.appendChild(app.view as HTMLCanvasElement);

    try {
      // 加载模型，URL 空格 Live2D 库能处理
      const model = await Live2DModel.from(
        "/mashiro live2d/mashiro_school_winter-2023.moc",
      );

      // 缩放：让模型高度大致填满 canvas
      const modelBounds = model.getBounds();
      const scale = Math.min(
        canvasWidth / modelBounds.width,
        canvasHeight / modelBounds.height,
      ) * 0.9;

      model.scale.set(scale);
      model.x = canvasWidth / 2;
      model.y = canvasHeight * 0.55; // 稍微偏下
      model.anchor.set(0.5, 0.5);

      app.stage.addChild(model as any);

      // 播放待机动作
      let currentMotion = "idle01";
      model.motion(currentMotion);

      // 点击切换动作
      let motionTimer: ReturnType<typeof setTimeout> | null = null;
      function onModelClick() {
        if (motionTimer) clearTimeout(motionTimer);
        currentMotion = pickRandomMotion(currentMotion);
        model.motion(currentMotion);
        // 几秒后自动回到 idle
        motionTimer = setTimeout(() => {
          currentMotion = "idle01";
          model.motion("idle01");
        }, 5000);
      }

      // 给 canvas 加点击事件
      const canvas = app.view as HTMLCanvasElement;
      canvas.style.cursor = "pointer";
      canvas.addEventListener("click", onModelClick);

      // 清理
      return () => {
        canvas.removeEventListener("click", onModelClick);
        if (motionTimer) clearTimeout(motionTimer);
        app.destroy(true, { children: true });
      };
    } catch (e) {
      console.error("Live2D 模型加载失败:", e);
      setError("模型加载失败");
      app.destroy(true);
    }
  }, []);

  useEffect(() => {
    if (!coreReady) return;

    let cleanup: (() => void) | undefined;
    initLive2D().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cleanup?.();
    };
  }, [coreReady, initLive2D]);

  // 没有 cubism core 就不渲染（开发环境）
  if (!coreReady && typeof window !== "undefined") {
    const w = window as Window & { Live2DCubismCore?: unknown };
    // Script 还没触发 onLoad，等一会
    if (!w.Live2DCubismCore) {
      // 可能文件不存在，静默失败
    }
  }

  return (
    <>
      <Script
        src="/live2dcubismcore.min.js"
        onLoad={() => setCoreReady(true)}
        onError={() => setError("Cubism Core 加载失败，请确认 public/live2dcubismcore.min.js 存在")}
        strategy="afterInteractive"
      />
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
    </>
  );
}
