"use client";

import type { ReactNode } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

import {
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
} from "@/components/assistant-ui/reasoning";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const LOREM = Array.from({ length: 40 }, (_, i) => (
  <p key={i} className="py-1">
    Paragraph {i} — scrolling probe content that keeps going and going.
  </p>
));

export default function ScrollTest() {
  return (
    <div className="flex h-screen flex-col gap-8 overflow-hidden p-8">
      <h1 className="text-lg font-bold">Scroll diagnostics</h1>

      <section id="case-shared" data-testid="case-shared" className="h-48 shrink-0">
        <ScrollAreaProbe>{LOREM}</ScrollAreaProbe>
      </section>

      <section
        id="case-thread"
        data-testid="case-thread"
        className="relative flex h-48 shrink-0 flex-col bg-white"
      >
        <ThreadShapeViewport>{LOREM}</ThreadShapeViewport>
      </section>

      <section id="case-reasoning" data-testid="case-reasoning" className="w-96 shrink-0">
        <ReasoningProbe>{LOREM}</ReasoningProbe>
      </section>
    </div>
  );
}

function ScrollAreaProbe({ children }: { children: ReactNode }) {
  return (
    <ScrollArea className="h-full rounded-lg border">
      <div className="px-4 py-2">{children}</div>
    </ScrollArea>
  );
}

function ThreadShapeViewport({ children }: { children: ReactNode }) {
  return (
    <ScrollAreaPrimitive.Root asChild>
      <div className="flex grow flex-col items-stretch px-4">
        <ScrollAreaPrimitive.Viewport className="thread-viewport" asChild>
          <div className="grow pt-16">{children}</div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
      </div>
    </ScrollAreaPrimitive.Root>
  );
}

function ReasoningProbe({ children }: { children: ReactNode }) {
  return (
    <ReasoningRoot defaultOpen variant="outline">
      <ReasoningContent>
        <ReasoningText>{children}</ReasoningText>
      </ReasoningContent>
    </ReasoningRoot>
  );
}
