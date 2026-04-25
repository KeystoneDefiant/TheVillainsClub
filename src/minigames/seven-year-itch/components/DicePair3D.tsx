import { useEffect, useState } from "react";
import { Group } from "@mantine/core";

type FaceProps = { value: 1 | 2 | 3 | 4 | 5 | 6 };

/** Pip positions as grid areas 1-9 (3x3), 5 = center */
const PIP: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

function DieFace({ value }: FaceProps) {
  const cells = PIP[value] ?? [];
  return (
    <div className="yi-die-face">
      {Array.from({ length: 9 }, (_, i) => {
        const n = i + 1;
        const on = cells.includes(n);
        return <span key={n} className={`yi-die-pip ${on ? "yi-die-pip--on" : ""}`} />;
      })}
    </div>
  );
}

/**
 * Rotations to bring the labeled physical face to the front.
 * Cube faces: front=1, back=6, right=3, left=4, top=5, bottom=2.
 */
function rotationForValue(value: number): string {
  const v = Math.min(6, Math.max(1, Math.floor(value)));
  switch (v) {
    case 1:
      return "rotateX(0deg) rotateY(0deg)";
    case 6:
      return "rotateY(180deg)";
    case 3:
      return "rotateY(-90deg)";
    case 4:
      return "rotateY(90deg)";
    case 5:
      return "rotateX(-90deg)";
    case 2:
      return "rotateX(90deg)";
    default:
      return "rotateX(0deg) rotateY(0deg)";
  }
}

function DieCube({
  value,
  rolling,
  reduceMotion,
  animKey,
}: {
  value: number;
  rolling: boolean;
  reduceMotion: boolean;
  animKey: number;
}) {
  const v = Math.min(6, Math.max(1, Math.floor(value))) as FaceProps["value"];
  const settle = rotationForValue(v);

  return (
    <div className="yi-die-scene" key={animKey}>
      <div
        className={`yi-die-cube ${rolling && !reduceMotion ? "yi-die-cube--rolling" : ""}`}
        style={{
          transform: rolling && !reduceMotion ? undefined : settle,
        }}
      >
        <div className="yi-die-faceWrap yi-die-faceWrap--front">
          <DieFace value={1} />
        </div>
        <div className="yi-die-faceWrap yi-die-faceWrap--back">
          <DieFace value={6} />
        </div>
        <div className="yi-die-faceWrap yi-die-faceWrap--right">
          <DieFace value={3} />
        </div>
        <div className="yi-die-faceWrap yi-die-faceWrap--left">
          <DieFace value={4} />
        </div>
        <div className="yi-die-faceWrap yi-die-faceWrap--top">
          <DieFace value={5} />
        </div>
        <div className="yi-die-faceWrap yi-die-faceWrap--bottom">
          <DieFace value={2} />
        </div>
      </div>
    </div>
  );
}

export type DicePair3DProps = {
  d1: number;
  d2: number;
  rolling: boolean;
  reduceMotion: boolean;
};

export function DicePair3D({ d1, d2, rolling, reduceMotion }: DicePair3DProps) {
  const [spinKey, setSpinKey] = useState(0);

  useEffect(() => {
    if (rolling && !reduceMotion) {
      setSpinKey((k) => k + 1);
    }
  }, [rolling, reduceMotion]);

  const show1 = Math.min(6, Math.max(1, d1));
  const show2 = Math.min(6, Math.max(1, d2));

  return (
    <Group gap="lg" justify="center" wrap="nowrap" className="yi-dice-pair">
      <DieCube value={show1} rolling={rolling} reduceMotion={reduceMotion} animKey={spinKey} />
      <DieCube value={show2} rolling={rolling} reduceMotion={reduceMotion} animKey={spinKey + 17} />
    </Group>
  );
}
