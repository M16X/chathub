"use client";

import type { FC } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { useShikiHighlighter, type ShikiHighlighterProps } from "react-shiki";
import { useAuiState } from "@assistant-ui/react";
import type { SyntaxHighlighterProps as AUIProps } from "@assistant-ui/react-markdown";
import { cn } from "@/lib/utils";

import { ScrollBar } from "@/components/ui/scroll-area";

/**
 * Props for the SyntaxHighlighter component
 */
export type HighlighterProps = Omit<
  ShikiHighlighterProps,
  "children" | "theme"
> & {
  theme?: ShikiHighlighterProps["theme"];
} & Pick<AUIProps, "language" | "code"> &
  Partial<Pick<AUIProps, "node" | "components">>;

const containerClassName =
  "aui-shiki-base border-border/50 bg-muted/30 rounded-t-none rounded-b-xl border border-t-0";

// The scrollable inner div carries the pre styling; `w-max` lets long lines
// extend past the viewport so the horizontal scrollbar has a range, while
// `min-w-full` keeps short code stretched to the box.
const contentClassName =
  "[&_.line]:px-0! [&_pre]:m-0 [&_pre]:w-max [&_pre]:min-w-full [&_pre]:bg-muted/30! [&_pre]:p-3.5 [&_pre]:text-[13px] [&_pre]:leading-relaxed";

const PlainCode: FC<{ code: string }> = ({ code }) => (
  <pre>
    <code>{code}</code>
  </pre>
);

const HighlightedCode: FC<{
  code: string;
  language: HighlighterProps["language"];
  theme: NonNullable<HighlighterProps["theme"]>;
  options: Omit<ShikiHighlighterProps, "children" | "language" | "theme">;
}> = ({ code, language, theme, options }) => {
  const highlighted = useShikiHighlighter(code, language, theme, {
    ...options,
    defaultColor: "light-dark()",
  });
  return <>{highlighted ?? <PlainCode code={code} />}</>;
};

/**
 * SyntaxHighlighter component, using react-shiki
 * Use it by passing to `defaultComponents` in `markdown-text.tsx`
 *
 * Skips tokenization while the message part is streaming and renders the
 * plain code in the same container, so streaming costs no Shiki work and
 * settling is a color change rather than a layout shift.
 *
 * @example
 * const defaultComponents = memoizeMarkdownComponents({
 *   SyntaxHighlighter,
 *   h1: //...
 *   //...other elements...
 * });
 */
export const SyntaxHighlighter: FC<HighlighterProps> = ({
  code,
  language,
  theme = { dark: "github-dark-default", light: "github-light-default" },
  className,
  style,
  // Inert: useShikiHighlighter output has no default styles or language label.
  addDefaultStyles: _addDefaultStyles,
  showLanguage: _showLanguage,
  delay = 150, // the part settles before smooth streaming finishes draining, so code keeps changing for a few frames
  node: _node,
  components: _components,
  ...options
}) => {
  const isStreaming = useAuiState(
    (s) => s.optional.part?.status.type === "running",
  );
  const trimmed = code.trim();

  return (
    <ScrollAreaPrimitive.Root
      className={cn(
        containerClassName,
        isStreaming && "aui-shiki-streaming",
        className,
      )}
      style={style}
    >
      <ScrollAreaPrimitive.Viewport asChild>
        <div className={contentClassName}>
          {isStreaming ? (
            <PlainCode code={trimmed} />
          ) : (
            <HighlightedCode
              code={trimmed}
              language={language}
              theme={theme}
              options={{ ...options, delay }}
            />
          )}
        </div>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="horizontal" />
    </ScrollAreaPrimitive.Root>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
