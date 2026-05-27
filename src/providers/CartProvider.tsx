"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { BookType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type CartContextType = {
  cart: BookType[];
  addToCart: (book: BookType) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isInCart: (bookId: string) => boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<BookType[]>([]);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  // Load cart from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("vidyaheist_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
    setMounted(true);
  }, []);

  // Save cart to LocalStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("vidyaheist_cart", JSON.stringify(cart));
    }
  }, [cart, mounted]);

  const addToCart = (book: BookType) => {
    if (cart.some((item) => item.id === book.id)) {
      toast({
        title: "Already in Cart",
        description: `"${book.name}" is already in your shopping cart.`,
        variant: "destructive",
      });
      return;
    }

    setCart((prev) => [...prev, book]);
    toast({
      title: "Added to Cart",
      description: `"${book.name}" has been added to your shopping cart.`,
    });
  };

  const removeFromCart = (bookId: string) => {
    const itemToRemove = cart.find((item) => item.id === bookId);
    setCart((prev) => prev.filter((item) => item.id !== bookId));
    if (itemToRemove) {
      toast({
        title: "Removed from Cart",
        description: `"${itemToRemove.name}" was removed from your cart.`,
      });
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (bookId: string) => {
    return cart.some((item) => item.id === bookId);
  };

  const cartCount = cart.length;
  const cartTotal = cart.reduce((acc, item) => acc + (item.price || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
