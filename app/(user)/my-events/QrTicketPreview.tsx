"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  qrDataUrl: string;
  title: string;
};

export function QrTicketPreview({ qrDataUrl, title }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-md border bg-background p-2 w-fit"
        onClick={(event) => {
          // Prevent parent link navigation when opening QR modal.
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Open larger QR ticket for ${title}`}
      >
        <Image
          src={qrDataUrl}
          alt={`QR ticket for ${title}`}
          className="h-28 w-28"
          width={112}
          height={112}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border bg-background p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-semibold line-clamp-1">{title}</h3>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="rounded-lg border bg-white p-3 w-fit mx-auto">
              <Image
                src={qrDataUrl}
                alt={`Large QR ticket for ${title}`}
                width={320}
                height={320}
                className="h-72 w-72"
              />
            </div>

            <p className="mt-3 text-xs text-muted-foreground text-center">
              Show this enlarged QR code at check-in for faster scanning.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
