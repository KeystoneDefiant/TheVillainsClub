import { useState, useEffect, useRef, ReactNode } from "react";
import { Box } from "@mantine/core";

export interface GameScaleContainerProps {
  children: ReactNode;
  designWidth?: number;
  designHeight?: number;
  maxScale?: number;
  minScale?: number;
  transformOrigin?: string;
  alignItems?: string;
}

export function GameScaleContainer({
  children,
  designWidth = 980,
  designHeight = 760,
  maxScale = 2.5,
  minScale = 0.35,
  transformOrigin = "center center",
  alignItems = "center",
}: GameScaleContainerProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const parentWidth = window.innerWidth;
      const parentHeight = window.innerHeight;

      // Scale to fit screen perfectly, preserving aspect ratio
      const scaleX = parentWidth / designWidth;
      const scaleY = parentHeight / designHeight;
      let newScale = Math.min(scaleX, scaleY);

      // Clamp scale
      newScale = Math.max(minScale, Math.min(maxScale, newScale));
      setScale(newScale);
    };

    window.addEventListener("resize", handleResize);
    // Initial call
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [designWidth, designHeight, maxScale, minScale]);

  return (
    <Box
      style={{
        display: "flex",
        alignItems: alignItems,
        justifyContent: "center",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        ref={containerRef}
        className="game-scale-content"
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: transformOrigin,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          pointerEvents: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
