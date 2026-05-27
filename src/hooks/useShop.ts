import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopOrder {
  id: string;
  professional_id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  shipping_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

// --- PRODUCTS ---

export function useShopProducts(opts?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: ["shop-products", opts?.activeOnly ?? false],
    queryFn: async () => {
      let q = supabase.from("shop_products").select("*").order("created_at", { ascending: false });
      if (opts?.activeOnly) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ShopProduct[];
    },
  });
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ShopProduct> & { id?: string }) => {
      if (input.id) {
        const { error } = await supabase
          .from("shop_products")
          .update(input as never)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shop_products")
          .insert(input as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shop_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-products"] }),
  });
}

// --- ORDERS ---

export function useMyShopOrders(professionalId?: string) {
  return useQuery({
    queryKey: ["shop-orders", "mine", professionalId],
    enabled: !!professionalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*, items:shop_order_items(*)")
        .eq("professional_id", professionalId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllShopOrders() {
  return useQuery({
    queryKey: ["shop-orders", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_orders")
        .select("*, items:shop_order_items(*), professional:professionals(first_name, last_name, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateShopOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      professional_id: string;
      shipping_address: string;
      notes?: string;
      items: { product: ShopProduct; quantity: number }[];
    }) => {
      const total = input.items.reduce(
        (sum, it) => sum + Number(it.product.price) * it.quantity,
        0
      );

      const { data: order, error } = await supabase
        .from("shop_orders")
        .insert({
          professional_id: input.professional_id,
          shipping_address: input.shipping_address,
          notes: input.notes,
          total_amount: total,
        } as never)
        .select()
        .single();
      if (error) throw error;

      const items = input.items.map((it) => ({
        order_id: (order as ShopOrder).id,
        product_id: it.product.id,
        product_name: it.product.name,
        unit_price: it.product.price,
        quantity: it.quantity,
        subtotal: Number(it.product.price) * it.quantity,
      }));

      const { error: itemsErr } = await supabase
        .from("shop_order_items")
        .insert(items as never);
      if (itemsErr) throw itemsErr;

      return order as ShopOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ShopOrder["status"] }) => {
      const { error } = await supabase
        .from("shop_orders")
        .update({ status } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop-orders"] }),
  });
}
