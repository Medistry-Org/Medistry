import type { Pose } from "./photo-store";
import f from "./Photos.module.css";

/*
  A drawn figure, front or side, in the site's technical line style: the prototype's sample photos
  and the pose guide in the camera step. Never a real body. `g` is girth (1 at the start, a little
  less four weeks on), so two samples differ the way two real sets would: slightly.
*/

type P = [number, number];
const W = 240;
const C = W / 2;

/** A smooth line through the points (Catmull-Rom, as cubic curves). */
function smooth(pts: P[]) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** A limb: a rounded tube, an outline stroke under a fill stroke, so it never crosses the body's line. */
function Tube({ d, w }: { d: string; w: number }) {
  return (
    <g>
      <path className={f.tubeOut} d={d} strokeWidth={w + 3} />
      <path className={f.tubeIn} d={d} strokeWidth={w} />
    </g>
  );
}

function Front({ g }: { g: number }) {
  const sw = 33 + g * 5; // shoulder
  const ww = 19 + g * 13; // waist
  const hw = 25 + g * 12; // hip
  const left: P[] = [
    [C - 9, 84],
    [C - sw + 5, 92],
    [C - sw, 104],
    [C - sw + 3, 130],
    [C - ww, 166],
    [C - hw, 198],
    [C - hw + 7, 218],
    [C, 224],
  ];
  const right = left.slice(0, -1).reverse().map(([x, y]) => [W - x, y] as P);
  const leg = 19 + g * 4;
  return (
    <>
      <Tube d={`M${C - 12} 212L${C - 13} 292`} w={leg} />
      <Tube d={`M${C + 12} 212L${C + 13} 292`} w={leg} />
      <Tube d={smooth([[C - sw - 4, 104], [C - sw - 9, 150], [C - sw - 10, 202]])} w={12} />
      <Tube d={smooth([[C + sw + 4, 104], [C + sw + 9, 150], [C + sw + 10, 202]])} w={12} />
      <path className={f.artBody} d={smooth([...left, ...right]) + "Z"} />
    </>
  );
}

function Side({ g }: { g: number }) {
  const belly = 10 + g * 18;
  const seat = 4 + g * 8;
  const pts: P[] = [
    [C - 6, 84],
    [C - 16, 104],
    [C - 18, 140],
    [C - 15, 172],
    [C - 16 - seat, 202],
    [C - 10, 226],
    [C + 12, 226],
    [C + 14, 212],
    [C + belly, 184],
    [C + 10 + g * 6, 150],
    [C + 17, 122],
    [C + 10, 94],
    [C + 6, 84],
  ];
  return (
    <>
      <Tube d={`M${C + 2} 294L${C + 20} 295`} w={8} />
      <Tube d={`M${C} 214L${C + 1} 291`} w={20 + g * 4} />
      <path className={f.artBody} d={smooth(pts) + "Z"} />
      <Tube d={smooth([[C - 1, 104], [C - 3, 150], [C + 2, 198]])} w={12} />
    </>
  );
}

export function PhotoArt({ pose, g = 1, guide = false, label }: { pose: Pose; g?: number; guide?: boolean; label?: string }) {
  return (
    <svg className={f.art} data-guide={guide || undefined} viewBox={`0 0 ${W} 320`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label ?? (guide ? `Outline of a person standing, ${pose === "front" ? "facing the camera" : "side-on"}` : "Sample photo, a drawn figure")}>
      {!guide && <rect className={f.artWall} width={W} height={320} />}
      {!guide && <rect className={f.artFloor} y={300} width={W} height={20} />}
      {/* a height chart down the left edge: measurement is the brand idea */}
      <g className={f.artRule} aria-hidden="true">
        {Array.from({ length: 15 }, (_, i) => (
          <line key={i} x1={0} x2={i % 5 === 0 ? 12 : 7} y1={20 + i * 20} y2={20 + i * 20} />
        ))}
      </g>
      {pose === "front" ? <Front g={g} /> : <Side g={g} />}
      <path className={f.artBody} d={`M${C - 6} 70L${C - 6} 88L${C + 6} 88L${C + 6} 70Z`} />
      <ellipse className={f.artBody} cx={pose === "front" ? C : C + 2} cy={56} rx={16} ry={20} />
    </svg>
  );
}
