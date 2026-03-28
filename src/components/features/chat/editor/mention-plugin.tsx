"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, TextNode } from "lexical";
import { useEffect } from "react";
import { MentionNode, $createMentionNode } from "./mention-node";

interface MentionPluginProps {
  onSearchChange: (search: string, type: "user" | "channel") => void;
  onPositionChange: (position: { top: number; left: number }) => void;
}

export function MentionPlugin({ onSearchChange, onPositionChange }: MentionPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const anchorNode = selection.anchor.getNode();
          const anchorOffset = selection.anchor.offset;

          if (anchorNode instanceof TextNode) {
            const textContent = anchorNode.getTextContent().slice(0, anchorOffset);
            const lastAtIndex = textContent.lastIndexOf("@");
            const lastHashIndex = textContent.lastIndexOf("#");

            const isAfterAt = lastAtIndex !== -1 && (lastHashIndex === -1 || lastAtIndex > lastHashIndex);
            const isAfterHash = lastHashIndex !== -1 && (lastAtIndex === -1 || lastHashIndex > lastAtIndex);

            if (isAfterAt) {
              const query = textContent.slice(lastAtIndex + 1);
              if (!query.includes(" ")) {
                onSearchChange(query, "user");
                const domRange = window.getSelection()?.getRangeAt(0);
                if (domRange) {
                  const rect = domRange.getBoundingClientRect();
                  onPositionChange({ top: rect.top, left: rect.left });
                }
                return;
              }
            }

            if (isAfterHash) {
              const query = textContent.slice(lastHashIndex + 1);
              if (!query.includes(" ")) {
                onSearchChange(query, "channel");
                const domRange = window.getSelection()?.getRangeAt(0);
                if (domRange) {
                  const rect = domRange.getBoundingClientRect();
                  onPositionChange({ top: rect.top, left: rect.left });
                }
                return;
              }
            }
          }
        }
        onSearchChange("", "user"); // Clear search
      });
    });
  }, [editor, onSearchChange, onPositionChange]);

  return null;
}
