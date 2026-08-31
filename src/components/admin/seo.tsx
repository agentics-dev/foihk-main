import { useState, type ReactNode } from "react";
import { ChevronDown, GripVertical, X } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export const CharCounter = ({ current, recommendedMax, greenMax }: { current: number; recommendedMax: number; greenMax: number }) => {
  const color = current <= greenMax ? "text-emerald-600" : current <= recommendedMax ? "text-amber-600" : "text-red-600";
  return <p className={cn("text-right text-xs font-medium tabular-nums", color)}>{current} / {recommendedMax}</p>;
};

const MAX_KEYWORDS = 20;

const SortableTag = ({ id, label, onRemove }: { id: string; label: string; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <span ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
      <button type="button" className="shrink-0 cursor-grab text-muted-foreground" aria-label={`Reorder keyword ${label}`} {...attributes} {...listeners}>
        <GripVertical className="h-3 w-3" />
      </button>
      <span className="break-all">{label}</span>
      <button type="button" onClick={onRemove} aria-label={`Remove keyword ${label}`} className="shrink-0 text-muted-foreground hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
};

export const KeywordTagInput = ({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (value: string[]) => void; placeholder?: string }) => {
  const [input, setInput] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addTerms = (raw: string) => {
    const additions = raw.split(/[,，\n]/).map((term) => term.trim()).filter(Boolean);
    if (additions.length === 0) return;
    const next = [...value];
    const seen = new Set(value.map((term) => term.toLocaleLowerCase()));
    additions.forEach((term) => {
      const key = term.toLocaleLowerCase();
      if (!seen.has(key) && next.length < MAX_KEYWORDS) {
        seen.add(key);
        next.push(term);
      }
    });
    onChange(next);
    setInput("");
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((term) => term === active.id);
    const newIndex = value.findIndex((term) => term === over.id);
    if (oldIndex >= 0 && newIndex >= 0) onChange(arrayMove(value, oldIndex, newIndex));
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 min-w-0 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value} strategy={horizontalListSortingStrategy}>
            {value.map((term) => <SortableTag key={term} id={term} label={term} onRemove={() => onChange(value.filter((item) => item !== term))} />)}
          </SortableContext>
        </DndContext>
        <input
          id={id}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTerms(input);
            } else if (event.key === "Backspace" && input === "" && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => addTerms(input)}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or comma to add. Recommended: 3-6 keywords ({value.length} added). Feeds Article Schema; no meta keywords tag is created.</p>
    </div>
  );
};

const truncate = (text: string, max: number) => text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export const SerpPreview = ({ title, description, url }: { title: string; description: string; url: string }) => (
  <div className="min-w-0 space-y-1 rounded-md border border-border bg-background p-4">
    <p className="text-xs text-muted-foreground">Google preview</p>
    <p className="truncate text-sm text-emerald-700">{url}</p>
    <p className="break-words text-lg leading-6 text-blue-700">{truncate(title || "Page title", 60)}</p>
    <p className="break-words text-sm leading-5 text-muted-foreground">{truncate(description || "Meta description will appear here.", 160)}</p>
  </div>
);

export const CollapsibleSection = ({ title, description, defaultOpen = true, children }: { title: string; description?: string; defaultOpen?: boolean; children: ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="min-w-0 rounded-lg border border-border bg-card">
      <CollapsibleTrigger asChild>
        <button type="button" className="flex w-full min-w-0 items-center justify-between gap-3 p-4 text-left">
          <span className="min-w-0">
            <span className="block break-words text-sm font-semibold text-foreground">{title}</span>
            {description && <span className="mt-0.5 block break-words text-xs text-muted-foreground">{description}</span>}
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="min-w-0 border-t border-border p-4">{children}</CollapsibleContent>
    </Collapsible>
  );
};
