import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  onUpdate,
  onRemove,
}: {
  item: ArticleFaqDraft;
  index: number;
  onUpdate: (patch: Partial<ArticleFaqDraft>) => void;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.clientId });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const missingTranslations = [
    !item.question_zhtw.trim() || !item.answer_zhtw.trim() ? "繁體中文" : null,
    !item.question_zhcn.trim() || !item.answer_zhcn.trim() ? "简体中文" : null,
  ].filter(Boolean);

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

      {missingTranslations.length > 0 && item.enabled && (
        <p className="mb-3 text-sm text-amber-700">Missing translation: {missingTranslations.join(", ")}. Those languages will not output this FAQ.</p>
      )}

      <Tabs defaultValue="en">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="zhtw">繁體中文</TabsTrigger>
          <TabsTrigger value="zhcn">简体中文</TabsTrigger>
        </TabsList>
        {[
          { value: "en", questionKey: "question", answerKey: "answer", label: "English" },
          { value: "zhtw", questionKey: "question_zhtw", answerKey: "answer_zhtw", label: "繁體中文" },
          { value: "zhcn", questionKey: "question_zhcn", answerKey: "answer_zhcn", label: "简体中文" },
        ].map(({ value, questionKey, answerKey, label }) => (
          <TabsContent key={value} value={value} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor={`${item.clientId}-${questionKey}`}>Question ({label})</Label>
              <Input
                id={`${item.clientId}-${questionKey}`}
                value={item[questionKey as keyof ArticleFaqDraft] as string}
                maxLength={300}
                onChange={(event) => onUpdate({ [questionKey]: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${item.clientId}-${answerKey}`}>Answer ({label})</Label>
              <Textarea
                id={`${item.clientId}-${answerKey}`}
                value={item[answerKey as keyof ArticleFaqDraft] as string}
                maxLength={5000}
                rows={4}
                onChange={(event) => onUpdate({ [answerKey]: event.target.value })}
              />
              <p className="text-xs text-muted-foreground">Use a concise, complete answer. This text will be visible in the article and included in FAQ Schema.</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};

export const ArticleFaqEditor = ({ items, onChange }: ArticleFaqEditorProps) => {
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Article FAQ</h2>
          <p className="text-sm text-muted-foreground">Only enabled, fully translated questions appear on that language page and in its FAQ Schema.</p>
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
