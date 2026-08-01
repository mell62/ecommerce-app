"use client";

import Image from "next/image";
import type { KeyboardEvent, PointerEvent } from "react";
import { useId, useRef, useState } from "react";

type ProductImageZoomProps = Readonly<{
  src: string;
  alt: string;
}>;

export default function ProductImageZoom({ src, alt }: ProductImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const instructionsId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pointerStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  function updateZoomPoint(event: PointerEvent<HTMLButtonElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    event.currentTarget.style.setProperty(
      "--zoom-x",
      `${Math.min(100, Math.max(0, x))}%`
    );
    event.currentTarget.style.setProperty(
      "--zoom-y",
      `${Math.min(100, Math.max(0, y))}%`
    );
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>): void {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    didDrag.current = false;
    updateZoomPoint(event);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>): void {
    if (!isZoomed) {
      return;
    }

    updateZoomPoint(event);

    if (event.pointerType !== "touch" && event.buttons !== 1) {
      return;
    }

    const horizontalDistance = Math.abs(event.clientX - pointerStart.current.x);
    const verticalDistance = Math.abs(event.clientY - pointerStart.current.y);

    if (horizontalDistance > 5 || verticalDistance > 5) {
      didDrag.current = true;
    }
  }

  function handleClick(): void {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }

    if (isZoomed) {
      resetZoom();
      return;
    }

    setIsZoomed(true);
  }

  function resetZoom(): void {
    setIsZoomed(false);
    buttonRef.current?.style.setProperty("--zoom-x", "50%");
    buttonRef.current?.style.setProperty("--zoom-y", "50%");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "Escape") {
      resetZoom();
    }
  }

  return (
    <div className="relative z-10 flex h-full w-full items-center justify-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label={isZoomed ? `Reset zoom for ${alt}` : `Zoom in on ${alt}`}
        aria-describedby={instructionsId}
        aria-pressed={isZoomed}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        onBlur={resetZoom}
        className={`group relative h-[90%] w-[90%] overflow-hidden rounded-ui ${
          isZoomed ? "cursor-zoom-out touch-none" : "cursor-zoom-in touch-pan-y"
        }`}
      >
        <Image
          src={src}
          alt={alt}
          width={800}
          height={600}
          priority
          sizes="(min-width: 1200px) 55vw, (min-width: 640px) 576px, 100vw"
          style={{
            transformOrigin: "var(--zoom-x, 50%) var(--zoom-y, 50%)",
            transitionProperty: "transform, transform-origin",
          }}
          className={`h-full w-full object-contain drop-shadow-xl duration-300 ease-[var(--store-ease-emphasized)] ${
            isZoomed ? "scale-[2.2]" : "group-hover:scale-[1.035]"
          }`}
        />

        <span id={instructionsId} className="sr-only">
          {isZoomed
            ? "Move the pointer or drag to inspect the image. Press Escape to reset."
            : "Activate to zoom in at the selected point."}
        </span>
      </button>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-ui border border-border bg-surface/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur"
      >
        {isZoomed ? "Move to inspect" : "Click to zoom"}
      </span>
    </div>
  );
}
