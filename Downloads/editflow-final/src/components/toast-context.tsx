"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastMethods = {
    success: (title: string, description?: string) => addToast("success", title, description),
    error: (title: string, description?: string) => addToast("error", title, description),
    info: (title: string, description?: string) => addToast("info", title, description),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={[
                "pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl border text-sm leading-tight",
                item.type === "success"
                  ? "bg-slate-900/90 border-emerald-500/30 text-emerald-100"
                  : item.type === "error"
                  ? "bg-slate-900/90 border-rose-500/30 text-rose-100"
                  : "bg-slate-900/90 border-violet-500/30 text-violet-100",
              ].join(" ")}
            >
              <div className="shrink-0 mt-0.5">
                {item.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {item.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400" />}
                {item.type === "info" && <Info className="h-4 w-4 text-violet-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-xs text-slate-300 leading-normal">{item.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(item.id)}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-white transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
