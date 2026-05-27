import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Package, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useProfessionalProfile } from "@/hooks/useProfessionalData";
import {
  ShopProduct,
  useShopProducts,
  useCreateShopOrder,
  useMyShopOrders,
} from "@/hooks/useShop";

const STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato",
};

export default function ProfessionalShop() {
  const navigate = useNavigate();
  const { data: professional } = useProfessionalProfile();
  const { data: products = [], isLoading } = useShopProducts({ activeOnly: true });
  const { data: orders = [] } = useMyShopOrders(professional?.id);
  const createOrder = useCreateShopOrder();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [shipping, setShipping] = useState("");
  const [notes, setNotes] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = products.find((p) => p.id === id);
          return product ? { product, quantity: qty } : null;
        })
        .filter(Boolean) as { product: ShopProduct; quantity: number }[],
    [cart, products]
  );

  const cartTotal = cartItems.reduce(
    (s, it) => s + Number(it.product.price) * it.quantity,
    0
  );
  const cartCount = cartItems.reduce((s, it) => s + it.quantity, 0);

  const addToCart = (p: ShopProduct) => {
    setCart((c) => ({ ...c, [p.id]: Math.min((c[p.id] || 0) + 1, p.stock) }));
  };
  const decrement = (p: ShopProduct) => {
    setCart((c) => {
      const next = (c[p.id] || 0) - 1;
      const copy = { ...c };
      if (next <= 0) delete copy[p.id];
      else copy[p.id] = next;
      return copy;
    });
  };

  const handleCheckout = async () => {
    if (!professional) return;
    if (cartItems.length === 0) return;
    if (!shipping.trim()) {
      toast.error("Inserisci l'indirizzo di spedizione");
      return;
    }
    try {
      await createOrder.mutateAsync({
        professional_id: professional.id,
        shipping_address: shipping.trim(),
        notes: notes.trim() || undefined,
        items: cartItems,
      });
      toast.success("Ordine inviato! Ti contatteremo a breve.");
      setCart({});
      setShipping("");
      setNotes("");
      setCheckoutOpen(false);
    } catch (e) {
      toast.error("Errore: " + (e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Negozio</h1>
          </div>
          <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrello
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader><SheetTitle>Il tuo carrello</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-3">
                {cartItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Carrello vuoto.</p>
                ) : (
                  <>
                    {cartItems.map(({ product, quantity }) => (
                      <div key={product.id} className="flex items-center gap-3 border-b pb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            €{Number(product.price).toFixed(2)} × {quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => decrement(product)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => addToCart(product)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setCart((c) => { const x = { ...c }; delete x[product.id]; return x; })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2">
                      <span>Totale</span>
                      <span>€{cartTotal.toFixed(2)}</span>
                    </div>
                    <div>
                      <Label>Indirizzo di spedizione *</Label>
                      <Input value={shipping} onChange={(e) => setShipping(e.target.value)} maxLength={300} />
                    </div>
                    <div>
                      <Label>Note</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} />
                    </div>
                    <Button className="w-full" onClick={handleCheckout} disabled={createOrder.isPending}>
                      {createOrder.isPending ? "Invio..." : "Conferma ordine"}
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="p-4">
        <Tabs defaultValue="catalog">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog">Catalogo</TabsTrigger>
            <TabsTrigger value="orders">I miei ordini ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground">Caricamento...</p>
            ) : products.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">
                Nessun prodotto disponibile al momento.
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-3 space-y-2">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-28 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-28 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {p.category && <Badge variant="outline" className="text-xs">{p.category}</Badge>}
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{p.name}</h3>
                      {p.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-bold">€{Number(p.price).toFixed(2)}</span>
                        <Button
                          size="sm"
                          disabled={p.stock <= 0 || (cart[p.id] || 0) >= p.stock}
                          onClick={() => addToCart(p)}
                        >
                          {cart[p.id] ? `+ (${cart[p.id]})` : "Aggiungi"}
                        </Button>
                      </div>
                      {p.stock <= 0 ? (
                        <p className="text-xs text-destructive">Esaurito</p>
                      ) : p.stock < 5 ? (
                        <p className="text-xs text-warning">Solo {p.stock} rimasti</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">
                Non hai ancora effettuato ordini.
              </CardContent></Card>
            ) : (
              orders.map((o: any) => (
                <Card key={o.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleString("it-IT")}
                        </p>
                        <Badge variant="secondary" className="mt-1">{STATUS_LABEL[o.status]}</Badge>
                      </div>
                      <p className="font-bold">€{Number(o.total_amount).toFixed(2)}</p>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-0.5">
                      {(o.items || []).map((it: any) => (
                        <li key={it.id}>{it.product_name} × {it.quantity}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
