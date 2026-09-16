"use client";

import {
  ComposerPrimitive,
  unstable_useSlashCommandAdapter,
  useAui,
  type Unstable_SlashCommand,
} from "@assistant-ui/react";
import { useMemo, type FC } from "react";

const useSlashCommands = () => {
  const aui = useAui();

  return useMemo<readonly Unstable_SlashCommand[]>(
    () => [
      {
        id: "new",
        description: "Start a new chat",
        execute: () => aui.threads.switchToNewThread(),
      },
      {
        id: "summarize",
        description: "Summarize the conversation so far",
        execute: () => aui.thread.append("Summarize this conversation so far."),
      },
      {
        id: "explain",
        description: "Explain the last answer in more detail",
        execute: () =>
          aui.thread.append("Explain your last answer in more detail."),
      },
    ],
    [aui],
  );
};

export const SlashCommandPopover: FC = () => {
  const commands = useSlashCommands();
  const slash = unstable_useSlashCommandAdapter({
    commands,
    removeOnExecute: true,
  });

  return (
    <ComposerPrimitive.Unstable_TriggerPopover
      char="/"
      adapter={slash.adapter}
      aria-label="Slash commands"
      className="absolute inset-x-2 bottom-full z-50 mb-2 max-h-64 overflow-y-auto rounded-2xl border border-[#e5e5e5] bg-white p-1.5 shadow-lg dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
    >
      <ComposerPrimitive.Unstable_TriggerPopover.Action {...slash.action} />
      <ComposerPrimitive.Unstable_TriggerPopoverItems>
        {(items) =>
          items.map((item, index) => (
            <ComposerPrimitive.Unstable_TriggerPopoverItem
              key={item.id}
              item={item}
              index={index}
              className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-xl px-2.5 py-1.5 text-start text-sm text-[#0d0d0d] outline-none select-none data-highlighted:bg-[#f0f0f0] dark:text-white dark:data-highlighted:bg-[#2a2a2a]"
            >
              <span className="font-medium">{item.label}</span>
              {item.description && (
                <span className="text-xs text-[#9a9a9a] dark:text-[#6b6b6b]">
                  {item.description}
                </span>
              )}
            </ComposerPrimitive.Unstable_TriggerPopoverItem>
          ))
        }
      </ComposerPrimitive.Unstable_TriggerPopoverItems>
    </ComposerPrimitive.Unstable_TriggerPopover>
  );
};
