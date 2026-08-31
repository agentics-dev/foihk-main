import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ArticleFaqDraft {
  clientId: string;
  id?: string;
  enabled: boolean;
  question: string;
  answer: string;
  question_zhtw: string;
  answer_zhtw: string;
  question_zhcn: string;
  answer_zhcn: string;
}

interface ArticleFaqEditorProps {
  items: ArticleFaqDraft[];
  onChange: (items: ArticleFaqDraft[]) => void;
  language: "en" | "zhtw" | "zhcn";
}

const newFaq = (): ArticleFaqDraft => ({
  clientId: crypto.randomUUID(),
  enabled: true,
  question: "",
  answer: "",
  question_zhtw: "",
  answer_zhtw: "",
  question_zhcn: "",
  answer_zhcn: "",
});

const SortableFaq = ({
  item,
  index,
  language,
  onUpdate,
  onRemove,
}: {
  item: ArticleFaqDraft;
  index: number;
  language: "en" | "zhtw" | "zhcn";
  onUpdate: (patch: Partial<ArticleFaqDraft>) => void;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.clientId });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const fields = language === "zhtw"
    ? { question: "question_zhtw" as const, answer: "answer_zhtw" as const, label: "繁體中文" }
    : language === "zhcn"
      ? { question: "question_zhcn" as const, answer: "answer_zhcn" as const, label: "简体中文" }
      : { question: "question" as const, answer: "answer" as const, label: "English" };
  const currentLanguageIncomplete = !item[fields.question].trim() || !item[fields.answer].trim();

  return (
    <section ref={setNodeRef} style={style} className="border border-border bg-background p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" className="cursor-grab text-muted-foreground" aria-label={`Reorder FAQ ${index + 1}`} {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5" />
        </button>
        <strong className="text-sm">FAQ {index + 1}</strong>
        <div className="ml-auto flex items-center gap-2">
          <Switch checked={item.enabled} onCheckedChange={(enabled) => onUpdate({ enabled })} aria-label={`Enable FAQ ${index + 1}`} />
          <span className="text-sm text-muted-foreground">{item.enabled ? "Enabled" : "Disabled"}</span>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} title="Remove FAQ">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentLanguageIncomplete && item.enabled && (
        <p className="mb-3 text-sm text-amber-700">The {fields.label} question and answer must both be complete before this FAQ appears in that language.</p>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${item.clientId}-${fields.question}`}>Question ({fields.label})</Label>
          <Input
            id={`${item.clientId}-${fields.question}`}
            value={item[fields.question]}
            maxLength={300}
            onChange={(event) => onUpdate({ [fields.question]: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${item.clientId}-${fields.answer}`}>Answer ({fields.label})</Label>
          <Textarea
            id={`${item.clientId}-${fields.answer}`}
            value={item[fields.answer]}
            maxLength={5000}
            rows={4}
            onChange={(event) => onUpdate({ [fields.answer]: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">Use a concise, complete answer. This text will be visible in the article and included in FAQ Schema.</p>
        </div>
      </div>
    </section>
  );
};

export const ArticleFaqEditor = ({ items, onChange, language }: ArticleFaqEditorProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.clientId === active.id);
    const newIndex = items.findIndex((item) => item.clientId === over.id);
    onChange(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="text-lg font-semibold">Article FAQ</h2>
          <p className="text-sm text-muted-foreground">Each language is evaluated independently. Only enabled pairs with both a question and an answer appear on that language page and in its FAQ Schema.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => onChange([...items, newFaq()])}>
          <Plus className="mr-2 h-4 w-4" /> Add FAQ
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.clientId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {items.map((item, index) => (
              <SortableFaq
                key={item.clientId}
                item={item}
                index={index}
                language={language}
                onUpdate={(patch) => onChange(items.map((candidate) => candidate.clientId === item.clientId ? { ...candidate, ...patch } : candidate))}
                onRemove={() => onChange(items.filter((candidate) => candidate.clientId !== item.clientId))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {items.length === 0 && <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No article FAQs yet.</p>}
    </div>
  );
};
