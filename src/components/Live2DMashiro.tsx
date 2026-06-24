"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLive2DContext } from "@/lib/Live2DContext";

const MOTION_GROUPS = [
  "smile", "surprised", "angry", "cry", "sad",
  "serious", "thinking", "bye", "kandou", "kime",
  "uziuzi", "nf", "nnf", "gacha",
];

function pickRandomGroup(exclude?: string): string {
  const pool = exclude
    ? MOTION_GROUPS.filter((g) => g !== exclude)
    : MOTION_GROUPS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function Live2DMashiro() {
  const [error, setError] = useState<string | null>(null);
  const [isWide, setIsWide] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  const { modelPath } = useLive2DContext();

  // 监听屏幕宽度
  useEffect(() => {
    const mql = matchMedia("(min-width: 768px)");
    setIsWide(mql.matches);
    setMounted(true);
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // 路由变化时恢复 idle
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      // 如果 Live2D 已初始化，发送事件让它恢复
      if (cleanupRef.current) {
        window.dispatchEvent(
          new CustomEvent("mashiro:reaction", {
            detail: { motion: "idle", expression: "reset", duration: 0 },
          })
        );
      }
    }
  }, [pathname]);

  // 大屏时挂载 PIXI + Live2D，小屏时彻底销毁（释放 WebGL 上下文）
  useEffect(() => {
    if (!isWide) return;

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    // ---- 加载脚本 + 初始化 ----
    async function start() {
      const w = window as Window & { Live2D?: unknown };

      // 如果还没加载 live2d.min.js
      if (!w.Live2D) {
        try {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/live2d.min.js";
            script.async = false;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("live2d.min.js 加载失败"));
            document.head.appendChild(script);
          });
        } catch (e) {
          if (!cancelled) {
            console.error("Live2D 脚本加载失败:", e);
            setError("Live2D 脚本加载失败，请刷新页面");
          }
          return;
        }
      }

      if (cancelled) return;
      if (!container) return;

      try {
        const [{ Application, Ticker }, { Live2DModel }] =
          await Promise.all([
            import("pixi.js"),
            import("pixi-live2d-display/cubism2"),
          ]);

        if (cancelled) return;

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

        container!.innerHTML = "";
        container!.appendChild(app.view as HTMLCanvasElement);

        const model = await Live2DModel.from(modelPath);
        if (cancelled) {
          app.destroy(true, { children: true });
          return;
        }

        const modelBounds = model.getBounds();
        const scale =
          Math.min(
            canvasWidth / modelBounds.width,
            canvasHeight / modelBounds.height
          ) * 0.9;

        model.scale.set(scale);
        model.x = canvasWidth / 2;
        model.y = canvasHeight - modelBounds.height * scale * 0.5;
        model.anchor.set(0.5, 0.5);

        app.stage.addChild(model as any);
        model.motion("serious", 0);

        // ---- 交互 ----
        let currentGroup = "serious";
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

        let reactionTimer: ReturnType<typeof setTimeout> | null = null;
        function handleReaction(e: CustomEvent) {
          const { motion, expression, duration } = e.detail || {};
          if (reactionTimer) clearTimeout(reactionTimer);
          if (motionTimer) clearTimeout(motionTimer);
          if (expression) model.expression(expression);
          if (motion) {
            currentGroup = motion;
            model.motion(motion, 0);
          }
          if (duration && duration > 0) {
            reactionTimer = setTimeout(() => {
              model.expression("reset");
              model.motion("idle", 0);
              currentGroup = "idle";
            }, duration);
          }
        }

        const canvas = app.view as HTMLCanvasElement;
        canvas.style.cursor = "pointer";
        canvas.addEventListener("click", onModelClick);
        window.addEventListener(
          "mashiro:reaction",
          handleReaction as EventListener
        );

        // ---- 注册清理函数（释放 WebGL 上下文 + 解绑事件） ----
        cleanupRef.current = () => {
          if (motionTimer) clearTimeout(motionTimer);
          if (reactionTimer) clearTimeout(reactionTimer);
          canvas.removeEventListener("click", onModelClick);
          window.removeEventListener(
            "mashiro:reaction",
            handleReaction as EventListener
          );
          // 关键：销毁 PIXI app，释放 WebGL 上下文
          app.destroy(true, { children: true, texture: true });
        };
      } catch (e) {
        if (!cancelled) {
          console.error("Live2D 初始化失败:", e);
          setError(e instanceof Error ? e.message : "初始化失败");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      // 彻底清理：销毁 app → 释放 WebGL 上下文 → 清空 DOM
      cleanupRef.current?.();
      cleanupRef.current = null;
      setError(null);
    };
  }, [isWide, modelPath]);

  if (!mounted) return null;
  if (!isWide) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 right-4 z-[60] select-none pointer-events-auto"
      style={{ width: 280, height: 350 }}
    >
      {error && (
        <div className="flex h-full items-center justify-center rounded-xl bg-primary-50/80 p-4 text-xs text-muted">
          {error}
        </div>
      )}
    </div>
  );
}
