"use generative";

import { defineToolkit } from "@assistant-ui/react";
import {
  JSONGenerativeUI,
  defaultGenerativeUILibrary,
  defineGenerativeComponents,
} from "@assistant-ui/react-generative-ui";
import { styledGenerativeUILibrary } from "@/components/assistant-ui/elements/generative-ui";

const markdown = defaultGenerativeUILibrary.Markdown!;

const generative = new JSONGenerativeUI({
  library: {
    ...defaultGenerativeUILibrary,
    ...defineGenerativeComponents({
      Markdown: {
        properties: markdown.properties,
        streamProperties: markdown.streamProperties,
        description:
          "A markdown string, rendered with GitHub-flavored markdown.",
        render: styledGenerativeUILibrary.Markdown!.render,
      },
    }),
  },
});

export default defineToolkit({
  present: generative.present({ display: "standalone" }),
});
