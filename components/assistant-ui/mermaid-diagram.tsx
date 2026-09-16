"use client";

import { mermaid } from "@streamdown/mermaid";
import { useAuiState } from "@assistant-ui/react";
import { useEffect, useId, useState, type FC } from "react";
import { cn } from "@/lib/utils";

type MermaidDiagramProps = {
  code: string;
  language: string;
  node?: unknown;
  components?: unknown;
};

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");

const hashChart = (chart: string) =>
  chart.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);

/**
 * Renders a mermaid code block as a diagram.
 *
 * Used via `componentsByLanguage` so mermaid fences bypass the global
 * `SyntaxHighlighter` (which would otherwise render them as plain code
 * and prevent Streamdown's diagram handling from running).
 *
 * While the message is streaming, the raw source is shown to avoid
 * rendering partial diagrams that error and flicker. Once streaming
 * settles, the chart is rendered to SVG. Invalid charts fall back
 * to the raw source.
 */
export const MermaidDiagram: FC<MermaidDiagramProps> = ({ code }) => {
  const isStreaming = useAuiState(
    (s) => s.optional.part?.status.type === "running",
  );
  const rawId = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const chart = code.trim();

  useEffect(() => {
    if (isStreaming || chart.length === 0) return;

    let cancelled = false;
    setIsRendering(true);
    setError(null);

    const renderChart = async () => {
      try {
        const id = `mermaid-${sanitizeId(rawId)}-${Math.abs(hashChart(chart))}`;
        const { svg: rendered } = await mermaid
          .getMermaid()
          .render(`${id}-${Date.now()}`, chart);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) {
          setSvg(null);
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };

    void renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart, isStreaming, rawId]);

  if (isStreaming || chart.length === 0) {
    return <MermaidSource code={chart} />;
  }

  if (error || (!svg && !isRendering)) {
    return <MermaidSource code={chart} />;
  }

  if (!svg) {
    return (
      <div
        className="aui-mermaid-loading border-border/50 bg-muted/30 text-muted-foreground flex min-h-24 items-center justify-center gap-2 rounded-b-xl border border-t-0 p-4 text-sm"
        aria-busy="true"
      >
        <span className="border-current h-4 w-4 animate-spin rounded-full border-b-2" />
        <span>Rendering diagram…</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "aui-mermaid-diagram border-border/50 bg-background flex w-full items-center justify-center overflow-x-auto rounded-b-xl border border-t-0 p-4",
        "[&_svg]:h-auto [&_svg]:max-w-full",
      )}
      // mermaid produces trusted SVG from the chart source; rendered via innerHTML
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

MermaidDiagram.displayName = "MermaidDiagram";

const MermaidSource: FC<{ code: string }> = ({ code }) => (
  <pre className="aui-mermaid-source border-border/50 bg-muted/30 overflow-x-auto rounded-b-xl border border-t-0 p-3.5 text-[13px] leading-relaxed">
    <code>{code}</code>
  </pre>
);
