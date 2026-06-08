"use client";

import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { SafeImage } from "@/components/SafeImage";
import { useCallback, useEffect, useState } from "react";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantityLimit: number | null;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

function cartKey(slug: string) {
  return `fb-cart-${slug}`;
}

export function useCart(slug: string, products: CartProduct[]) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(cartKey(slug));
      if (stored) setItems(JSON.parse(stored));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [slug]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(cartKey(slug), JSON.stringify(items));
  }, [items, slug, loaded]);

  const addItem = useCallback((productId: string, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { productId, quantity: qty }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartLines = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter(Boolean) as (CartItem & { product: CartProduct })[];

  const total = cartLines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );

  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    items,
    cartLines,
    total,
    itemCount,
    addItem,
    updateQuantity,
    clearCart,
    loaded,
  };
}

export function CartDrawer({
  open,
  onClose,
  cartLines,
  total,
  onCheckout,
  checkingOut,
  updateQuantity,
}: {
  open: boolean;
  onClose: () => void;
  cartLines: (CartItem & { product: CartProduct })[];
  total: number;
  onCheckout: () => void;
  checkingOut: boolean;
  updateQuantity: (productId: string, quantity: number) => void;
}) {

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold">Your order</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartLines.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              Your cart is empty. Add some products!
            </p>
          ) : (
            <ul className="space-y-4">
              {cartLines.map(({ productId, quantity, product }) => (
                <li key={productId} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {product.imageUrl ? (
                      <SafeImage
                        src={product.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">
                        🎁
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(product.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-sm hover:bg-gray-50"
                        onClick={() => updateQuantity(productId, quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{quantity}</span>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-sm hover:bg-gray-50"
                        onClick={() => updateQuantity(productId, quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(product.price * quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartLines.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="mb-4 flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-brand">{formatCurrency(total)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={checkingOut}
              onClick={onCheckout}
            >
              {checkingOut ? "Processing…" : "Checkout securely"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export function CheckoutModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold">Almost there!</h2>
        <p className="mb-5 text-sm text-gray-500">
          Enter your details to complete payment via Stripe.
        </p>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Your name
          </label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
          />
        </div>
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Email (for receipt)
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@email.com"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Back
          </Button>
          <Button
            className="flex-1"
            disabled={loading || !name.trim() || !email.trim()}
            onClick={() => onSubmit({ name: name.trim(), email: email.trim() })}
          >
            {loading ? "Redirecting…" : "Pay now"}
          </Button>
        </div>
      </div>
    </>
  );
}
