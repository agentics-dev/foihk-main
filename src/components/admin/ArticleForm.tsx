import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { notifyIndexNow } from "@/lib/indexNow";
import { Loader2, X, Upload, GripVertical, CalendarIcon, Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ImageCropperDialog, ImageCropData } from "./ImageCropperDialog";
import { ArticlePreviewDialog } from "./ArticlePreviewDialog";
import { RichTextEditor } from "./RichTextEditor";
import { CroppedImage } from "@/components/CroppedImage";
import { sanitizeArticleHtml } from "@/lib/articleHtml";
import type { Json, Tables } from "@/integrations/supabase/types";

interface ArticleFormProps {
  article?: Tables<"articles"> | null;
  category: "education_research" | "news_events" | "philanthropy";
  onSuccess: () => void;
  onCancel: () => void;
}

export const ArticleForm = ({ article, category, onSuccess, onCancel }: ArticleFormProps) => {
  const [title, setTitle] = useState("");
  const [titleZhTw, setTitleZhTw] = useState("");
  const [titleZhCn, setTitleZhCn] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionZhTw, setDescriptionZhTw] = useState("");
  const [descriptionZhCn, setDescriptionZhCn] = useState("");
  const [content, setContent] = useState("");
  const [contentZhTw, setContentZhTw] = useState("");
  const [contentZhCn, setContentZhCn] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageMetadata, setImageMetadata] = useState<Record<string, ImageCropData>>({});
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentCropImage, setCurrentCropImage] = useState<{ id: string; url: string; isNew: boolean } | null>(null);
  const [published, setPublished] = useState(false);
  const [createdDate, setCreatedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [langTab, setLangTab] = useState("en");
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setTitleZhTw(article.title_zhtw || "");
      setTitleZhCn(article.title_zhcn || "");
      setSlug(article.slug || "");
      setDescription(article.excerpt || "");
      setDescriptionZhTw(article.excerpt_zhtw || "");
      setDescriptionZhCn(article.excerpt_zhcn || "");
      setContent(article.content || "");
      setContentZhTw(article.content_zhtw || "");
      setContentZhCn(article.content_zhcn || "");
      setExistingImages(article.image_urls || []);
      
      // Parse existing metadata if available
      if (article.image_metadata && typeof article.image_metadata === 'object') {
        setImageMetadata(article.image_metadata as unknown as Record<string, ImageCropData>);
      } else {
        setImageMetadata({});
      }

      setPublished(article.published || false);
      setCreatedDate(article.created_at ? new Date(article.created_at) : new Date());
    }
  }, [article]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!article) {
      setSlug(generateSlug(value));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;
    
    if (totalImages > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images",
        variant: "destructive",
      });
      return;
    }
    
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const openCropDialog = (id: string, url: string, isNew: boolean) => {
    setCurrentCropImage({ id, url, isNew });
    setCropDialogOpen(true);
  };

  const handleSaveCrop = (cropData: ImageCropData) => {
    if (currentCropImage) {
      setImageMetadata(prev => ({
        ...prev,
        [currentCropImage.id]: cropData
      }));
    }
  };

  const handleDragEndExisting = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setExistingImages((items) => {
        const oldIndex = items.findIndex((_, i) => i.toString() === active.id);
        const newIndex = items.findIndex((_, i) => i.toString() === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndNew = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImageFiles((items) => {
        const oldIndex = items.findIndex((_, i) => `new-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `new-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const uploadImages = async (): Promise<{ url: string; oldId: string }[]> => {
    const uploadedUrls: { url: string; oldId: string }[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("article-images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("article-images")
        .getPublicUrl(filePath);

      uploadedUrls.push({ url: publicUrl, oldId: `new-${i}` });
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sanitizedContent = sanitizeArticleHtml(content, title || "Article image");
      const sanitizedContentZhTw = contentZhTw.trim() ? sanitizeArticleHtml(contentZhTw, titleZhTw || title || "Article image") : "";
      const sanitizedContentZhCn = contentZhCn.trim() ? sanitizeArticleHtml(contentZhCn, titleZhCn || title || "Article image") : "";

      if (!sanitizedContent.trim()) {
        toast({
          title: "Missing content",
          description: "English article content is required",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Upload new images
      const newImages = await uploadImages();
      const allImageUrls = [...existingImages, ...newImages.map(img => img.url)];
      
      // Remap image metadata keys
      const finalImageMetadata: Record<string, ImageCropData> = {};
      
      // Map existing images (key is url string)
      existingImages.forEach((url) => {
        if (imageMetadata[url]) {
          finalImageMetadata[url] = imageMetadata[url];
        }
      });
      
      // Map new images (key is "new-0", "new-1")
      newImages.forEach(img => {
        if (imageMetadata[img.oldId]) {
          finalImageMetadata[img.url] = imageMetadata[img.oldId];
        }
      });

      const articleData = {
        title,
        title_zhtw: titleZhTw || null,
        title_zhcn: titleZhCn || null,
        slug,
        excerpt: description,
        excerpt_zhtw: descriptionZhTw || null,
        excerpt_zhcn: descriptionZhCn || null,
        content: sanitizedContent,
        content_zhtw: sanitizedContentZhTw || null,
        content_zhcn: sanitizedContentZhCn || null,
        image_urls: allImageUrls.length > 0 ? allImageUrls : null,
        image_metadata: Object.keys(finalImageMetadata).length > 0 ? (finalImageMetadata as unknown as Json) : null,
        category,
        published,
        published_at: published ? new Date().toISOString() : null,
        created_at: createdDate.toISOString(),
      };

      let error;

      if (article) {
        const result = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", article.id);
        error = result.error;
      } else {
        const result = await supabase.from("articles").insert([articleData]);
        error = result.error;
      }

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        let indexNowWarning = false;
        if (published || article?.published) {
          try {
            await notifyIndexNow(category, slug);
          } catch {
            indexNowWarning = true;
          }
        }
        toast({
          title: indexNowWarning ? "Article saved; indexing notification pending" : "Success",
          description: indexNowWarning
            ? "The article was saved, but IndexNow could not be notified. Retry by saving the article again."
            : `Article ${article ? "updated" : "created"} successfully`,
          variant: indexNowWarning ? "destructive" : "default",
        });
        onSuccess();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to save article",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={langTab} onValueChange={setLangTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="zhtw">繁體中文</TabsTrigger>
            <TabsTrigger value="zhcn">简体中文</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="en" className="space-y-6 mt-0">
          <div className="space-y-2">
            <Label htmlFor="title">Title * (English)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="Enter article title in English"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (English)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description in English"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content * (English)</Label>
            <RichTextEditor
              id="content"
              value={content}
              onChange={setContent}
              placeholder="Write safe article HTML in English, for example <p>...</p><h2>...</h2><ul><li>...</li></ul>"
              required
            />
          </div>
        </TabsContent>

        <TabsContent value="zhtw" className="space-y-6 mt-0">
          <div className="space-y-2">
            <Label htmlFor="title-zhtw">標題 (繁體中文)</Label>
            <Input
              id="title-zhtw"
              value={titleZhTw}
              onChange={(e) => setTitleZhTw(e.target.value)}
              placeholder="輸入繁體中文標題"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description-zhtw">摘要 (繁體中文)</Label>
            <Textarea
              id="description-zhtw"
              value={descriptionZhTw}
              onChange={(e) => setDescriptionZhTw(e.target.value)}
              placeholder="輸入繁體中文摘要"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-zhtw">內容 (繁體中文)</Label>
            <RichTextEditor
              id="content-zhtw"
              value={contentZhTw}
              onChange={setContentZhTw}
              placeholder="輸入安全的繁體中文 HTML，例如 <p>...</p><h2>...</h2><ul><li>...</li></ul>"
            />
          </div>
        </TabsContent>

        <TabsContent value="zhcn" className="space-y-6 mt-0">
          <div className="space-y-2">
            <Label htmlFor="title-zhcn">标题 (简体中文)</Label>
            <Input
              id="title-zhcn"
              value={titleZhCn}
              onChange={(e) => setTitleZhCn(e.target.value)}
              placeholder="输入简体中文标题"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description-zhcn">摘要 (简体中文)</Label>
            <Textarea
              id="description-zhcn"
              value={descriptionZhCn}
              onChange={(e) => setDescriptionZhCn(e.target.value)}
              placeholder="输入简体中文摘要"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-zhcn">内容 (简体中文)</Label>
            <RichTextEditor
              id="content-zhcn"
              value={contentZhCn}
              onChange={setContentZhCn}
              placeholder="输入安全的简体中文 HTML，例如 <p>...</p><h2>...</h2><ul><li>...</li></ul>"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          placeholder="article-url-slug"
        />
      </div>

      <div className="space-y-2">
        <Label>Created Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !createdDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {createdDate ? format(createdDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={createdDate}
              onSelect={(date) => date && setCreatedDate(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">Images (Max 5)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={existingImages.length + imageFiles.length >= 5}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("images")?.click()}
            disabled={existingImages.length + imageFiles.length >= 5}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Images ({existingImages.length + imageFiles.length}/5)
          </Button>
        </div>
        
        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Existing Images (Drag to reorder)</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndExisting}
            >
              <SortableContext
                items={existingImages.map((_, i) => i.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {existingImages.map((url, index) => (
                    <SortableImageItem
                      key={index}
                      id={index.toString()}
                      url={url}
                      alt={`Existing ${index + 1}`}
                      onRemove={() => removeExistingImage(index)}
                      onCrop={() => openCropDialog(url, url, false)}
                      cropData={imageMetadata[url] || null}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
        
        {/* New Images */}
        {imageFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">New Images (Drag to reorder)</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndNew}
            >
              <SortableContext
                items={imageFiles.map((_, i) => `new-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {imageFiles.map((file, index) => (
                    <SortableImageItem
                      key={`new-${index}`}
                      id={`new-${index}`}
                      url={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      onRemove={() => removeImageFile(index)}
                      onCrop={() => openCropDialog(`new-${index}`, URL.createObjectURL(file), true)}
                      cropData={imageMetadata[`new-${index}`] || null}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={published}
            onCheckedChange={setPublished}
          />
          <Label htmlFor="published">Publish immediately</Label>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {article ? "Update" : "Create"} Article
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {currentCropImage && (
        <ImageCropperDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageUrl={currentCropImage.url}
          initialData={imageMetadata[currentCropImage.id]}
          onSave={handleSaveCrop}
        />
      )}

      <ArticlePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={langTab === "en" ? title : langTab === "zhtw" ? titleZhTw : titleZhCn}
        excerpt={langTab === "en" ? description : langTab === "zhtw" ? descriptionZhTw : descriptionZhCn}
        content={langTab === "en" ? content : langTab === "zhtw" ? contentZhTw : contentZhCn}
        createdDate={createdDate}
        imageUrl={existingImages.length > 0 ? existingImages[0] : imageFiles.length > 0 ? URL.createObjectURL(imageFiles[0]) : null}
        imageMetadata={existingImages.length > 0 ? imageMetadata[existingImages[0]] : imageFiles.length > 0 ? imageMetadata["new-0"] : null}
      />
    </form>
  );
};

interface SortableImageItemProps {
  id: string;
  url: string;
  alt: string;
  onRemove: () => void;
  onCrop?: () => void;
  cropData?: ImageCropData | null;
}

const SortableImageItem = ({ id, url, alt, onRemove, onCrop, cropData }: SortableImageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute top-1 left-1 z-10 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <div className="bg-background/80 rounded p-1">
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
      {cropData?.croppedAreaPercentages ? (
        <CroppedImage
          src={url}
          alt={alt}
          metadata={cropData}
          containerClassName="w-full h-24 rounded-md"
        />
      ) : (
        <img
          src={url}
          alt={alt}
          className="w-full h-24 object-cover rounded-md"
        />
      )}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onCrop && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onCrop(); }}
            title="Crop & Focus"
          >
            <span className="text-xs">⛶</span>
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
