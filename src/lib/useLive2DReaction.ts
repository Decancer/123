"use client";

import { useEffect, useRef } from "react";

/**
 * 当 loading 变为 true 时，通知 Live2D Mashiro 切换到思考状态；
 * loading 变为 false 或组件卸载时恢复 idle。
 */
export function useLoadingReaction(loading: boolean) {
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!loading) return;

    // loading 开始：切到思考
    window.dispatchEvent(
      new CustomEvent("mashiro:reaction", {
        detail: { motion: "thinking" },
      })
    );

    return () => {
      // loading 结束或组件卸载：恢复 idle
      if (restoredRef.current) return;
      restoredRef.current = true;
      window.dispatchEvent(
        new CustomEvent("mashiro:reaction", {
          detail: { motion: "idle", expression: "reset" },
        })
      );
    };
  }, [loading]);
}
