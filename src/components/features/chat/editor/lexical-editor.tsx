"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, EditorState, FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { HashtagNode } from "@lexical/hashtag";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { MentionNode, $createMentionNode } from "./mention-node";
import { MentionPlugin } from "./mention-plugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { CodeHighlightPlugin } from "@lexical/react/LexicalCodeHighlightPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS, $convertFromMarkdownString } from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "editor-placeholder",
  paragraph: "editor-paragraph",
  quote: "editor-quote",
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
    h4: "editor-heading-h4",
    h5: "editor-heading-h5",
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
    listitem: "editor-listitem",
  },
  image: "editor-image",
  link: "text-primary hover:underline cursor-pointer",
  text: {
    bold: "font-bold",
    italic: "italic",
    overflowed: "editor-text-overflowed",
    hashtag: "text-blue-500 font-medium",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-muted px-1 rounded font-mono text-sm",
  },
  code: "bg-muted p-4 rounded-lg font-mono text-sm block my-2 border border-border",
  codeHighlight: {
    atrule: "text-[#07a]",
    attr: "text-[#690]",
    boolean: "text-[#905]",
    builtin: "text-[#690]",
    cdata: "text-slate-500",
    char: "text-[#690]",
    class: "text-[#dd4a68]",
    "class-name": "text-[#dd4a68]",
    comment: "text-slate-500",
    constant: "text-[#905]",
    deleted: "text-[#905]",
    doctype: "text-slate-500",
    entity: "text-[#9a6e3a]",
    function: "text-[#dd4a68]",
    important: "text-[#e90]",
    inserted: "text-[#690]",
    keyword: "text-[#07a]",
    namespace: "text-[#e90]",
    number: "text-[#905]",
    operator: "text-[#9a6e3a]",
    prolog: "text-slate-500",
    property: "text-[#905]",
    punctuation: "text-[#999]",
    regex: "text-[#e90]",
    selector: "text-[#690]",
    string: "text-[#690]",
    symbol: "text-[#905]",
    tag: "text-[#905]",
    url: "text-[#9a6e3a]",
    variable: "text-[#e90]",
  },
};

interface EditorProps {
  onChange: (editorState: EditorState) => void;
  placeholder?: string;
  onEnter?: () => void;
  initialValue?: string;
  onMentionSearch?: (search: string, type: "user" | "channel") => void;
  onMentionPosition?: (position: { top: number; left: number }) => void;
  onEditorRef?: (editor: any) => void;
}

function OnEnterPlugin({ onEnter }: { onEnter?: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      "KEY_ENTER_COMMAND",
      (event: KeyboardEvent) => {
        if (event.shiftKey) {
          return false;
        }
        event.preventDefault();
        onEnter?.();
        return true;
      },
      1
    );
  }, [editor, onEnter]);

  return null;
}

function RefPlugin({ onEditorRef, initialValue }: { onEditorRef?: (editor: any) => void, initialValue?: string }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    onEditorRef?.(editor);
    if (initialValue) {
      editor.update(() => {
        $convertFromMarkdownString(initialValue, TRANSFORMERS);
      });
    }
  }, [editor, onEditorRef, initialValue]);
  return null;
}

export const LexicalEditor = forwardRef<any, EditorProps>(({
  onChange,
  placeholder,
  onEnter,
  initialValue,
  onMentionSearch,
  onMentionPosition,
  onEditorRef,
}, ref) => {
  const initialConfig = {
    namespace: "MessageComposer",
    theme,
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [
      HashtagNode,
      MentionNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative w-full">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[40px] max-h-[200px] outline-none py-2 px-3 resize-none overflow-auto" />
          }
          placeholder={
            <div className="absolute top-2 left-3 text-muted-foreground pointer-events-none select-none">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <HashtagPlugin />
        <ListPlugin />
        <LinkPlugin />
        <CodeHighlightPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={onChange} />
        <OnEnterPlugin onEnter={onEnter} />
        {onMentionSearch && onMentionPosition && (
          <MentionPlugin
            onSearchChange={onMentionSearch}
            onPositionChange={onMentionPosition}
          />
        )}
        <RefPlugin
          initialValue={initialValue}
          onEditorRef={(editor) => {
            onEditorRef?.(editor);
            if (typeof ref === 'function') {
                ref(editor);
            } else if (ref) {
                ref.current = editor;
            }
        }} />
      </div>
    </LexicalComposer>
  );
})
