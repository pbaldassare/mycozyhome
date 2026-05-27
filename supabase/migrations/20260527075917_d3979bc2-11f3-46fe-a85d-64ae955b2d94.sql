
-- Products catalog
CREATE TABLE public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved professionals and admins can view active products"
  ON public.shop_products FOR SELECT TO authenticated
  USING (
    (is_active = true AND EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.user_id = auth.uid() AND p.status = 'approved'
    ))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can insert products"
  ON public.shop_products FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.shop_products FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.shop_products FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_shop_products_updated
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders
CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  shipping_address text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.shop_orders TO authenticated;
GRANT ALL ON public.shop_orders TO service_role;

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own orders"
  ON public.shop_orders FOR SELECT TO authenticated
  USING (professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all orders"
  ON public.shop_orders FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Professionals can create their own orders"
  ON public.shop_orders FOR INSERT TO authenticated
  WITH CHECK (professional_id IN (
    SELECT id FROM public.professionals WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can update any order"
  ON public.shop_orders FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Professionals can cancel own pending orders"
  ON public.shop_orders FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

CREATE TRIGGER trg_shop_orders_updated
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Order items
CREATE TABLE public.shop_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.shop_products(id),
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.shop_order_items TO authenticated;
GRANT ALL ON public.shop_order_items TO service_role;

ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View items of accessible orders"
  ON public.shop_order_items FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM public.shop_orders)
  );

CREATE POLICY "Professionals can insert items for own orders"
  ON public.shop_order_items FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM public.shop_orders o
      JOIN public.professionals p ON p.id = o.professional_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-products', 'shop-products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-products');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-products' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-products' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shop-products' AND has_role(auth.uid(), 'admin'));
