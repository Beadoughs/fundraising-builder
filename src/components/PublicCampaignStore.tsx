"use client";

import { Button } from "@/components/ui/Button";
import {
  CartDrawer,
  CheckoutModal,
  useCart,
  type CartProduct,
} from "@/components/Cart";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

type PublicCampaignStoreProps = {
  slug: string;
  products: CartProduct[];
};

export function PublicCampaignStore({
  slug,
  products,
}: PublicCampaignStoreProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  const {
    cartLines,
    total,
    itemCount,
    addItem,
    updateQuantity,
    clearCart,
  } = useCart(slug, products);

  async function handleCheckout(data: { name: string; email: string }) {
    setCheckingOut(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignSlug: slug,
          customerName: data.name,
          customerEmail: data.email,
          items: cartLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Checkout failed");
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setCheckingOut(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3] bg-gray-50">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl">
                  🎁
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="mt-1 text-lg font-bold text-brand">
                {formatCurrency(product.price)}
              </p>
              {product.quantityLimit && (
                <p className="mt-1 text-xs text-gray-400">
                  Limited to {product.quantityLimit}
                </p>
              )}
              <Button
                className="mt-4 w-full"
                onClick={() => {
                  addItem(product.id);
                  setCartOpen(true);
                }}
              >
                Order now
              </Button>
            </div>
          </div>
        ))}
      </div>

      {itemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-white shadow-lg hover:bg-brand-dark"
        >
          <span>🛒</span>
          <span>
            {itemCount} · {formatCurrency(total)}
          </span>
        </button>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartLines={cartLines}
        total={total}
        updateQuantity={updateQuantity}
        checkingOut={checkingOut}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        loading={checkingOut}
        onSubmit={(data) => handleCheckout(data)}
      />

      {error && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {error}
        </div>
      )}
    </>
  );
}
