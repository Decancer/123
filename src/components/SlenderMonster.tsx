"use client";

import { useRef, useState, useEffect, type CSSProperties } from "react";
import { EyeBall } from "@/components/EyeBall";

interface SlenderMonsterProps {
  /** 身体宽度 */
  width?: number;
  /** 身体高度 */
  height?: number;
  /** 主体颜色 */
  color: string;
  /** 颜色名称，用于 aria-label */
  name: string;
  /** CSS left 定位 */
  left?: string | number;
  /** CSS right 定位 */
  right?: string | number;
  /** CSS bottom 定位 */
  bottom?: string | number;
  /** CSS top 定位 */
  top?: string | number;
  /** z-index */
  zIndex?: number;
  /** 眼睛直径 */
  eyeSize?: number;
  /** 瞳孔直径 */
  pupilSize?: number;
  /** CSS transform origin */
  transformOrigin?: string;
  /** 最大偏斜角度 */
  maxSkew?: number;
  /** 圆角大小 */
  borderRadius?: string;
  /** 装饰条纹颜色 */
  accentColor?: string;
  className?: string;
}

export function SlenderMonster({
  width = 60,
  height = 280,
  color,
  name,
  left,
  right,
  bottom = 0,
  top,
  zIndex = 0,
  eyeSize = 36,
  pupilSize = 12,
  transformOrigin = "bottom center",
  maxSkew = 5,
  borderRadius = "12px 12px 0 0",
  accentColor,
  className,
}: SlenderMonsterProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [sway, setSway] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [blinking, setBlinking] = useState(false);

  // 全局鼠标跟踪
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // 身体摇摆计算
  useEffect(() => {
    let raf: number;
    const update = () => {
      if (bodyRef.current) {
        const rect = bodyRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        setSway(
          Math.max(-maxSkew, Math.min(maxSkew, -(mouseX - centerX) / 120))
        );
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [mouseX, mouseY, maxSkew]);

  // 眨眼：递归 setTimeout，3-7 秒随机
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = Math.random() * 4000 + 3000;
      timeout = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      ref={bodyRef}
      aria-label={name}
      className={className}
      style={{
        position: "absolute",
        width,
        height,
        backgroundColor: color,
        borderRadius,
        transform: `skewX(${sway}deg)`,
        transformOrigin,
        transition: "transform 0.3s ease-out",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...(left !== undefined ? { left } : {}),
        ...(right !== undefined ? { right } : {}),
        ...(bottom !== undefined ? { bottom } : {}),
        ...(top !== undefined ? { top } : {}),
        zIndex,
        boxShadow: `inset -8px 0 12px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.08)`,
      } as CSSProperties}
    >
      {/* 装饰条纹 */}
      {accentColor && (
        <>
          <div
            style={{
              width: "60%",
              height: 4,
              backgroundColor: accentColor,
              borderRadius: 2,
              opacity: 0.6,
              marginTop: 24,
            }}
          />
          <div
            style={{
              width: "40%",
              height: 4,
              backgroundColor: accentColor,
              borderRadius: 2,
              opacity: 0.4,
              marginTop: 8,
            }}
          />
        </>
      )}

      {/* 眼睛区域 */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: accentColor ? 28 : 32,
        }}
      >
        <EyeBall
          size={eyeSize}
          pupilSize={pupilSize}
          maxDistance={8}
          isBlinking={blinking}
        />
        <EyeBall
          size={eyeSize}
          pupilSize={pupilSize}
          maxDistance={8}
          isBlinking={blinking}
        />
      </div>

      {/* 可爱小脚 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 16,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "flex-end",
          paddingBottom: 2,
        }}
      >
        <div
          style={{
            width: 18,
            height: 10,
            backgroundColor: "rgba(0,0,0,0.15)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            width: 18,
            height: 10,
            backgroundColor: "rgba(0,0,0,0.15)",
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
}
