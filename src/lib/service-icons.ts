import { Home, Building2, SprayCan, Shirt, PackageOpen, LayoutGrid, Truck, Snowflake, TreePine, Leaf, Dog, PawPrint, Trash2, type LucideIcon } from "lucide-react";
import { SERVICE_CATALOG, type ServiceType } from "@/lib/services";

export const SERVICE_ICONS: Record<ServiceType, LucideIcon> = {
  cleaning: Home,
  office_cleaning: Building2,
  sanitization: SprayCan,
  ironing: Shirt,
  wardrobe_seasonal: PackageOpen,
  decluttering: LayoutGrid,
  post_renovation: Truck,
  seasonal_cleaning: Snowflake,
  garden_care: TreePine,
  home_organizing: Leaf,
  dog_sitter: Dog,
  dog_walking: Dog,
  pet_care_travel: PawPrint,
  pet_space_cleaning: Trash2,
};

/** Colore per categoria: sfondo pastello + icona/testo saturi (classi letterali per Tailwind). */
export const SERVICE_COLORS: Record<ServiceType, string> = {
  cleaning: "bg-sky-100 text-sky-600",
  office_cleaning: "bg-indigo-100 text-indigo-600",
  sanitization: "bg-teal-100 text-teal-600",
  ironing: "bg-rose-100 text-rose-500",
  wardrobe_seasonal: "bg-amber-100 text-amber-600",
  decluttering: "bg-violet-100 text-violet-600",
  post_renovation: "bg-orange-100 text-orange-600",
  seasonal_cleaning: "bg-cyan-100 text-cyan-600",
  garden_care: "bg-green-100 text-green-600",
  home_organizing: "bg-emerald-100 text-emerald-600",
  dog_sitter: "bg-yellow-100 text-yellow-700",
  dog_walking: "bg-orange-100 text-orange-500",
  pet_care_travel: "bg-pink-100 text-pink-500",
  pet_space_cleaning: "bg-lime-100 text-lime-700",
};

const LABEL_TO_ID = Object.fromEntries(SERVICE_CATALOG.map((s) => [s.label, s.id])) as Record<string, ServiceType>;

/** Colore a partire dall'id o dall'etichetta del servizio. */
export function serviceColor(idOrLabel: string): string {
  const id = (idOrLabel in SERVICE_COLORS ? idOrLabel : LABEL_TO_ID[idOrLabel]) as ServiceType | undefined;
  return (id && SERVICE_COLORS[id]) || "bg-primary-light text-primary";
}
