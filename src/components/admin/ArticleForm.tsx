import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { notifyIndexNow } from "@/lib/indexNow";
import { Loader2, X, Upload, GripVertical, CalendarIcon, Eye, LockKeyhole, UnlockKeyhole } from "lucide-react";
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
import { ArticleFaqEditor, type ArticleFaqDraft } from "./ArticleFaqEditor";
import { SchemaPreview } from "./SchemaPreview";
import { RichTextEditor } from "./RichTextEditor";
import { CroppedImage } from "@/components/CroppedImage";
import { sanitizeArticleHtml } from "@/lib/articleHtml";
import type { Json, Tables } from "@/integrations/supabase/types";
import type { Language } from "@/contexts/LanguageContext";
import { buildArticleStructuredData } from "@/lib/articleSeo";
import { getArticleCategoryPath, normalizeArticleSlug } from "@/lib/utils";
import { ORGANIZATION_URL } from "@/lib/schema";

interface ArticleFormProps {
  article?: Tables<"articles"> | null;
  category: "education_research" | "news_events" | "philanthropy";
  onSuccess: () => void;
  onCancel: () => void;
}

const parseTerms = (value: string) => [...new Set(
  value.split(/[,，\n]/).map((term) => term.trim()).filter(Boolean),
)].slice(0, 20);

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
  const [seoTitle, setSeoTitle] = useState("");
  const [seoTitleZhTw, setSeoTitleZhTw] = useState("");
  const [seoTitleZhCn, setSeoTitleZhCn] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaDescriptionZhTw, setMetaDescriptionZhTw] = useState("");
  const [metaDescriptionZhCn, setMetaDescriptionZhCn] = useState("");
  const [topicTerms, setTopicTerms] = useState("");
  const [topicTermsZhTw, setTopicTermsZhTw] = useState("");
  const [topicTermsZhCn, setTopicTermsZhCn] = useState("");
  const [faqItems, setFaqItems] = useState<ArticleFaqDraft[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageMetadata, setImageMetadata] = useState<Record<string, ImageCropData>>({});
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentCropImage, setCurrentCropImage] = useState<{ id: string; url: string; isNew: boolean } | null>(null);
  const [published, setPublished] = useState(false);
  const [publicationDate, setPublicationDate] = useState<Date | null>(new Date());
  const [publicUpdatedDate, setPublicUpdatedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(false);
  const [langTab, setLangTab] = useState("en");
  const [slugUnlocked, setSlugUnlocked] = useState(false);
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
      setSeoTitle(article.seo_title || "");
      setSeoTitleZhTw(article.seo_title_zhtw || "");
      setSeoTitleZhCn(article.seo_title_zhcn || "");
      setMetaDescription(article.meta_description || "");
      setMetaDescriptionZhTw(article.meta_description_zhtw || "");
      setMetaDescriptionZhCn(article.meta_description_zhcn || "");
      setTopicTerms((article.topic_terms || []).join(", "));
      setTopicTermsZhTw((article.topic_terms_zhtw || []).join("，"));
      setTopicTermsZhCn((article.topic_terms_zhcn || []).join("，"));
      setExistingImages(article.image_urls || []);
      
      // Parse existing metadata if available
      if (article.image_metadata && typeof article.image_metadata === 'object') {
        setImageMetadata(article.image_metadata as unknown as Record<string, ImageCropData>);
      } else {
        setImageMetadata({});
      }

      setPublished(article.published || false);
      setSlugUnlocked(false);
      setPublicationDate(article.published_at ? new Date(article.published_at) : null);
      setPublicUpdatedDate(article.public_updated_at ? new Date(article.public_updated_at) : article.published_at ? new Date(article.published_at) : null);

      void supabase
        .from("article_faq_items")
        .select("*")
        .eq("article_id", article.id)
        .order("position")
        .then(({ data, error }) => {
          if (error) {
            if (error.code === "42P01" || error.code === "PGRST205") {
              setFaqItems([]);
              return;
            }
            toast({ title: "Unable to load FAQs", description: error.message, variant: "destructive" });
            return;
          }
          setFaqItems((data || []).map((item) => ({
            clientId: item.id,
            id: item.id,
            enabled: item.enabled,
            question: item.question,
            answer: item.answer,
            question_zhtw: item.question_zhtw || "",
            answer_zhtw: item.answer_zhtw || "",
            question_zhcn: item.question_zhcn || "",
            answer_zhcn: item.answer_zhcn || "",
          })));
        });
    }
  }, [article, toast]);

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

      const { error: uploadError } = await supabase.storage
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

  const saveFaqItems = async (articleId: string) => {
    const existingIds = faqItems.flatMap((item) => item.id ? [item.id] : []);
    let deleteQuery = supabase.from("article_faq_items").delete().eq("article_id", articleId);
    if (existingIds.length > 0) deleteQuery = deleteQuery.not("id", "in", `(${existingIds.join(",")})`);
    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

    for (const [position, item] of faqItems.entries()) {
      const payload = {
        article_id: articleId,
        position,
        enabled: item.enabled,
        question: item.question.trim(),
        answer: item.answer.trim() ? sanitizeArticleHtml(item.answer.trim()) : "",
        question_zhtw: item.question_zhtw.trim() || null,
        answer_zhtw: item.answer_zhtw.trim() ? sanitizeArticleHtml(item.answer_zhtw.trim()) : null,
        question_zhcn: item.question_zhcn.trim() || null,
        answer_zhcn: item.answer_zhcn.trim() ? sanitizeArticleHtml(item.answer_zhcn.trim()) : null,
      };
      const result = item.id
        ? await supabase.from("article_faq_items").update(payload).eq("id", item.id)
        : await supabase.from("article_faq_items").insert(payload);
      if (result.error) throw result.error;
    }
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

      const now = new Date().toISOString();
      const effectivePublishedAt = published ? (publicationDate || new Date()).toISOString() : article?.published_at || null;
      const effectivePublicUpdatedAt = (publicUpdatedDate || (effectivePublishedAt ? new Date(effectivePublishedAt) : null))?.toISOString() || null;

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
        seo_title: seoTitle.trim() || null,
        seo_title_zhtw: seoTitleZhTw.trim() || null,
        seo_title_zhcn: seoTitleZhCn.trim() || null,
        meta_description: metaDescription.trim() || null,
        meta_description_zhtw: metaDescriptionZhTw.trim() || null,
        meta_description_zhcn: metaDescriptionZhCn.trim() || null,
        topic_terms: parseTerms(topicTerms),
        topic_terms_zhtw: parseTerms(topicTermsZhTw),
        topic_terms_zhcn: parseTerms(topicTermsZhCn),
        image_urls: allImageUrls.length > 0 ? allImageUrls : null,
        image_metadata: Object.keys(finalImageMetadata).length > 0 ? (finalImageMetadata as unknown as Json) : null,
        category,
        published,
        published_at: effectivePublishedAt,
        public_updated_at: effectivePublicUpdatedAt,
      };

      let error;
      let savedArticleId = article?.id;

      if (article) {
        const result = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", article.id);
        error = result.error;
      } else {
        const result = await supabase.from("articles").insert([articleData]).select("id").single();
        error = result.error;
        savedArticleId = result.data?.id;
      }

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (!savedArticleId) throw new Error("Article saved without an ID");
        await saveFaqItems(savedArticleId);
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

  const schemaLanguage: Language = langTab === "zhtw" ? "zh-hk" : langTab === "zhcn" ? "zh-cn" : "en";
  const schemaDraft = useMemo(() => {
    const now = new Date().toISOString();
    const draft = {
      ...(article || {}),
      id: article?.id || "preview",
      category,
      title,
      title_zhtw: titleZhTw || null,
      title_zhcn: titleZhCn || null,
      excerpt: description || null,
      excerpt_zhtw: descriptionZhTw || null,
      excerpt_zhcn: descriptionZhCn || null,
      content,
      content_zhtw: contentZhTw || null,
      content_zhcn: contentZhCn || null,
      seo_title: seoTitle || null,
      seo_title_zhtw: seoTitleZhTw || null,
      seo_title_zhcn: seoTitleZhCn || null,
      meta_description: metaDescription || null,
      meta_description_zhtw: metaDescriptionZhTw || null,
      meta_description_zhcn: metaDescriptionZhCn || null,
      topic_terms: parseTerms(topicTerms),
      topic_terms_zhtw: parseTerms(topicTermsZhTw),
      topic_terms_zhcn: parseTerms(topicTermsZhCn),
      slug: normalizeArticleSlug(slug || title),
      image_urls: existingImages,
      image_metadata: imageMetadata as unknown as Json,
      published,
      published_at: publicationDate?.toISOString() || article?.published_at || now,
      public_updated_at: publicUpdatedDate?.toISOString() || article?.public_updated_at || article?.published_at || now,
      created_at: article?.created_at || now,
      updated_at: now,
    } as Tables<"articles">;
    const localizedTitle = schemaLanguage === "en" ? title : schemaLanguage === "zh-hk" ? titleZhTw : titleZhCn;
    const localizedContent = schemaLanguage === "en" ? content : schemaLanguage === "zh-hk" ? contentZhTw : contentZhCn;
    const localizedDescription = schemaLanguage === "en"
      ? metaDescription || description
      : schemaLanguage === "zh-hk"
        ? metaDescriptionZhTw || descriptionZhTw
        : metaDescriptionZhCn || descriptionZhCn;
    const plainContent = typeof document === "undefined"
      ? localizedContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : new DOMParser().parseFromString(localizedContent, "text/html").body.textContent?.replace(/\s+/g, " ").trim() || "";
    const localizedFaq = faqItems
      .filter((item) => item.enabled)
      .map((item) => schemaLanguage === "en"
        ? { question: item.question.trim(), answer: item.answer.trim() }
        : schemaLanguage === "zh-hk"
          ? { question: item.question_zhtw.trim(), answer: item.answer_zhtw.trim() }
          : { question: item.question_zhcn.trim(), answer: item.answer_zhcn.trim() })
      .filter((item) => item.question && item.answer);
    const headline = localizedTitle;
    const categoryLabel = category === "education_research"
      ? schemaLanguage === "en" ? "Education & Research" : schemaLanguage === "zh-hk" ? "教育與研究" : "教育与研究"
      : category === "news_events"
        ? schemaLanguage === "en" ? "News & Events" : schemaLanguage === "zh-hk" ? "新聞與活動" : "新闻与活动"
        : schemaLanguage === "en" ? "Philanthropy" : schemaLanguage === "zh-hk" ? "慈善事業" : "慈善事业";
    const built = buildArticleStructuredData({
      article: draft,
      language: schemaLanguage,
      headline,
      description: localizedDescription,
      articleSection: categoryLabel,
      image: existingImages[0] || `${ORGANIZATION_URL}/og-image.png`,
      plainContent,
      citations: [],
      faq: localizedFaq,
    });
    const homeLabel = schemaLanguage === "en" ? "Home" : schemaLanguage === "zh-hk" ? "首頁" : "首页";
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [homeLabel, categoryLabel, localizedTitle].map((name, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": name,
        "item": index === 0
          ? `${ORGANIZATION_URL}/${schemaLanguage}`
          : index === 1
            ? `${ORGANIZATION_URL}/${schemaLanguage}/articles/${getArticleCategoryPath(category)}`
            : built.url,
      })),
    };
    const warnings: string[] = [];
    if (!localizedTitle.trim()) warnings.push("This language has no article title and will not be indexable.");
    if (!localizedDescription.trim()) warnings.push("Meta description and article excerpt are both empty.");
    if (headline.length > 60) warnings.push("SEO title is longer than 60 characters; Google may truncate or rewrite it.");
    if (localizedDescription.length > 160) warnings.push("Meta description is longer than 160 characters; Google may truncate it.");
    if (!/<h2[\s>]/i.test(localizedContent)) warnings.push("The article has no H2 section heading.");
    if (plainContent.slice(0, 150).length < 80) warnings.push("The opening 150 characters may not provide a complete direct answer.");
    if (/\b\d+(?:[.,]\d+)?%?\b/.test(plainContent) && !/https?:\/\//i.test(localizedContent)) warnings.push("The article contains numerical claims but no visible external source link.");
    return { ...built, breadcrumbSchema, warnings };
  }, [article, category, content, contentZhCn, contentZhTw, description, descriptionZhCn, descriptionZhTw, existingImages, faqItems, imageMetadata, metaDescription, metaDescriptionZhCn, metaDescriptionZhTw, publicUpdatedDate, publicationDate, published, seoTitle, seoTitleZhCn, seoTitleZhTw, slug, title, titleZhCn, titleZhTw, topicTerms, topicTermsZhCn, topicTermsZhTw, schemaLanguage]);

  const previewImageUrl = useMemo(() => {
    if (existingImages.length > 0) return existingImages[0];
    if (imageFiles.length === 0) return null;
    const objectUrl = URL.createObjectURL(imageFiles[0]);
    return objectUrl;
  }, [existingImages, imageFiles]);

  useEffect(() => {
    if (!previewImageUrl?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(previewImageUrl);
  }, [previewImageUrl]);

  const setPublishChecked = (nextPublished: boolean) => {
    setPublished(nextPublished);
    if (nextPublished) {
      const fallback = publicationDate || new Date();
      if (!publicationDate) setPublicationDate(fallback);
      if (!publicUpdatedDate) setPublicUpdatedDate(fallback);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO & GEO</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="schema">Schema preview</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="space-y-6">
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
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="slug">Slug *</Label>
          {article?.published && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSlugUnlocked((value) => !value)}
            >
              {slugUnlocked ? <LockKeyhole className="mr-2 h-4 w-4" /> : <UnlockKeyhole className="mr-2 h-4 w-4" />}
              {slugUnlocked ? "Lock slug" : "Change slug"}
            </Button>
          )}
        </div>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          disabled={Boolean(article?.published) && !slugUnlocked}
          placeholder="article-url-slug"
        />
        {article?.published && (
          <p className="text-xs text-muted-foreground">
            Published slugs are locked by default. Changing one records the old URL for a permanent redirect on the next build.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DatePickerField
          label="Publication date"
          description="Shown as the public published date."
          value={publicationDate}
          onChange={(date) => {
            setPublicationDate(date);
            if (!publicUpdatedDate && date) setPublicUpdatedDate(date);
          }}
        />
        <DatePickerField
          label="Public updated date"
          description="Shown to visitors and used in dateModified. Image-only saves do not change this automatically."
          value={publicUpdatedDate}
          onChange={setPublicUpdatedDate}
        />
        <ReadOnlyDateField label="Record created" value={article?.created_at || null} />
        <ReadOnlyDateField label="Last saved" value={article?.updated_at || null} />
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
                    <div key={url} className="space-y-2">
                      <SortableImageItem
                        id={index.toString()}
                        url={url}
                        alt={imageMetadata[url]?.alt || title || `Existing ${index + 1}`}
                        onRemove={() => removeExistingImage(index)}
                        onCrop={() => openCropDialog(url, url, false)}
                        cropData={imageMetadata[url] || null}
                      />
                      <ImageAltFields
                        id={`existing-${index}`}
                        metadata={imageMetadata[url]}
                        onChange={(patch) => setImageMetadata((current) => ({
                          ...current,
                          [url]: { ...defaultImageMetadata(), ...current[url], ...patch },
                        }))}
                      />
                    </div>
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
                    <div key={`new-${file.name}-${index}`} className="space-y-2">
                      <SortableImageItem
                        id={`new-${index}`}
                        url={URL.createObjectURL(file)}
                        alt={imageMetadata[`new-${index}`]?.alt || title || `Upload ${index + 1}`}
                        onRemove={() => removeImageFile(index)}
                        onCrop={() => openCropDialog(`new-${index}`, URL.createObjectURL(file), true)}
                        cropData={imageMetadata[`new-${index}`] || null}
                      />
                      <ImageAltFields
                        id={`new-${index}`}
                        metadata={imageMetadata[`new-${index}`]}
                        onChange={(patch) => setImageMetadata((current) => ({
                          ...current,
                          [`new-${index}`]: { ...defaultImageMetadata(), ...current[`new-${index}`], ...patch },
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

        </TabsContent>
        <TabsContent value="seo" className="space-y-6">
          <Tabs value={langTab} onValueChange={setLangTab}>
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="zhtw">繁體中文</TabsTrigger>
              <TabsTrigger value="zhcn">简体中文</TabsTrigger>
            </TabsList>
            {[
              { value: "en", label: "English", seo: seoTitle, setSeo: setSeoTitle, meta: metaDescription, setMeta: setMetaDescription, terms: topicTerms, setTerms: setTopicTerms },
              { value: "zhtw", label: "繁體中文", seo: seoTitleZhTw, setSeo: setSeoTitleZhTw, meta: metaDescriptionZhTw, setMeta: setMetaDescriptionZhTw, terms: topicTermsZhTw, setTerms: setTopicTermsZhTw },
              { value: "zhcn", label: "简体中文", seo: seoTitleZhCn, setSeo: setSeoTitleZhCn, meta: metaDescriptionZhCn, setMeta: setMetaDescriptionZhCn, terms: topicTermsZhCn, setTerms: setTopicTermsZhCn },
            ].map((fields) => (
              <TabsContent key={fields.value} value={fields.value} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor={`seo-title-${fields.value}`}>SEO title ({fields.label})</Label>
                  <Input id={`seo-title-${fields.value}`} value={fields.seo} maxLength={120} onChange={(event) => fields.setSeo(event.target.value)} placeholder="Defaults to the article title" />
                  <p className="text-xs text-muted-foreground">{fields.seo.length}/120. Recommended display length: about 60 characters.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`meta-description-${fields.value}`}>Meta description ({fields.label})</Label>
                  <Textarea id={`meta-description-${fields.value}`} value={fields.meta} maxLength={320} rows={4} onChange={(event) => fields.setMeta(event.target.value)} placeholder="Defaults to the article excerpt" />
                  <p className="text-xs text-muted-foreground">{fields.meta.length}/320. Recommended display length: about 150-160 characters.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`topic-terms-${fields.value}`}>Topics and entities ({fields.label})</Label>
                  <Textarea id={`topic-terms-${fields.value}`} value={fields.terms} rows={3} onChange={(event) => fields.setTerms(event.target.value)} placeholder="Family office, offshore trust, Hong Kong taxation" />
                  <p className="text-xs text-muted-foreground">Separate up to 20 terms with commas or new lines. These feed Article Schema; no meta keywords tag is created.</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
        <TabsContent value="faq">
          <ArticleFaqEditor items={faqItems} onChange={setFaqItems} />
        </TabsContent>
        <TabsContent value="schema">
          <SchemaPreview
            language={schemaLanguage}
            articleSchema={schemaDraft.articleSchema}
            faqSchema={schemaDraft.faqSchema}
            breadcrumbSchema={schemaDraft.breadcrumbSchema}
            warnings={schemaDraft.warnings}
          />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={published}
            onCheckedChange={setPublishChecked}
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
        displayDate={publicationDate || publicUpdatedDate || new Date()}
        imageUrl={previewImageUrl}
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

const defaultImageMetadata = (): ImageCropData => ({
  crop: { x: 0, y: 0 },
  zoom: 1,
  croppedAreaPercentages: null,
  focus: { x: 50, y: 50 },
});

const ImageAltFields = ({
  id,
  metadata,
  onChange,
}: {
  id: string;
  metadata?: ImageCropData;
  onChange: (patch: Partial<ImageCropData>) => void;
}) => (
  <div className="space-y-1">
    <Input id={`${id}-alt`} value={metadata?.alt || ""} onChange={(event) => onChange({ alt: event.target.value })} placeholder="English alt text" aria-label="English image alt text" />
    <Input value={metadata?.alt_zhtw || ""} onChange={(event) => onChange({ alt_zhtw: event.target.value })} placeholder="繁體中文替代文字" aria-label="Traditional Chinese image alt text" />
    <Input value={metadata?.alt_zhcn || ""} onChange={(event) => onChange({ alt_zhcn: event.target.value })} placeholder="简体中文替代文字" aria-label="Simplified Chinese image alt text" />
  </div>
);

const DatePickerField = ({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={(date) => onChange(date || null)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

const ReadOnlyDateField = ({ label, value }: { label: string; value: string | null }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex min-h-10 items-center rounded-md border border-input bg-secondary/30 px-3 text-sm text-muted-foreground">
      {value ? format(new Date(value), "PPP p") : "Not recorded yet"}
    </div>
  </div>
);

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
