import React from "react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] p-4"
          >
            <div className="relative w-full overflow-hidden rounded-2xl bg-white p-6 shadow-xl ring-1 ring-neutral-900/5">
              <div className="flex items-center justify-between mb-4">
                {title && <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h2>}
                <button onClick={onClose} className="rounded-full p-1 hover:bg-neutral-100 transition-colors">
                  <X className="h-4 w-4 text-neutral-500" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
