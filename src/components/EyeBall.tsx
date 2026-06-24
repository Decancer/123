"use client";

import { useRef, useState, useEffect, type CSSProperties } from "react";

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  style?: CSSProperties;
}

export function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "#1a1a2e",
  isBlinking = false,
  style,
}: EyeBallProps) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [pupilX, setPupilX] = useState(0);
  const [pupilY, setPupilY] = useState(0);

  // 跟踪鼠标
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // 用 rAF 计算瞳孔位置（每次渲染都更新，避免状态滞后）
  useEffect(() => {
    let raf: number;
    const update = () => {
      if (eyeRef.current) {
        const rect = eyeRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        setPupilX(Math.cos(angle) * distance);
        setPupilY(Math.sin(angle) * distance);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [mouseX, mouseY, maxDistance]);

  return (
    <div
      ref={eyeRef}
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: eyeColor,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: eyeColor === "transparent" ? "visible" : "hidden",
        transition: "height 0.1s",
        flexShrink: 0,
        ...style,
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
            borderRadius: "50%",
            transform: `translate(${pupilX}px, ${pupilY}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
}
