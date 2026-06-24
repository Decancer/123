"use client";

import { useRef, useState, useEffect, type CSSProperties } from "react";
import { EyeBall } from "@/components/EyeBall";

interface SlenderMonsterProps {
  width?: number;
  height?: number;
  color: string;
  name: string;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  top?: string | number;
  zIndex?: number;
  eyeSize?: number;
  eyeColor?: string;
  pupilSize?: number;
  transformOrigin?: string;
  maxSkew?: number;
  borderRadius?: string;
  accentColor?: string;
  showFeet?: boolean;
  showMouth?: boolean;
  mouthWidth?: number;
  mouthSensitivity?: number;
  /** 眼睛类型 */
  eyeType?: "normal" | "noSclera" | "verticalLine";
  /** 嘴巴类型 */
  mouthType?: "none" | "line" | "arcUp" | "arcDown";
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
  eyeColor = "white",
  pupilSize = 12,
  transformOrigin = "bottom center",
  maxSkew = 5,
  borderRadius = "12px 12px 0 0",
  accentColor,
  showFeet = true,
  showMouth = false,
  mouthWidth = 28,
  mouthSensitivity = 1,
  eyeType = "normal",
  mouthType: mouthTypeProp,
  className,
}: SlenderMonsterProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [sway, setSway] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [mouthX, setMouthX] = useState(0);
  const [mouthY, setMouthY] = useState(0);

  // 实际嘴巴类型（兼容旧 showMouth prop）
  const mouthType = mouthTypeProp ?? (showMouth ? "line" : "none");
  const hasMouth = mouthType !== "none";

  // 全局鼠标跟踪
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // 身体摇摆
  useEffect(() => {
    let raf: number;
    const update = () => {
      if (bodyRef.current) {
        const rect = bodyRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        setSway(Math.max(-maxSkew, Math.min(maxSkew, -(mouseX - centerX) / 120)));
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [mouseX, mouseY, maxSkew]);

  // 嘴巴鼠标追踪（仅横线模式）
  useEffect(() => {
    if (mouthType !== "line") return;
    let raf: number;
    const update = () => {
      if (bodyRef.current) {
        const rect = bodyRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        const maxTravelX = Math.max(0, width / 2 - mouthWidth / 2 - 4);
        const maxTravelY = 8;
        setMouthX(Math.max(-maxTravelX, Math.min(maxTravelX, deltaX / 30 * mouthSensitivity)));
        setMouthY(Math.max(-maxTravelY, Math.min(maxTravelY, deltaY / 30 * mouthSensitivity)));
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [mouseX, mouseY, width, mouthWidth, mouthSensitivity, mouthType]);

  // 眨眼
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

  // 竖线眼睛不眨眼
  const effectiveBlinking = eyeType === "verticalLine" ? false : blinking;

  // 眼睛区域顶部偏移（基于身体比例）
  const eyeTop = accentColor ? 28 : 32;
  const eyeGap = width < 50 ? 8 : 12;

  // 嘴巴样式
  function mouthStyle(): CSSProperties {
    const base: CSSProperties = {
      marginTop: 10,
      transition: "transform 0.15s ease-out",
    };
    switch (mouthType) {
      case "line":
        return {
          ...base,
          width: mouthWidth,
          height: 5,
          backgroundColor: "#1a1a1a",
          borderRadius: 3,
          transform: `translate(${mouthX}px, ${mouthY}px)`,
        };
      case "arcUp":
        return {
          ...base,
          width: mouthWidth,
          height: 12,
          borderBottom: "3px solid #1a1a1a",
          borderBottomLeftRadius: "50%",
          borderBottomRightRadius: "50%",
        };
      case "arcDown":
        return {
          ...base,
          width: mouthWidth,
          height: 12,
          borderTop: "3px solid #1a1a1a",
          borderTopLeftRadius: "50%",
          borderTopRightRadius: "50%",
        };
      default:
        return {};
    }
  }

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
        transition: "transform 0.3s ease-out, width 0.3s, height 0.3s, borderRadius 0.3s",
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
          <div style={{ width: "60%", height: 4, backgroundColor: accentColor, borderRadius: 2, opacity: 0.6, marginTop: 24 }} />
          <div style={{ width: "40%", height: 4, backgroundColor: accentColor, borderRadius: 2, opacity: 0.4, marginTop: 8 }} />
        </>
      )}

      {/* 眼睛区域 */}
      <div style={{ display: "flex", gap: eyeGap, marginTop: eyeTop }}>
        {eyeType === "verticalLine" ? (
          <>
            {/* 竖线眼睛 — 两条细长的黑矩形，看起来像闭眼/ >_< */}
            <div
              style={{
                width: 4,
                height: eyeSize * 0.8,
                backgroundColor: "#1a1a1a",
                borderRadius: 2,
              }}
            />
            <div
              style={{
                width: 4,
                height: eyeSize * 0.8,
                backgroundColor: "#1a1a1a",
                borderRadius: 2,
              }}
            />
          </>
        ) : (
          <>
            <EyeBall
              size={eyeSize}
              pupilSize={pupilSize}
              maxDistance={8}
              eyeColor={eyeType === "noSclera" ? "transparent" : eyeColor}
              isBlinking={effectiveBlinking}
            />
            <EyeBall
              size={eyeSize}
              pupilSize={pupilSize}
              maxDistance={8}
              eyeColor={eyeType === "noSclera" ? "transparent" : eyeColor}
              isBlinking={effectiveBlinking}
            />
          </>
        )}
      </div>

      {/* 嘴巴 */}
      {hasMouth && <div style={mouthStyle()} />}

      {/* 小脚 */}
      {showFeet && (
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: 16,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "flex-end",
            paddingBottom: 2,
          }}
        >
          <div style={{ width: 18, height: 10, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "50%" }} />
          <div style={{ width: 18, height: 10, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "50%" }} />
        </div>
      )}
    </div>
  );
}
