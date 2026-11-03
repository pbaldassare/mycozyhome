import { Home, Building2, SprayCan, Shirt, PackageOpen, LayoutGrid, Truck, Snowflake, TreePine, Leaf, Dog, PawPrint, Trash2, type LucideIcon } from "lucide-react";
import type { ServiceType } from "@/lib/services";

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
