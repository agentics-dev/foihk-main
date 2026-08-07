import { useEffect, type ReactNode } from "react";
import { Extension, Mark, mergeAttributes } from "@tiptap/core";
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
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Unlink,
  Underline as UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  "12": "foihk-size-12",
  "14": "foihk-size-14",
  "16": "foihk-size-16",
  "18": "foihk-size-18",
  "20": "foihk-size-20",
  "24": "foihk-size-24",
  "28": "foihk-size-28",
  "32": "foihk-size-32",
  sm: "foihk-text-sm",
  lg: "foihk-text-lg",
  xl: "foihk-text-xl",
} as const;

const FONT_FAMILY_CLASS_BY_FAMILY = {
  sans: "foihk-font-sans",
  song: "foihk-font-song",
  serif: "foihk-font-serif",
  mono: "foihk-font-mono",
} as const;

const LEADING_CLASS_BY_LEADING = {
  tight: "foihk-leading-tight",
  normal: "foihk-leading-normal",
  loose: "foihk-leading-loose",
} as const;

const ALIGN_CLASS_BY_ALIGN = {
  left: "foihk-align-left",
  center: "foihk-align-center",
  right: "foihk-align-right",
} as const;

const PARAGRAPH_CLASS_BY_VARIANT = {
  note: "foihk-paragraph-note",
} as const;

type FontSizeValue = keyof typeof FONT_SIZE_CLASS_BY_SIZE;
type FontFamilyValue = keyof typeof FONT_FAMILY_CLASS_BY_FAMILY;
type LineHeightValue = keyof typeof LEADING_CLASS_BY_LEADING;
type TextAlignValue = keyof typeof ALIGN_CLASS_BY_ALIGN;
type ParagraphStyleValue = "paragraph" | "heading2" | "heading3" | "quote" | "note";

const FontSize = Mark.create({
  name: "fontSize",

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => {
          for (const [size, className] of Object.entries(FONT_SIZE_CLASS_BY_SIZE)) {
            if (element.classList.contains(className)) return size;
          }
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
    return Object.values(FONT_SIZE_CLASS_BY_SIZE).map((className) => ({ tag: `span.${className}` }));
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

const FontFamily = Mark.create({
  name: "fontFamily",

  addAttributes() {
    return {
      family: {
        default: null,
        parseHTML: (element) => {
          if (element.classList.contains(FONT_FAMILY_CLASS_BY_FAMILY.sans)) return "sans";
          if (element.classList.contains(FONT_FAMILY_CLASS_BY_FAMILY.song)) return "song";
          if (element.classList.contains(FONT_FAMILY_CLASS_BY_FAMILY.serif)) return "serif";
          if (element.classList.contains(FONT_FAMILY_CLASS_BY_FAMILY.mono)) return "mono";
          return null;
        },
        renderHTML: (attributes) => {
          const family = attributes.family as FontFamilyValue | null;
          if (!family || !FONT_FAMILY_CLASS_BY_FAMILY[family]) return {};
          return { class: FONT_FAMILY_CLASS_BY_FAMILY[family] };
        },
      },
    };
  },

  parseHTML() {
    return Object.values(FONT_FAMILY_CLASS_BY_FAMILY).map((className) => ({ tag: `span.${className}` }));
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

const TextAlignment = Extension.create({
  name: "textAlignment",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          align: {
            default: null,
            parseHTML: (element) => {
              if (element.classList.contains(ALIGN_CLASS_BY_ALIGN.center)) return "center";
              if (element.classList.contains(ALIGN_CLASS_BY_ALIGN.right)) return "right";
              if (element.classList.contains(ALIGN_CLASS_BY_ALIGN.left)) return "left";
              return null;
            },
            renderHTML: (attributes) => {
              const align = attributes.align as TextAlignValue | null;
              if (!align || !ALIGN_CLASS_BY_ALIGN[align]) return {};
              return { class: ALIGN_CLASS_BY_ALIGN[align] };
            },
          },
        },
      },
    ];
  },
});

const LineHeight = Extension.create({
  name: "lineHeight",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "blockquote", "listItem"],
        attributes: {
          leading: {
            default: null,
            parseHTML: (element) => {
              if (element.classList.contains(LEADING_CLASS_BY_LEADING.tight)) return "tight";
              if (element.classList.contains(LEADING_CLASS_BY_LEADING.normal)) return "normal";
              if (element.classList.contains(LEADING_CLASS_BY_LEADING.loose)) return "loose";
              return null;
            },
            renderHTML: (attributes) => {
              const leading = attributes.leading as LineHeightValue | null;
              if (!leading || !LEADING_CLASS_BY_LEADING[leading]) return {};
              return { class: LEADING_CLASS_BY_LEADING[leading] };
            },
          },
        },
      },
    ];
  },
});

const ParagraphVariant = Extension.create({
  name: "paragraphVariant",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          variant: {
            default: null,
            parseHTML: (element) => (element.classList.contains(PARAGRAPH_CLASS_BY_VARIANT.note) ? "note" : null),
            renderHTML: (attributes) => {
              if (attributes.variant !== "note") return {};
              return { class: PARAGRAPH_CLASS_BY_VARIANT.note };
            },
          },
        },
      },
    ];
  },
});

export const RichTextEditor = ({ id, value, onChange, placeholder, required }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      FontSize,
      FontFamily,
      TextAlignment,
      LineHeight,
      ParagraphVariant,
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

  const paragraphStyle = editor?.isActive("heading", { level: 2 })
    ? "heading2"
    : editor?.isActive("heading", { level: 3 })
      ? "heading3"
      : editor?.isActive("blockquote")
        ? "quote"
        : editor?.getAttributes("paragraph").variant === "note"
          ? "note"
          : "paragraph";
  const fontFamily = (editor?.getAttributes("fontFamily").family as FontFamilyValue | undefined) || "default";
  const fontSize = (editor?.getAttributes("fontSize").size as FontSizeValue | undefined) || "16";
  const lineHeight = (editor?.getAttributes("paragraph").leading as LineHeightValue | undefined)
    || (editor?.getAttributes("heading").leading as LineHeightValue | undefined)
    || (editor?.getAttributes("blockquote").leading as LineHeightValue | undefined)
    || (editor?.getAttributes("listItem").leading as LineHeightValue | undefined)
    || "normal";
  const textAlign = (editor?.getAttributes("heading").align as TextAlignValue | undefined)
    || (editor?.getAttributes("paragraph").align as TextAlignValue | undefined)
    || "left";

  const setParagraphStyle = (style: ParagraphStyleValue) => {
    if (!editor) return;
    if (style === "heading2") {
      editor.chain().focus().toggleHeading({ level: 2 }).updateAttributes("paragraph", { variant: null }).run();
      return;
    }
    if (style === "heading3") {
      editor.chain().focus().toggleHeading({ level: 3 }).updateAttributes("paragraph", { variant: null }).run();
      return;
    }
    if (style === "quote") {
      editor.chain().focus().setParagraph().updateAttributes("paragraph", { variant: null }).toggleBlockquote().run();
      return;
    }
    if (style === "note") {
      if (editor.isActive("blockquote")) editor.chain().focus().toggleBlockquote().run();
      editor.chain().focus().setParagraph().updateAttributes("paragraph", { variant: "note" }).run();
      return;
    }
    if (editor.isActive("blockquote")) editor.chain().focus().toggleBlockquote().run();
    editor.chain().focus().setParagraph().updateAttributes("paragraph", { variant: null }).run();
  };

  const setFontFamily = (family: FontFamilyValue | "default") => {
    if (!editor) return;
    if (family === "default") {
      editor.chain().focus().unsetMark("fontFamily").run();
      return;
    }
    editor.chain().focus().setMark("fontFamily", { family }).run();
  };

  const setFontSize = (size: FontSizeValue | "default") => {
    if (!editor) return;
    if (size === "default") {
      editor.chain().focus().unsetMark("fontSize").run();
      return;
    }
    editor.chain().focus().setMark("fontSize", { size }).run();
  };

  const setLineHeight = (leading: LineHeightValue) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .updateAttributes("paragraph", { leading })
      .updateAttributes("heading", { leading })
      .updateAttributes("blockquote", { leading })
      .updateAttributes("listItem", { leading })
      .run();
  };

  const setTextAlign = (align: TextAlignValue) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes("paragraph", { align }).updateAttributes("heading", { align }).run();
  };

  const clearAllFormatting = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .clearNodes()
      .unsetAllMarks()
      .updateAttributes("paragraph", { align: null, leading: null, variant: null })
      .updateAttributes("heading", { align: null, leading: null })
      .updateAttributes("blockquote", { leading: null })
      .updateAttributes("listItem", { leading: null })
      .run();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-input bg-background">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
          <ToolbarSelect
            label="段落样式"
            value={paragraphStyle}
            onValueChange={(nextValue) => setParagraphStyle(nextValue as ParagraphStyleValue)}
            items={[
              { value: "paragraph", label: "正文" },
              { value: "heading2", label: "小标题 H2" },
              { value: "heading3", label: "小标题 H3" },
              { value: "quote", label: "引言" },
              { value: "note", label: "注释" },
            ]}
          />
          <ToolbarSelect
            label="字体"
            value={fontFamily}
            onValueChange={(nextValue) => setFontFamily(nextValue as FontFamilyValue | "default")}
            items={[
              { value: "default", label: "默认品牌字体" },
              { value: "sans", label: "现代无衬线" },
              { value: "song", label: "中文宋体 / 明体" },
              { value: "serif", label: "英文衬线" },
              { value: "mono", label: "等宽字体" },
            ]}
          />
          <ToolbarSelect
            label="字号"
            value={fontSize}
            onValueChange={(nextValue) => setFontSize(nextValue as FontSizeValue | "default")}
            items={[
              { value: "12", label: "12" },
              { value: "14", label: "14" },
              { value: "16", label: "16 正文" },
              { value: "18", label: "18" },
              { value: "20", label: "20" },
              { value: "24", label: "24" },
              { value: "28", label: "28" },
              { value: "32", label: "32" },
            ]}
          />
          <ToolbarSelect
            label="行高"
            value={lineHeight}
            onValueChange={(nextValue) => setLineHeight(nextValue as LineHeightValue)}
            items={[
              { value: "tight", label: "紧凑" },
              { value: "normal", label: "标准" },
              { value: "loose", label: "宽松" },
            ]}
          />
          <Divider />
          <ToolbarButton label="粗体" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="斜体" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="下划线" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="项目列表" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="编号列表" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="引言" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="左对齐" active={textAlign === "left"} onClick={() => setTextAlign("left")}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="居中对齐" active={textAlign === "center"} onClick={() => setTextAlign("center")}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="右对齐" active={textAlign === "right"} onClick={() => setTextAlign("right")}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton label="设置链接" active={editor?.isActive("link")} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="移除链接" onClick={() => editor?.chain().focus().unsetLink().run()}>
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="清除字体" onClick={() => editor?.chain().focus().unsetMark("fontFamily").run()}>
            <Eraser className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="清除字号" onClick={() => editor?.chain().focus().unsetMark("fontSize").run()}>
            <span className="text-xs font-semibold">16</span>
          </ToolbarButton>
          <ToolbarButton label="清除全部格式" onClick={clearAllFormatting}>
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

const ToolbarSelect = ({
  label,
  value,
  onValueChange,
  items,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: Array<{ value: string; label: string }>;
}) => (
  <div className="flex items-center gap-1">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-[154px] px-2 text-xs" aria-label={label} title={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

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
