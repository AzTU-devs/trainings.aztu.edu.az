import {
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CodeXml,
  Cog,
  GraduationCap,
  Leaf,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { CategoryStyle } from "./style";

/**
 * The one icon each subject family is drawn with — menus, tiles and the plain
 * header of a course without a photo. Tinted with the family's hue (`.cat-ic`
 * in globals.css); a category no family matched (`k-navy`) gets a neutral
 * mortarboard rather than another family's icon. No hooks, so server and
 * client components can both use it.
 */
const BY_ART: Record<CategoryStyle["art"], LucideIcon> = {
  it: CodeXml,
  data: BrainCircuit,
  eng: Cog,
  biz: BriefcaseBusiness,
  res: BookOpen,
  build: Building2,
  trans: Truck,
  energy: Leaf,
};

export function CategoryIcon({
  style,
  className = "i",
}: {
  style: Pick<CategoryStyle, "k" | "art"> | null | undefined;
  className?: string;
}) {
  const Icon = !style || style.k === "k-navy" ? GraduationCap : (BY_ART[style.art] ?? GraduationCap);
  return <Icon className={className} aria-hidden />;
}
