import { useEffect, type ReactNode } from "react";
import { Mark, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  RemoveFormatting,
  Unlink,
  Underline as UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

const FONT_SIZE_CLASS_BY_SIZE = {
  sm: "foihk-text-sm",
  lg: "foihk-text-lg",
} as const;

const FontSize = Mark.create({
  name: "fontSize",

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => {
          if (element.classList.contains(FONT_SIZE_CLASS_BY_SIZE.sm)) return "sm";
          if (element.classList.contains(FONT_SIZE_CLASS_BY_SIZE.lg)) return "lg";
          return null;
        },
        renderHTML: (attributes) => {
          const size = attributes.size as keyof typeof FONT_SIZE_CLASS_BY_SIZE | null;
          if (!size || !FONT_SIZE_CLASS_BY_SIZE[size]) return {};
          return { class: FONT_SIZE_CLASS_BY_SIZE[size] };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: `span.${FONT_SIZE_CLASS_BY_SIZE.sm}` },
      { tag: `span.${FONT_SIZE_CLASS_BY_SIZE.lg}` },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

export const RichTextEditor = ({ id, value, onChange, placeholder, required }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      FontSize,
      Link.configure({
        autolink: false,
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        allowBase64: false,
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        class: "foihk-admin-editor min-h-[360px] rounded-md px-4 py-3 focus:outline-none",
        "aria-required": required ? "true" : "false",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.isEmpty ? "" : activeEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.isEmpty ? "" : editor.getHTML();
    if ((value || "") !== currentHtml) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const currentHref = editor.getAttributes("link").href as string | undefined;
    const nextHref = window.prompt("Enter a safe link URL", currentHref || "https://");
    if (nextHref === null) return;
    const normalizedHref = normalizeLinkHref(nextHref);
    if (!normalizedHref) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedHref }).run();
  };

  const unsetFontSize = () => editor?.chain().focus().unsetMark("fontSize").run();
  const setFontSize = (size: "sm" | "lg") => editor?.chain().focus().setMark("fontSize", { size }).run();

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-input bg-background">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
          <ToolbarButton label="Paragraph" active={editor?.isActive("paragraph")} onClick={() => editor?.chain().focus().setParagraph().run()}>
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 2" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 3" active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Underline" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Small text" active={editor?.isActive("fontSize", { size: "sm" })} onClick={() => setFontSize("sm")}>
            <span className="text-xs font-semibold">小</span>
          </ToolbarButton>
          <ToolbarButton label="Normal text" active={!editor?.isActive("fontSize")} onClick={unsetFontSize}>
            <span className="text-sm font-semibold">A</span>
          </ToolbarButton>
          <ToolbarButton label="Large text" active={editor?.isActive("fontSize", { size: "lg" })} onClick={() => setFontSize("lg")}>
            <span className="text-base font-semibold">大</span>
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Bullet list" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="Set link" active={editor?.isActive("link")} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Remove link" onClick={() => editor?.chain().focus().unsetLink().run()}>
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Clear formatting" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} />
      </div>

      <details className="rounded-md border border-border bg-secondary/20 p-3">
        <summary className="cursor-pointer text-sm font-medium text-foreground">Advanced: source HTML</summary>
        <Textarea
          className="mt-3 min-h-[220px] font-mono text-sm"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </details>
    </div>
  );
};

const ToolbarButton = ({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <Button
    type="button"
    size="icon"
    variant={active ? "secondary" : "ghost"}
    className={cn("h-8 w-8", active && "bg-secondary text-primary")}
    title={label}
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
  >
    {children}
  </Button>
);

const Divider = () => <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />;

const normalizeLinkHref = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  try {
    const url = new URL(trimmed);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return url.toString();
  } catch {
    return "";
  }

  return "";
};
