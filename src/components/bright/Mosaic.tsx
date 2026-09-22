import Image from "next/image";
import { Svg } from "./Svg";
import { tileSvg } from "@/lib/art";
import { cn } from "@/lib/utils/cn";

/*
 * The hero's "periodic table": twelve discipline tiles around the AzTU shield.
 * Decorative (aria-hidden) — the colours are the subject families', but the
 * tiles are not links and stand for no particular course.
 */

type Tile = { k: string; motif: string; shape?: "round" | "arch" | "gold" } | "SHIELD";

const TILES: Tile[] = [
  { k: "k-it", motif: "window" },
  { k: "k-data", motif: "dots", shape: "round" },
  { k: "k-eng", motif: "rings" },
  { k: "k-res", motif: "book", shape: "arch" },
  { k: "k-build", motif: "arch" },
  "SHIELD",
  { k: "k-biz", motif: "bars" },
  { k: "k-trans", motif: "route", shape: "round" },
  { k: "k-energy", motif: "wave" },
  { k: "k-gold", motif: "star", shape: "gold" },
  { k: "k-build", motif: "stairs" },
  { k: "k-it", motif: "circle", shape: "round" },
  { k: "k-data", motif: "blocks" },
];

function ShieldTile({ i }: { i: number }) {
  return (
    <div className="mo big shield mo-in" style={{ "--i": i } as React.CSSProperties}>
      <span className="ring" />
      <span className="ring2" />
      <span className="tick" style={{ left: "50%", top: "5%", width: 2, height: "6%", marginLeft: -1 }} />
      <span className="tick" style={{ left: "50%", bottom: "5%", width: 2, height: "6%", marginLeft: -1 }} />
      <span className="tick" style={{ top: "50%", left: "5%", height: 2, width: "6%", marginTop: -1 }} />
      <span className="tick" style={{ top: "50%", right: "5%", height: 2, width: "6%", marginTop: -1 }} />
      <Image src="/brand/aztu-mark-white.png" alt="" width={120} height={228} priority />
    </div>
  );
}

function Tiles({ order }: { order: Tile[] }) {
  return (
    <>
      {order.map((t, i) =>
        t === "SHIELD" ? (
          <ShieldTile key={`s${i}`} i={i} />
        ) : (
          <div
            key={i}
            className={cn("mo mo-in", t.k, t.shape)}
            style={{ "--i": i } as React.CSSProperties}
          >
            <Svg markup={tileSvg(t.motif)} />
          </div>
        ),
      )}
    </>
  );
}

/** Desktop: the 4×4 grid, with the shield spanning the middle 2×2. */
export function Mosaic() {
  return (
    <div className="mosaic" aria-hidden>
      <Tiles order={TILES} />
    </div>
  );
}

/**
 * Phones and tablets: the same tiles as a slow two-row band. The list is
 * drawn twice so the -50% loop joins seamlessly; it stops under reduced motion.
 */
export function MosaicBand() {
  const rest = TILES.filter((t) => t !== "SHIELD");
  const seq: Tile[] = [rest[0], rest[1], "SHIELD", ...rest.slice(2)];
  return (
    <div className="band-wrap pb-9 pt-3" aria-hidden>
      <div className="band">
        <Tiles order={seq} />
        <Tiles order={seq} />
      </div>
    </div>
  );
}

/** The closing call to action's drafting protractor around the shield. */
export { protractorSvg } from "@/lib/art";
