import { useEffect, type ReactNode } from "react";
import { Extension, Mark, Node, mergeAttributes } from "@tiptap/core";
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
  CornerDownLeft,
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
  "120": "foihk-leading-120",
  "135": "foihk-leading-135",
  "150": "foihk-leading-150",
  "175": "foihk-leading-175",
  "200": "foihk-leading-200",
  "225": "foihk-leading-225",
  "250": "foihk-leading-250",
} as const;

const LEGACY_LEADING_CLASS_BY_LEADING = {
  tight: "foihk-leading-tight",
  normal: "foihk-leading-normal",
  loose: "foihk-leading-loose",
} as const;

const BLOCK_GAP_CLASS_BY_GAP = {
  "8": "foihk-block-gap-8",
  "12": "foihk-block-gap-12",
  "16": "foihk-block-gap-16",
  "24": "foihk-block-gap-24",
  "32": "foihk-block-gap-32",
  "48": "foihk-block-gap-48",
} as const;

const ALIGN_CLASS_BY_ALIGN = {
  left: "foihk-align-left",
  center: "foihk-align-center",
  right: "foihk-align-right",
} as const;

const PARAGRAPH_CLASS_BY_VARIANT = {
  note: "foihk-paragraph-note",
} as const;

const SPACER_CLASS_BY_SIZE = {
  one: "foihk-spacer-1",
  two: "foihk-spacer-2",
  section: "foihk-spacer-section",
} as const;

type FontSizeValue = keyof typeof FONT_SIZE_CLASS_BY_SIZE;
type FontFamilyValue = keyof typeof FONT_FAMILY_CLASS_BY_FAMILY;
type LineHeightValue = keyof typeof LEADING_CLASS_BY_LEADING;
type BlockGapValue = keyof typeof BLOCK_GAP_CLASS_BY_GAP;
type TextAlignValue = keyof typeof ALIGN_CLASS_BY_ALIGN;
type ParagraphStyleValue = "paragraph" | "heading2" | "heading3" | "quote" | "note";
type SpacerSizeValue = keyof typeof SPACER_CLASS_BY_SIZE;

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
        types: ["paragraph", "heading", "blockquote", "listItem", "bulletList", "orderedList"],
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
              for (const [leading, className] of Object.entries(LEADING_CLASS_BY_LEADING)) {
                if (element.classList.contains(className)) return leading;
              }
              if (element.classList.contains(LEGACY_LEADING_CLASS_BY_LEADING.tight)) return "150";
              if (element.classList.contains(LEGACY_LEADING_CLASS_BY_LEADING.normal)) return "175";
              if (element.classList.contains(LEGACY_LEADING_CLASS_BY_LEADING.loose)) return "200";
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

const BlockGap = Extension.create({
  name: "blockGap",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "blockquote", "bulletList", "orderedList"],
        attributes: {
          blockGap: {
            default: null,
            parseHTML: (element) => {
              for (const [gap, className] of Object.entries(BLOCK_GAP_CLASS_BY_GAP)) {
                if (element.classList.contains(className)) return gap;
              }
              return null;
            },
            renderHTML: (attributes) => {
              const blockGap = attributes.blockGap as BlockGapValue | null;
              if (!blockGap || !BLOCK_GAP_CLASS_BY_GAP[blockGap]) return {};
              return { class: BLOCK_GAP_CLASS_BY_GAP[blockGap] };
            },
          },
        },
      },
    ];
  },
});

const EmptyParagraphSpacer = Extension.create({
  name: "emptyParagraphSpacer",

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { editor } = this;
        const { selection } = editor.state;
        const { $from, empty } = selection;
        const parent = $from.parent;

        if (!empty || parent.type.name !== "paragraph" || parent.content.size > 0) return false;
        if ($from.parentOffset !== 0 || $from.depth === 0) return false;
        if (["listItem", "tableCell", "tableHeader"].includes($from.node($from.depth - 1).type.name)) return false;

        const from = $from.before($from.depth);
        const to = $from.after($from.depth);

        return editor.commands.insertContentAt(
          { from, to },
          [
            { type: "spacer", attrs: { size: "one" } },
            { type: "paragraph" },
          ],
          { updateSelection: true },
        );
      },
    };
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

const Spacer = Node.create({
  name: "spacer",

  group: "block",
  atom: true,

  parseHTML() {
    return Object.entries(SPACER_CLASS_BY_SIZE).map(([size, className]) => ({
      tag: `div.${className}`,
      getAttrs: () => ({ size }),
    }));
  },

  renderHTML({ node, HTMLAttributes }) {
    const size = node.attrs.size as SpacerSizeValue;
    const className = SPACER_CLASS_BY_SIZE[size] || SPACER_CLASS_BY_SIZE.one;
    return ["div", mergeAttributes(HTMLAttributes, { class: className, "aria-hidden": "true" })];
  },

  addAttributes() {
    return {
      size: {
        default: "one",
      },
    };
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
      BlockGap,
      EmptyParagraphSpacer,
      ParagraphVariant,
      Spacer,
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
        class: "foihk-article-content foihk-admin-editor min-h-[360px] rounded-md px-4 py-3 focus:outline-none",
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
    || "default";
  const blockGap = (editor?.getAttributes("paragraph").blockGap as BlockGapValue | undefined)
    || (editor?.getAttributes("heading").blockGap as BlockGapValue | undefined)
    || (editor?.getAttributes("blockquote").blockGap as BlockGapValue | undefined)
    || (editor?.getAttributes("bulletList").blockGap as BlockGapValue | undefined)
    || (editor?.getAttributes("orderedList").blockGap as BlockGapValue | undefined)
    || "default";
  const textAlign = (editor?.getAttributes("heading").align as TextAlignValue | undefined)
    || (editor?.getAttributes("paragraph").align as TextAlignValue | undefined)
    || (editor?.getAttributes("blockquote").align as TextAlignValue | undefined)
    || (editor?.getAttributes("listItem").align as TextAlignValue | undefined)
    || (editor?.getAttributes("bulletList").align as TextAlignValue | undefined)
    || (editor?.getAttributes("orderedList").align as TextAlignValue | undefined)
    || "left";

  const updateSelectedNodeAttributes = (types: string[], attrs: Record<string, unknown>) => {
    if (!editor) return;
    const { state, view } = editor;
    const { from, to } = state.selection;
    const tr = state.tr;
    let updated = false;

    state.doc.nodesBetween(from, to, (node, pos) => {
      if (types.includes(node.type.name)) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
        updated = true;
      }
    });

    if (!updated) {
      const commands = editor.chain().focus();
      types.forEach((type) => commands.updateAttributes(type, attrs));
      commands.run();
      return;
    }

    view.dispatch(tr);
    view.focus();
  };

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

  const setLineHeight = (leading: LineHeightValue | "default") => {
    if (!editor) return;
    const nextLeading = leading === "default" ? null : leading;
    updateSelectedNodeAttributes(["paragraph", "heading", "blockquote", "listItem"], { leading: nextLeading });
  };

  const setBlockGap = (blockGap: BlockGapValue | "default") => {
    if (!editor) return;
    const nextBlockGap = blockGap === "default" ? null : blockGap;
    updateSelectedNodeAttributes(["paragraph", "heading", "blockquote", "bulletList", "orderedList"], { blockGap: nextBlockGap });
  };

  const setTextAlign = (align: TextAlignValue) => {
    if (!editor) return;
    updateSelectedNodeAttributes(["paragraph", "heading", "blockquote", "listItem", "bulletList", "orderedList"], { align });
  };

  const insertSpacer = (size: SpacerSizeValue) => {
    if (!editor) return;
    if (!SPACER_CLASS_BY_SIZE[size]) return;
    editor.chain().focus().insertContent({ type: "spacer", attrs: { size } }).run();
  };

  const clearAllFormatting = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .clearNodes()
      .unsetAllMarks()
      .updateAttributes("paragraph", { align: null, blockGap: null, leading: null, variant: null })
      .updateAttributes("heading", { align: null, blockGap: null, leading: null })
      .updateAttributes("blockquote", { blockGap: null, leading: null })
      .updateAttributes("listItem", { leading: null })
      .updateAttributes("bulletList", { blockGap: null })
      .updateAttributes("orderedList", { blockGap: null })
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
            label="行间距"
            value={lineHeight}
            onValueChange={(nextValue) => setLineHeight(nextValue as LineHeightValue | "default")}
            items={[
              { value: "default", label: "默认" },
              { value: "120", label: "1.2" },
              { value: "135", label: "1.35" },
              { value: "150", label: "1.5" },
              { value: "175", label: "1.75" },
              { value: "200", label: "2.0" },
              { value: "225", label: "2.25" },
              { value: "250", label: "2.5" },
            ]}
          />
          <ToolbarSelect
            label="段落距离"
            value={blockGap}
            onValueChange={(nextValue) => setBlockGap(nextValue as BlockGapValue | "default")}
            items={[
              { value: "default", label: "默认" },
              { value: "8", label: "8px" },
              { value: "12", label: "12px" },
              { value: "16", label: "16px" },
              { value: "24", label: "24px" },
              { value: "32", label: "32px" },
              { value: "48", label: "48px" },
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
          <ToolbarButton label="换行" onClick={() => editor?.chain().focus().setHardBreak().run()}>
            <CornerDownLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarSelect
            label="插入真实空行"
            value="placeholder"
            onValueChange={(nextValue) => insertSpacer(nextValue as SpacerSizeValue)}
            items={[
              { value: "placeholder", label: "选择" },
              { value: "one", label: "1 行" },
              { value: "two", label: "2 行" },
              { value: "section", label: "分节空隙" },
            ]}
          />
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
          <ToolbarButton label="清除行间距" onClick={() => setLineHeight("default")}>
            <span className="text-xs font-semibold">1.0</span>
          </ToolbarButton>
          <ToolbarButton label="清除段落距离" onClick={() => setBlockGap("default")}>
            <span className="text-xs font-semibold">0</span>
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
