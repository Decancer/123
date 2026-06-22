"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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
  const restoreRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();

  // 路由变化时自动恢复 idle（处理页面导航后残留的状态）
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      restoreRef.current?.();
    }
  }, [pathname]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    const w = window as Window & { Live2D?: unknown };

    function bootstrap() {
      initLive2D(container!, restoreRef).catch((e) => {
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
      className="fixed bottom-0 right-4 z-[60] select-none pointer-events-auto hidden md:block"
      style={{ width: 280, height: 350 }}
    >
      {error && (
        <div className="flex h-full items-center justify-center rounded-xl bg-white/80 p-4 text-xs text-zinc-400 dark:bg-zinc-900/80">
          {error}
        </div>
      )}
    </div>
  );
}

async function initLive2D(
  container: HTMLDivElement,
  restoreRef: { current: (() => void) | null }
) {
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

  const canvasWidth = 280;
  const canvasHeight = 350;

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
  // 位置：身子下端贴 canvas 底部
  model.x = canvasWidth / 2;
  model.y = canvasHeight - modelBounds.height * scale * 0.5;
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

  // 外部触发表情/动作（全局自定义事件 mashiro:reaction）
  let reactionTimer: ReturnType<typeof setTimeout> | null = null;
  function handleReaction(e: CustomEvent) {
    const { motion, expression, duration } = e.detail || {};
    // 清除旧的恢复定时 & 点击动作定时
    if (reactionTimer) clearTimeout(reactionTimer);
    if (motionTimer) clearTimeout(motionTimer);
    if (expression) model.expression(expression);
    if (motion) {
      currentGroup = motion;
      model.motion(motion, 0);
    }
    if (duration) {
      reactionTimer = setTimeout(() => {
        model.expression("reset");
        model.motion("idle", 0);
        currentGroup = "idle";
      }, duration);
    }
  }

  // 暴露恢复方法：直接恢复 expression + motion，跳过事件总线的时序问题
  restoreRef.current = () => {
    if (reactionTimer) clearTimeout(reactionTimer);
    if (motionTimer) clearTimeout(motionTimer);
    model.expression("reset");
    model.motion("idle", 0);
    currentGroup = "idle";
  };

  window.addEventListener(
    "mashiro:reaction",
    handleReaction as EventListener
  );

  const canvas = app.view as HTMLCanvasElement;
  canvas.style.cursor = "pointer";
  canvas.addEventListener("click", onModelClick);
}
