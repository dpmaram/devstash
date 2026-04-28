"use client";

import { Dialog } from "@base-ui/react/dialog";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetPortal = Dialog.Portal;
const SheetTitle = Dialog.Title;
const SheetDescription = Dialog.Description;

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Backdrop>) {
  return (
    <Dialog.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/70 opacity-100 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  children,
  className,
  side = "right",
  ...props
}: React.ComponentProps<typeof Dialog.Popup> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <Dialog.Popup
        className={cn(
          "fixed z-50 flex flex-col border-devstash-line bg-[#08090b] shadow-2xl shadow-black/40 outline-none transition-transform duration-200",
          side === "right" &&
            "inset-y-0 right-0 h-full w-full max-w-[min(100vw,42rem)] border-l data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
          side === "left" &&
            "inset-y-0 left-0 h-full w-full max-w-[min(100vw,42rem)] border-r data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full",
          side === "top" &&
            "inset-x-0 top-0 max-h-[85vh] border-b data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[85vh] border-t data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Popup>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  );
}

function SheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
