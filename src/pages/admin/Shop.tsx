import { useState } from "react";
import { Plus, Pencil, Trash2, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ShopProduct,
  useShopProducts,
  useUpsertProduct,
  useDeleteProduct,
  useAllShopOrders,
  useUpdateOrderStatus,
} from "@/hooks/useShop";

const STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato",
};

function ProductDialog({
  product,
  onClose,
}: {
  product?: ShopProduct;
  onClose: () => void;
}) {
  const upsert = useUpsertProduct();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [stock, setStock] = useState(String(product?.stock ?? "0"));
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error } = await supabase.storage
      .from("shop-products")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload fallito: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("shop-products").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !price) {
      toast.error("Nome e prezzo sono obbligatori");
      return;
    }
    await upsert.mutateAsync({
      id: product?.id,
      name: name.trim(),
      description: description || null,
      category: category || null,
      price: Number(price),
      stock: Number(stock || 0),
      image_url: imageUrl || null,
      is_active: isActive,
    });
    toast.success(product ? "Prodotto aggiornato" : "Prodotto creato");
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{product ? "Modifica prodotto" : "Nuovo prodotto"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nome *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <div>
          <Label>Descrizione</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categoria</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="es. Pulizia"
            />
          </div>
          <div>
            <Label>Prezzo (€) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>Stock</Label>
          <Input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <div>
          <Label>Immagine</Label>
          <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="preview"
              className="mt-2 w-24 h-24 object-cover rounded-lg border"
            />
          )}
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="active">Prodotto attivo</Label>
          <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annulla</Button>
        <Button onClick={handleSave} disabled={upsert.isPending || uploading}>
          {upsert.isPending ? "Salvataggio..." : "Salva"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function AdminShop() {
  const { data: products = [], isLoading } = useShopProducts();
  const { data: orders = [] } = useAllShopOrders();
  const deleteProduct = useDeleteProduct();
  const updateStatus = useUpdateOrderStatus();
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Negozio professionisti</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci prodotti in vendita e ordini ricevuti
          </p>
        </div>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Prodotti ({products.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Ordini ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuovo prodotto
              </Button>
            </DialogTrigger>
            <ProductDialog
              product={editing ?? undefined}
              onClose={() => { setOpen(false); setEditing(null); }}
            />
          </Dialog>

          {isLoading ? (
            <p className="text-muted-foreground">Caricamento...</p>
          ) : products.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">
              Nessun prodotto. Aggiungine uno!
            </CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 space-y-2">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{p.name}</h3>
                      {!p.is_active && <Badge variant="secondary">Nascosto</Badge>}
                    </div>
                    {p.category && (
                      <Badge variant="outline">{p.category}</Badge>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-lg">€{Number(p.price).toFixed(2)}</span>
                      <span className="text-muted-foreground">Stock: {p.stock}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setEditing(p); setOpen(true); }}
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Modifica
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={async () => {
                          if (!confirm(`Eliminare "${p.name}"?`)) return;
                          await deleteProduct.mutateAsync(p.id);
                          toast.success("Prodotto eliminato");
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-3">
          {orders.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">
              Nessun ordine ricevuto.
            </CardContent></Card>
          ) : (
            orders.map((o: any) => (
              <Card key={o.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">
                        {o.professional?.first_name} {o.professional?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.professional?.email} · {o.professional?.phone}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ordine del {new Date(o.created_at).toLocaleString("it-IT")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{Number(o.total_amount).toFixed(2)}</p>
                      <Select
                        value={o.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({ id: o.id, status: v as any })
                        }
                      >
                        <SelectTrigger className="w-40 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABEL).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-sm border-t pt-2 space-y-1">
                    <p className="text-muted-foreground">
                      <strong>Spedizione:</strong> {o.shipping_address}
                    </p>
                    {o.notes && (
                      <p className="text-muted-foreground"><strong>Note:</strong> {o.notes}</p>
                    )}
                    <ul className="mt-2 space-y-0.5">
                      {(o.items || []).map((it: any) => (
                        <li key={it.id} className="flex justify-between">
                          <span>{it.product_name} × {it.quantity}</span>
                          <span>€{Number(it.subtotal).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
