import { saveArticle } from "@/lib/articleEditor";
import { canPublishArticle } from "@/lib/articlePublication";
import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Upload, GripVertical, CalendarIcon, Eye, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { CharCounter, CollapsibleSection, KeywordTagInput, SerpPreview } from "./seo";
import { SeoHealthScore } from "./SeoHealthScore";
import { computeSeoScore } from "@/lib/seoScore";
import type { EventAttendanceMode, EventStatus } from "@/lib/schemaBuilders";

interface ArticleFormProps {
  article?: Tables<"articles"> | null;
  category: "education_research" | "news_events" | "philanthropy";
  onSuccess: () => void;
  onCancel: () => void;
}

const cleanTerms = (value: string[]) => [...new Set(value.map((term) => term.trim()).filter(Boolean))].slice(0, 20);

type EditorLanguage = "en" | "zhtw" | "zhcn";

const toSchemaLanguage = (language: EditorLanguage): Language => language === "zhtw" ? "zh-hk" : language === "zhcn" ? "zh-cn" : "en";

const getUnavailableKey = (field: string, language?: EditorLanguage) => language ? `${field}:${language}` : field;

const MAX_ARTICLE_IMAGES = 5;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

type AllowedImageKind = "jpeg" | "png" | "webp";

const detectImageSignature = async (file: File): Promise<AllowedImageKind | null> => {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (isJpeg) return "jpeg";
  if (isPng) return "png";
  if (isWebp) return "webp";
  return null;
};

const validateArticleImageFile = async (file: File): Promise<string | null> => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const expectedKind = extension === "jpg" ? "jpeg" : extension as AllowedImageKind;
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return `${file.name}: only JPEG, PNG, and WebP files are allowed`;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `${file.name}: the file type is not JPEG, PNG, or WebP`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${file.name}: each image must be 5MB or smaller`;
  }
  const signatureKind = await detectImageSignature(file);
  if (!signatureKind) {
    return `${file.name}: the file contents do not match JPEG, PNG, or WebP`;
  }
  if (signatureKind !== expectedKind || file.type !== `image/${signatureKind}`) {
    return `${file.name}: extension, MIME type, and file contents must match`;
  }
  return null;
};

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
  const [topicTerms, setTopicTerms] = useState<string[]>([]);
  const [topicTermsZhTw, setTopicTermsZhTw] = useState<string[]>([]);
  const [topicTermsZhCn, setTopicTermsZhCn] = useState<string[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [authorNameZhTw, setAuthorNameZhTw] = useState("");
  const [authorNameZhCn, setAuthorNameZhCn] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [authorTitleZhTw, setAuthorTitleZhTw] = useState("");
  const [authorTitleZhCn, setAuthorTitleZhCn] = useState("");
  const [authorCredential, setAuthorCredential] = useState("");
  const [authorCredentialZhTw, setAuthorCredentialZhTw] = useState("");
  const [authorCredentialZhCn, setAuthorCredentialZhCn] = useState("");
  const [faqShowOnPage, setFaqShowOnPage] = useState(true);
  const [faqIncludeSchema, setFaqIncludeSchema] = useState(true);
  const [eventSchemaEnabled, setEventSchemaEnabled] = useState(false);
  const [eventAttendanceMode, setEventAttendanceMode] = useState<EventAttendanceMode | null>(null);
  const [eventStatus, setEventStatus] = useState<EventStatus | null>("scheduled");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventTimezone, setEventTimezone] = useState("Asia/Hong_Kong");
  const [eventPreviousStartDate, setEventPreviousStartDate] = useState("");
  const [eventPreviousStartTime, setEventPreviousStartTime] = useState("");
  const [eventVenueName, setEventVenueName] = useState("");
  const [eventVenueNameZhTw, setEventVenueNameZhTw] = useState("");
  const [eventVenueNameZhCn, setEventVenueNameZhCn] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventAddressZhTw, setEventAddressZhTw] = useState("");
  const [eventAddressZhCn, setEventAddressZhCn] = useState("");
  const [eventOnlineUrl, setEventOnlineUrl] = useState("");
  const [eventOrganizerName, setEventOrganizerName] = useState("");
  const [eventOrganizerNameZhTw, setEventOrganizerNameZhTw] = useState("");
  const [eventOrganizerNameZhCn, setEventOrganizerNameZhCn] = useState("");
  const [eventOrganizerUrl, setEventOrganizerUrl] = useState("");
  const [eventUnavailableFields, setEventUnavailableFields] = useState<string[]>([]);
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
  const [publicationDateChanged, setPublicationDateChanged] = useState(false);
  const [savedVersion, setSavedVersion] = useState<Tables<"articles"> | null>(null);
  const [langTab, setLangTab] = useState<EditorLanguage>("en");
  const [sidebarLangTab, setSidebarLangTab] = useState<EditorLanguage>("en");
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
      setSlug(normalizeArticleSlug(article.slug || ""));
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
      setTopicTerms(article.topic_terms || []);
      setTopicTermsZhTw(article.topic_terms_zhtw || []);
      setTopicTermsZhCn(article.topic_terms_zhcn || []);
      setAuthorName(article.author_name || "");
      setAuthorNameZhTw(article.author_name_zhtw || "");
      setAuthorNameZhCn(article.author_name_zhcn || "");
      setAuthorTitle(article.author_title || "");
      setAuthorTitleZhTw(article.author_title_zhtw || "");
      setAuthorTitleZhCn(article.author_title_zhcn || "");
      setAuthorCredential(article.author_credential || "");
      setAuthorCredentialZhTw(article.author_credential_zhtw || "");
      setAuthorCredentialZhCn(article.author_credential_zhcn || "");
      setFaqShowOnPage(article.faq_show_on_page !== false);
      setFaqIncludeSchema(article.faq_show_on_page !== false && article.faq_include_schema !== false);
      setEventSchemaEnabled(article.event_schema_enabled === true);
      setEventAttendanceMode(article.event_attendance_mode as EventAttendanceMode || null);
      setEventStatus(article.event_status as EventStatus || "scheduled");
      setEventStartDate(article.event_start_date || "");
      setEventStartTime(article.event_start_time?.slice(0, 5) || "");
      setEventEndDate(article.event_end_date || "");
      setEventEndTime(article.event_end_time?.slice(0, 5) || "");
      setEventTimezone(article.event_timezone || "Asia/Hong_Kong");
      setEventPreviousStartDate(article.event_previous_start_date || "");
      setEventPreviousStartTime(article.event_previous_start_time?.slice(0, 5) || "");
      setEventVenueName(article.event_venue_name || "");
      setEventVenueNameZhTw(article.event_venue_name_zhtw || "");
      setEventVenueNameZhCn(article.event_venue_name_zhcn || "");
      setEventAddress(article.event_address || "");
      setEventAddressZhTw(article.event_address_zhtw || "");
      setEventAddressZhCn(article.event_address_zhcn || "");
      setEventOnlineUrl(article.event_online_url || "");
      setEventOrganizerName(article.event_organizer_name || "");
      setEventOrganizerNameZhTw(article.event_organizer_name_zhtw || "");
      setEventOrganizerNameZhCn(article.event_organizer_name_zhcn || "");
      setEventOrganizerUrl(article.event_organizer_url || "");
      setEventUnavailableFields(article.event_unavailable_fields || []);
      setExistingImages(article.image_urls || []);
      
      // Parse existing metadata if available
      if (article.image_metadata && typeof article.image_metadata === 'object') {
        setImageMetadata(article.image_metadata as unknown as Record<string, ImageCropData>);
      } else {
        setImageMetadata({});
      }

      setSavedVersion(null);
      setPublicationDateChanged(false);
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

  const isEventUnavailable = useCallback(
    (field: string, language?: EditorLanguage) => eventUnavailableFields.includes(getUnavailableKey(field, language)),
    [eventUnavailableFields],
  );

  const setEventUnavailable = useCallback((field: string, unavailable: boolean, language?: EditorLanguage) => {
    const key = getUnavailableKey(field, language);
    setEventUnavailableFields((current) => unavailable
      ? [...new Set([...current, key])]
      : current.filter((candidate) => candidate !== key));
  }, []);

  const getUnansweredEventFields = () => {
    if (!eventSchemaEnabled) return [];
    const unanswered: string[] = [];
    const check = (key: string, value: string | null, label: string, language?: EditorLanguage) => {
      if (!value?.trim() && !isEventUnavailable(key, language)) unanswered.push(label);
    };

    check("attendance_mode", eventAttendanceMode, "Activity format");
    check("status", eventStatus, "Event status");
    check("start_date", eventStartDate, "Start date");
    check("start_time", eventStartTime, "Start time");
    check("end_date", eventEndDate, "End date");
    if (eventEndDate && !isEventUnavailable("end_date")) check("end_time", eventEndTime, "End time");
    check("timezone", eventTimezone, "Time zone");
    if (!isEventUnavailable("attendance_mode") && (eventAttendanceMode === "online" || eventAttendanceMode === "mixed")) check("online_url", eventOnlineUrl, "Online event URL");
    check("organizer_url", eventOrganizerUrl, "Organizer URL");
    if (!isEventUnavailable("status") && eventStatus === "rescheduled") {
      check("previous_start_date", eventPreviousStartDate, "Previous start date");
      check("previous_start_time", eventPreviousStartTime, "Previous start time");
    }

    const localizedFields = [
      { language: "en" as const, label: "English", venue: eventVenueName, address: eventAddress, organizer: eventOrganizerName },
      { language: "zhtw" as const, label: "繁體中文", venue: eventVenueNameZhTw, address: eventAddressZhTw, organizer: eventOrganizerNameZhTw },
      { language: "zhcn" as const, label: "简体中文", venue: eventVenueNameZhCn, address: eventAddressZhCn, organizer: eventOrganizerNameZhCn },
    ];
    localizedFields.forEach((fields) => {
      if (!isEventUnavailable("attendance_mode") && (eventAttendanceMode === "offline" || eventAttendanceMode === "mixed")) {
        check("venue_name", fields.venue, `${fields.label} venue`, fields.language);
        check("address", fields.address, `${fields.label} address`, fields.language);
      }
      check("organizer_name", fields.organizer, `${fields.label} organizer`, fields.language);
    });
    return unanswered;
  };

  const getInvalidEventFields = () => {
    if (!eventSchemaEnabled) return [];
    const invalid: string[] = [];
    if (!isValidTimeZone(eventTimezone)) invalid.push("IANA time zone");
    if (!isEventUnavailable("attendance_mode") && (eventAttendanceMode === "online" || eventAttendanceMode === "mixed") && !isEventUnavailable("online_url") && eventOnlineUrl && !isValidHttpUrl(eventOnlineUrl)) {
      invalid.push("Online event URL");
    }
    if (!isEventUnavailable("organizer_url") && eventOrganizerUrl && !isValidHttpUrl(eventOrganizerUrl)) invalid.push("Organizer URL");
    if (!isEventUnavailable("start_date") && !isEventUnavailable("end_date") && eventStartDate && eventEndDate && eventEndDate < eventStartDate) invalid.push("End date must not precede start date");
    if (!isEventUnavailable("start_date") && !isEventUnavailable("end_date") && !isEventUnavailable("start_time") && !isEventUnavailable("end_time") && eventStartDate && eventEndDate === eventStartDate && eventStartTime && eventEndTime && eventEndTime < eventStartTime) {
      invalid.push("End time must not precede start time");
    }
    return invalid;
  };

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;
    
    if (totalImages > MAX_ARTICLE_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_ARTICLE_IMAGES} images`,
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    for (const file of files) {
      const validationError = await validateArticleImageFile(file);
      if (validationError) {
        toast({
          title: "Invalid image",
          description: validationError,
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
    }
    
    setImageFiles((current) => [...current, ...files]);
    e.target.value = "";
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
        .upload(filePath, file, { contentType: file.type });

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

      if (publicationDateChanged && !publicationDate) throw new Error("Choose a publication date; an existing publication date cannot be cleared.");

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

      const effectivePublicUpdatedAt = publicUpdatedDate?.toISOString() || article?.public_updated_at || null;

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
        topic_terms: cleanTerms(topicTerms),
        topic_terms_zhtw: cleanTerms(topicTermsZhTw),
        topic_terms_zhcn: cleanTerms(topicTermsZhCn),
        author_name: authorName.trim() || null,
        author_name_zhtw: authorNameZhTw.trim() || null,
        author_name_zhcn: authorNameZhCn.trim() || null,
        author_title: authorTitle.trim() || null,
        author_title_zhtw: authorTitleZhTw.trim() || null,
        author_title_zhcn: authorTitleZhCn.trim() || null,
        author_credential: authorCredential.trim() || null,
        author_credential_zhtw: authorCredentialZhTw.trim() || null,
        author_credential_zhcn: authorCredentialZhCn.trim() || null,
        faq_show_on_page: faqShowOnPage,
        faq_include_schema: faqShowOnPage && faqIncludeSchema,
        event_schema_enabled: eventSchemaEnabled,
        event_attendance_mode: isEventUnavailable("attendance_mode") ? null : eventAttendanceMode,
        event_status: isEventUnavailable("status") ? null : eventStatus,
        event_start_date: isEventUnavailable("start_date") ? null : eventStartDate || null,
        event_start_time: isEventUnavailable("start_time") ? null : eventStartTime || null,
        event_end_date: isEventUnavailable("end_date") ? null : eventEndDate || null,
        event_end_time: isEventUnavailable("end_time") ? null : eventEndTime || null,
        event_timezone: eventTimezone.trim() || "Asia/Hong_Kong",
        event_previous_start_date: isEventUnavailable("previous_start_date") ? null : eventPreviousStartDate || null,
        event_previous_start_time: isEventUnavailable("previous_start_time") ? null : eventPreviousStartTime || null,
        event_venue_name: isEventUnavailable("venue_name", "en") ? null : eventVenueName.trim() || null,
        event_venue_name_zhtw: isEventUnavailable("venue_name", "zhtw") ? null : eventVenueNameZhTw.trim() || null,
        event_venue_name_zhcn: isEventUnavailable("venue_name", "zhcn") ? null : eventVenueNameZhCn.trim() || null,
        event_address: isEventUnavailable("address", "en") ? null : eventAddress.trim() || null,
        event_address_zhtw: isEventUnavailable("address", "zhtw") ? null : eventAddressZhTw.trim() || null,
        event_address_zhcn: isEventUnavailable("address", "zhcn") ? null : eventAddressZhCn.trim() || null,
        event_online_url: isEventUnavailable("online_url") ? null : eventOnlineUrl.trim() || null,
        event_organizer_name: isEventUnavailable("organizer_name", "en") ? null : eventOrganizerName.trim() || null,
        event_organizer_name_zhtw: isEventUnavailable("organizer_name", "zhtw") ? null : eventOrganizerNameZhTw.trim() || null,
        event_organizer_name_zhcn: isEventUnavailable("organizer_name", "zhcn") ? null : eventOrganizerNameZhCn.trim() || null,
        event_organizer_url: isEventUnavailable("organizer_url") ? null : eventOrganizerUrl.trim() || null,
        event_unavailable_fields: eventUnavailableFields,
        image_urls: allImageUrls.length > 0 ? allImageUrls : null,
        image_metadata: Object.keys(finalImageMetadata).length > 0 ? (finalImageMetadata as unknown as Json) : null,
        category,
        published,
        public_updated_at: effectivePublicUpdatedAt,
      };

      if (published && !canPublishArticle(articleData)) {
        throw new Error("Add a title and text or an image in at least one language before publishing.");
      }
      const saved = await saveArticle(articleData, savedVersion || article,
        publicationDateChanged ? publicationDate?.toISOString() : undefined);
      setSavedVersion(saved);
      setPublicationDateChanged(false);
      // FAQ persistence remains separate; a version conflict above stops before FAQ writes.
      await saveFaqItems(saved.id);
      toast({ title: "Article saved", description: saved.published
        ? "Published content is saved. Static page synchronization is shown separately."
        : "Draft saved." });
      onSuccess();

    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to save article",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const schemaLanguage = toSchemaLanguage(sidebarLangTab);
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
      topic_terms: cleanTerms(topicTerms),
      topic_terms_zhtw: cleanTerms(topicTermsZhTw),
      topic_terms_zhcn: cleanTerms(topicTermsZhCn),
      author_name: authorName || null,
      author_name_zhtw: authorNameZhTw || null,
      author_name_zhcn: authorNameZhCn || null,
      author_title: authorTitle || null,
      author_title_zhtw: authorTitleZhTw || null,
      author_title_zhcn: authorTitleZhCn || null,
      author_credential: authorCredential || null,
      author_credential_zhtw: authorCredentialZhTw || null,
      author_credential_zhcn: authorCredentialZhCn || null,
      faq_show_on_page: faqShowOnPage,
      faq_include_schema: faqShowOnPage && faqIncludeSchema,
      event_schema_enabled: eventSchemaEnabled,
      event_attendance_mode: isEventUnavailable("attendance_mode") ? null : eventAttendanceMode,
      event_status: isEventUnavailable("status") ? null : eventStatus,
      event_start_date: isEventUnavailable("start_date") ? null : eventStartDate || null,
      event_start_time: isEventUnavailable("start_time") ? null : eventStartTime || null,
      event_end_date: isEventUnavailable("end_date") ? null : eventEndDate || null,
      event_end_time: isEventUnavailable("end_time") ? null : eventEndTime || null,
      event_timezone: eventTimezone || "Asia/Hong_Kong",
      event_previous_start_date: isEventUnavailable("previous_start_date") ? null : eventPreviousStartDate || null,
      event_previous_start_time: isEventUnavailable("previous_start_time") ? null : eventPreviousStartTime || null,
      event_venue_name: isEventUnavailable("venue_name", "en") ? null : eventVenueName || null,
      event_venue_name_zhtw: isEventUnavailable("venue_name", "zhtw") ? null : eventVenueNameZhTw || null,
      event_venue_name_zhcn: isEventUnavailable("venue_name", "zhcn") ? null : eventVenueNameZhCn || null,
      event_address: isEventUnavailable("address", "en") ? null : eventAddress || null,
      event_address_zhtw: isEventUnavailable("address", "zhtw") ? null : eventAddressZhTw || null,
      event_address_zhcn: isEventUnavailable("address", "zhcn") ? null : eventAddressZhCn || null,
      event_online_url: isEventUnavailable("online_url") ? null : eventOnlineUrl || null,
      event_organizer_name: isEventUnavailable("organizer_name", "en") ? null : eventOrganizerName || null,
      event_organizer_name_zhtw: isEventUnavailable("organizer_name", "zhtw") ? null : eventOrganizerNameZhTw || null,
      event_organizer_name_zhcn: isEventUnavailable("organizer_name", "zhcn") ? null : eventOrganizerNameZhCn || null,
      event_organizer_url: isEventUnavailable("organizer_url") ? null : eventOrganizerUrl || null,
      event_unavailable_fields: eventUnavailableFields,
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
    const warnings: string[] = [...built.eventWarnings];
    if (eventSchemaEnabled && category === "news_events" && built.eventMissingCore.length > 0) {
      warnings.push(`Event Schema is not emitted for this language. Missing: ${built.eventMissingCore.join(", ")}.`);
    }
    if (faqIncludeSchema && !faqShowOnPage && localizedFaq.length > 0) {
      warnings.push("FAQPage Schema is disabled because its FAQ section is hidden from the public article.");
    }
    if (!localizedTitle.trim()) warnings.push("This language has no article title and will not be indexable.");
    if (!localizedDescription.trim()) warnings.push("Meta description and article excerpt are both empty.");
    if (headline.length > 60) warnings.push("SEO title is longer than 60 characters; Google may truncate or rewrite it.");
    if (localizedDescription.length > 160) warnings.push("Meta description is longer than 160 characters; Google may truncate it.");
    if (!/<h2[\s>]/i.test(localizedContent)) warnings.push("The article has no H2 section heading.");
    if (plainContent.slice(0, 150).length < 80) warnings.push("The opening 150 characters may not provide a complete direct answer.");
    if (/\b\d+(?:[.,]\d+)?%?\b/.test(plainContent) && !/https?:\/\//i.test(localizedContent)) warnings.push("The article contains numerical claims but no visible external source link.");
    return { ...built, breadcrumbSchema, breadcrumbLabels: [homeLabel, categoryLabel, localizedTitle], warnings };
  }, [article, authorCredential, authorCredentialZhCn, authorCredentialZhTw, authorName, authorNameZhCn, authorNameZhTw, authorTitle, authorTitleZhCn, authorTitleZhTw, category, content, contentZhCn, contentZhTw, description, descriptionZhCn, descriptionZhTw, eventAddress, eventAddressZhCn, eventAddressZhTw, eventAttendanceMode, eventEndDate, eventEndTime, eventOnlineUrl, eventOrganizerName, eventOrganizerNameZhCn, eventOrganizerNameZhTw, eventOrganizerUrl, eventPreviousStartDate, eventPreviousStartTime, eventSchemaEnabled, eventStartDate, eventStartTime, eventStatus, eventTimezone, eventUnavailableFields, eventVenueName, eventVenueNameZhCn, eventVenueNameZhTw, existingImages, faqIncludeSchema, faqItems, faqShowOnPage, imageMetadata, isEventUnavailable, metaDescription, metaDescriptionZhCn, metaDescriptionZhTw, publicUpdatedDate, publicationDate, published, schemaLanguage, seoTitle, seoTitleZhCn, seoTitleZhTw, slug, title, titleZhCn, titleZhTw, topicTerms, topicTermsZhCn, topicTermsZhTw]);

  const sidebarLanguages = [
    {
      value: "en" as const,
      label: "English",
      seo: seoTitle,
      setSeo: setSeoTitle,
      meta: metaDescription,
      setMeta: setMetaDescription,
      terms: topicTerms,
      setTerms: setTopicTerms,
      title,
      excerpt: description,
      content,
      authorName,
      setAuthorName,
      authorTitle,
      setAuthorTitle,
      authorCredential,
      setAuthorCredential,
      eventVenueName,
      setEventVenueName,
      eventAddress,
      setEventAddress,
      eventOrganizerName,
      setEventOrganizerName,
    },
    {
      value: "zhtw" as const,
      label: "繁體中文",
      seo: seoTitleZhTw,
      setSeo: setSeoTitleZhTw,
      meta: metaDescriptionZhTw,
      setMeta: setMetaDescriptionZhTw,
      terms: topicTermsZhTw,
      setTerms: setTopicTermsZhTw,
      title: titleZhTw,
      excerpt: descriptionZhTw,
      content: contentZhTw,
      authorName: authorNameZhTw,
      setAuthorName: setAuthorNameZhTw,
      authorTitle: authorTitleZhTw,
      setAuthorTitle: setAuthorTitleZhTw,
      authorCredential: authorCredentialZhTw,
      setAuthorCredential: setAuthorCredentialZhTw,
      eventVenueName: eventVenueNameZhTw,
      setEventVenueName: setEventVenueNameZhTw,
      eventAddress: eventAddressZhTw,
      setEventAddress: setEventAddressZhTw,
      eventOrganizerName: eventOrganizerNameZhTw,
      setEventOrganizerName: setEventOrganizerNameZhTw,
    },
    {
      value: "zhcn" as const,
      label: "简体中文",
      seo: seoTitleZhCn,
      setSeo: setSeoTitleZhCn,
      meta: metaDescriptionZhCn,
      setMeta: setMetaDescriptionZhCn,
      terms: topicTermsZhCn,
      setTerms: setTopicTermsZhCn,
      title: titleZhCn,
      excerpt: descriptionZhCn,
      content: contentZhCn,
      authorName: authorNameZhCn,
      setAuthorName: setAuthorNameZhCn,
      authorTitle: authorTitleZhCn,
      setAuthorTitle: setAuthorTitleZhCn,
      authorCredential: authorCredentialZhCn,
      setAuthorCredential: setAuthorCredentialZhCn,
      eventVenueName: eventVenueNameZhCn,
      setEventVenueName: setEventVenueNameZhCn,
      eventAddress: eventAddressZhCn,
      setEventAddress: setEventAddressZhCn,
      eventOrganizerName: eventOrganizerNameZhCn,
      setEventOrganizerName: setEventOrganizerNameZhCn,
    },
  ];
  const sidebarLanguage = sidebarLanguages.find((candidate) => candidate.value === sidebarLangTab) || sidebarLanguages[0];
  const articleUrlPreview = `${ORGANIZATION_URL}/${schemaLanguage}/articles/${getArticleCategoryPath(category)}/${normalizeArticleSlug(slug || title)}`;
  const imageKeys = [...existingImages, ...imageFiles.map((_, index) => `new-${index}`)];
  const altKey = sidebarLangTab === "zhtw" ? "alt_zhtw" : sidebarLangTab === "zhcn" ? "alt_zhcn" : "alt";
  const bodyH1Count = (sidebarLanguage.content.match(/<h1[\s>]/gi) || []).length;
  const faqCount = faqItems.filter((item) => {
    if (!item.enabled) return false;
    if (sidebarLangTab === "zhtw") return Boolean(item.question_zhtw.trim() && item.answer_zhtw.trim());
    if (sidebarLangTab === "zhcn") return Boolean(item.question_zhcn.trim() && item.answer_zhcn.trim());
    return Boolean(item.question.trim() && item.answer.trim());
  }).length;
  const seoScoreResult = computeSeoScore({
    seoTitle: sidebarLanguage.seo,
    metaDescription: sidebarLanguage.meta,
    keywords: sidebarLanguage.terms,
    faqCount,
    authorName: sidebarLanguage.authorName,
    authorTitle: sidebarLanguage.authorTitle,
    allImagesHaveAlt: imageKeys.length > 0 && imageKeys.every((key) => {
      const value = (imageMetadata[key] as unknown as Record<string, unknown> | undefined)?.[altKey];
      return typeof value === "string" && value.trim() !== "";
    }),
    h1Texts: [sidebarLanguage.title, ...Array.from({ length: bodyH1Count }, () => "")],
    internalLinkCount: countInternalLinks(sidebarLanguage.content),
  });

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
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
      <Tabs value={langTab} onValueChange={(value) => setLangTab(value as EditorLanguage)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="zhtw">繁體中文</TabsTrigger>
            <TabsTrigger value="zhcn">简体中文</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="en" className="space-y-6 mt-0">
          <div className="space-y-2">
            <Label htmlFor="title">Title (English)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}

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
            <Label htmlFor="content">Content (English)</Label>
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
            setPublicationDateChanged(true);
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
        <Label htmlFor="images">Images (Max 5, JPEG/PNG/WebP, 5MB each)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageChange}
            disabled={existingImages.length + imageFiles.length >= MAX_ARTICLE_IMAGES}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("images")?.click()}
            disabled={existingImages.length + imageFiles.length >= MAX_ARTICLE_IMAGES}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Images ({existingImages.length + imageFiles.length}/{MAX_ARTICLE_IMAGES})
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
        </div>

        <aside className="min-w-0 space-y-4 self-start lg:sticky lg:top-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-sm font-semibold">SEO & GEO language</p>
            <Tabs value={sidebarLangTab} onValueChange={(value) => setSidebarLangTab(value as EditorLanguage)}>
              <TabsList className="grid h-auto w-full grid-cols-3">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="zhtw">繁中</TabsTrigger>
                <TabsTrigger value="zhcn">简中</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="mt-2 text-xs text-muted-foreground">Independent from the content language tabs on the left.</p>
          </div>

          <SeoHealthScore result={seoScoreResult} />

          <CollapsibleSection title="SEO settings" description={`Editing ${sidebarLanguage.label}.`}>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-end justify-between gap-2">
                  <Label htmlFor={`sidebar-seo-title-${sidebarLangTab}`}>SEO title</Label>
                  <CharCounter current={sidebarLanguage.seo.length} recommendedMax={60} greenMax={50} />
                </div>
                <Input
                  id={`sidebar-seo-title-${sidebarLangTab}`}
                  value={sidebarLanguage.seo}
                  maxLength={120}
                  onChange={(event) => sidebarLanguage.setSeo(event.target.value)}
                  placeholder={sidebarLanguage.title || "Defaults to the article title"}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-end justify-between gap-2">
                  <Label htmlFor={`sidebar-meta-description-${sidebarLangTab}`}>Meta description</Label>
                  <CharCounter current={sidebarLanguage.meta.length} recommendedMax={160} greenMax={140} />
                </div>
                <Textarea
                  id={`sidebar-meta-description-${sidebarLangTab}`}
                  value={sidebarLanguage.meta}
                  maxLength={320}
                  rows={4}
                  onChange={(event) => sidebarLanguage.setMeta(event.target.value)}
                  placeholder="Leave empty to use the article excerpt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`sidebar-keywords-${sidebarLangTab}`}>Keywords</Label>
                <KeywordTagInput
                  id={`sidebar-keywords-${sidebarLangTab}`}
                  value={sidebarLanguage.terms}
                  onChange={sidebarLanguage.setTerms}
                  placeholder="Family office, Hong Kong taxation"
                />
              </div>

              <SerpPreview
                title={sidebarLanguage.seo || sidebarLanguage.title}
                description={sidebarLanguage.meta || sidebarLanguage.excerpt}
                url={articleUrlPreview}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Author" description="Optional. Outputs Person schema when this language has a name." defaultOpen={false}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`sidebar-author-name-${sidebarLangTab}`}>Name ({sidebarLanguage.label})</Label>
                <Input id={`sidebar-author-name-${sidebarLangTab}`} value={sidebarLanguage.authorName} maxLength={120} onChange={(event) => sidebarLanguage.setAuthorName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`sidebar-author-title-${sidebarLangTab}`}>Job title ({sidebarLanguage.label})</Label>
                <Input id={`sidebar-author-title-${sidebarLangTab}`} value={sidebarLanguage.authorTitle} maxLength={160} onChange={(event) => sidebarLanguage.setAuthorTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`sidebar-author-credential-${sidebarLangTab}`}>Credentials ({sidebarLanguage.label})</Label>
                <Input id={`sidebar-author-credential-${sidebarLangTab}`} value={sidebarLanguage.authorCredential} maxLength={300} onChange={(event) => sidebarLanguage.setAuthorCredential(event.target.value)} />
              </div>
            </div>
          </CollapsibleSection>

          {category === "news_events" && (
            <CollapsibleSection title="Event details" description="Structured fields for offline, online, or mixed events." defaultOpen={false}>
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
                  <div>
                    <Label htmlFor="event-schema-enabled">Enable Event Schema</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Only enable this for a real event, not a general news article.</p>
                  </div>
                  <Switch id="event-schema-enabled" checked={eventSchemaEnabled} onCheckedChange={setEventSchemaEnabled} />
                </div>

                {eventSchemaEnabled && (
                  <>
                    <FieldWithNoData
                      id="event-attendance-mode"
                      label="Activity format"
                      unavailable={isEventUnavailable("attendance_mode")}
                      onUnavailableChange={(value) => setEventUnavailable("attendance_mode", value)}
                    >
                      <Select value={eventAttendanceMode || undefined} onValueChange={(value) => { setEventAttendanceMode(value as EventAttendanceMode); setEventUnavailable("attendance_mode", false); }} disabled={isEventUnavailable("attendance_mode")}>
                        <SelectTrigger id="event-attendance-mode"><SelectValue placeholder="Select format" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="offline">Offline / 线下</SelectItem>
                          <SelectItem value="online">Online / 线上</SelectItem>
                          <SelectItem value="mixed">Mixed / 混合</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWithNoData>

                    <div className="grid gap-4">
                      <FieldWithNoData id="event-start-date" label="Start date" unavailable={isEventUnavailable("start_date")} onUnavailableChange={(value) => setEventUnavailable("start_date", value)}>
                        <Input id="event-start-date" type="date" value={eventStartDate} disabled={isEventUnavailable("start_date")} onChange={(event) => setEventStartDate(event.target.value)} />
                      </FieldWithNoData>
                      <FieldWithNoData id="event-start-time" label="Start time" unavailable={isEventUnavailable("start_time")} onUnavailableChange={(value) => setEventUnavailable("start_time", value)}>
                        <Input id="event-start-time" type="time" value={eventStartTime} disabled={isEventUnavailable("start_time")} onChange={(event) => setEventStartTime(event.target.value)} />
                      </FieldWithNoData>
                      <FieldWithNoData id="event-end-date" label="End date" unavailable={isEventUnavailable("end_date")} onUnavailableChange={(value) => setEventUnavailable("end_date", value)}>
                        <Input id="event-end-date" type="date" min={eventStartDate || undefined} value={eventEndDate} disabled={isEventUnavailable("end_date")} onChange={(event) => setEventEndDate(event.target.value)} />
                      </FieldWithNoData>
                      {eventEndDate && !isEventUnavailable("end_date") && (
                        <FieldWithNoData id="event-end-time" label="End time" unavailable={isEventUnavailable("end_time")} onUnavailableChange={(value) => setEventUnavailable("end_time", value)}>
                          <Input id="event-end-time" type="time" value={eventEndTime} disabled={isEventUnavailable("end_time")} onChange={(event) => setEventEndTime(event.target.value)} />
                        </FieldWithNoData>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-timezone">IANA time zone</Label>
                      <Input id="event-timezone" value={eventTimezone} maxLength={64} onChange={(event) => setEventTimezone(event.target.value)} placeholder="Asia/Hong_Kong" />
                    </div>

                    <FieldWithNoData id="event-status" label="Event status" unavailable={isEventUnavailable("status")} onUnavailableChange={(value) => setEventUnavailable("status", value)}>
                      <Select value={eventStatus || undefined} onValueChange={(value) => { setEventStatus(value as EventStatus); setEventUnavailable("status", false); }} disabled={isEventUnavailable("status")}>
                        <SelectTrigger id="event-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="postponed">Postponed</SelectItem>
                          <SelectItem value="rescheduled">Rescheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWithNoData>

                    {eventStatus === "rescheduled" && !isEventUnavailable("status") && (
                      <div className="grid gap-4">
                        <FieldWithNoData id="event-previous-start-date" label="Previous start date" unavailable={isEventUnavailable("previous_start_date")} onUnavailableChange={(value) => setEventUnavailable("previous_start_date", value)}>
                          <Input id="event-previous-start-date" type="date" value={eventPreviousStartDate} disabled={isEventUnavailable("previous_start_date")} onChange={(event) => setEventPreviousStartDate(event.target.value)} />
                        </FieldWithNoData>
                        <FieldWithNoData id="event-previous-start-time" label="Previous start time" unavailable={isEventUnavailable("previous_start_time")} onUnavailableChange={(value) => setEventUnavailable("previous_start_time", value)}>
                          <Input id="event-previous-start-time" type="time" value={eventPreviousStartTime} disabled={isEventUnavailable("previous_start_time")} onChange={(event) => setEventPreviousStartTime(event.target.value)} />
                        </FieldWithNoData>
                      </div>
                    )}

                    {(eventAttendanceMode === "offline" || eventAttendanceMode === "mixed") && !isEventUnavailable("attendance_mode") && (
                      <>
                        <FieldWithNoData
                          id={`event-venue-${sidebarLangTab}`}
                          label={`Venue (${sidebarLanguage.label})`}
                          unavailable={isEventUnavailable("venue_name", sidebarLangTab)}
                          onUnavailableChange={(value) => setEventUnavailable("venue_name", value, sidebarLangTab)}
                        >
                          <Input id={`event-venue-${sidebarLangTab}`} value={sidebarLanguage.eventVenueName} maxLength={200} disabled={isEventUnavailable("venue_name", sidebarLangTab)} onChange={(event) => sidebarLanguage.setEventVenueName(event.target.value)} />
                        </FieldWithNoData>
                        <FieldWithNoData
                          id={`event-address-${sidebarLangTab}`}
                          label={`Detailed address (${sidebarLanguage.label})`}
                          unavailable={isEventUnavailable("address", sidebarLangTab)}
                          onUnavailableChange={(value) => setEventUnavailable("address", value, sidebarLangTab)}
                        >
                          <Textarea id={`event-address-${sidebarLangTab}`} value={sidebarLanguage.eventAddress} maxLength={500} rows={3} disabled={isEventUnavailable("address", sidebarLangTab)} onChange={(event) => sidebarLanguage.setEventAddress(event.target.value)} />
                        </FieldWithNoData>
                      </>
                    )}

                    {(eventAttendanceMode === "online" || eventAttendanceMode === "mixed") && !isEventUnavailable("attendance_mode") && (
                      <FieldWithNoData id="event-online-url" label="Online event URL" unavailable={isEventUnavailable("online_url")} onUnavailableChange={(value) => setEventUnavailable("online_url", value)}>
                        <Input id="event-online-url" type="url" value={eventOnlineUrl} maxLength={2048} disabled={isEventUnavailable("online_url")} onChange={(event) => setEventOnlineUrl(event.target.value)} placeholder="https://" />
                      </FieldWithNoData>
                    )}

                    <FieldWithNoData
                      id={`event-organizer-${sidebarLangTab}`}
                      label={`Organizer (${sidebarLanguage.label})`}
                      unavailable={isEventUnavailable("organizer_name", sidebarLangTab)}
                      onUnavailableChange={(value) => setEventUnavailable("organizer_name", value, sidebarLangTab)}
                    >
                      <Input id={`event-organizer-${sidebarLangTab}`} value={sidebarLanguage.eventOrganizerName} maxLength={200} disabled={isEventUnavailable("organizer_name", sidebarLangTab)} onChange={(event) => sidebarLanguage.setEventOrganizerName(event.target.value)} />
                    </FieldWithNoData>

                    <FieldWithNoData id="event-organizer-url" label="Organizer URL" unavailable={isEventUnavailable("organizer_url")} onUnavailableChange={(value) => setEventUnavailable("organizer_url", value)}>
                      <Input id="event-organizer-url" type="url" value={eventOrganizerUrl} maxLength={2048} disabled={isEventUnavailable("organizer_url")} onChange={(event) => setEventOrganizerUrl(event.target.value)} placeholder="https://" />
                    </FieldWithNoData>

                    {eventAttendanceMode === "online" && (
                      <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">Pure online events can use Schema.org Event, but Google Event rich results currently require a physical location.</p>
                    )}
                    {getInvalidEventFields().length > 0 && <p className="text-xs text-destructive">Check event information: {getInvalidEventFields().join(", ")}.</p>}
                    {getUnansweredEventFields().length > 0 && (
                      <p className="text-xs text-muted-foreground">For richer event information, fill in or mark No data / 无: {getUnansweredEventFields().join(", ")}.</p>
                    )}
                  </>
                )}
              </div>
            </CollapsibleSection>
          )}

          <CollapsibleSection title="FAQ" description="Article-specific questions for the page and FAQPage Schema." defaultOpen={false}>
            <div className="mb-4 space-y-3 border-b border-border pb-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="faq-show-on-page" className="text-sm font-normal">Show this article's FAQ on its public page</Label>
                <Switch id="faq-show-on-page" checked={faqShowOnPage} onCheckedChange={(checked) => { setFaqShowOnPage(checked); if (!checked) setFaqIncludeSchema(false); }} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="faq-include-schema" className="text-sm font-normal">Include this article's visible FAQs in FAQPage JSON-LD</Label>
                <Switch id="faq-include-schema" checked={faqIncludeSchema} disabled={!faqShowOnPage} onCheckedChange={setFaqIncludeSchema} />
              </div>
              <p className="text-xs text-muted-foreground">Google retired FAQ rich results in 2026; the standard Schema.org markup remains useful for machine-readable context.</p>
            </div>
            <ArticleFaqEditor items={faqItems} onChange={setFaqItems} language={sidebarLangTab} />
          </CollapsibleSection>

          <CollapsibleSection title="Schema preview" description="Read-only JSON-LD for the selected SEO language." defaultOpen={false}>
            <SchemaPreview
              language={schemaLanguage}
              articleSchema={schemaDraft.articleSchema}
              personSchema={schemaDraft.personSchema}
              faqSchema={schemaDraft.faqSchema}
              eventSchema={schemaDraft.eventSchema}
              breadcrumbSchema={schemaDraft.breadcrumbSchema}
              breadcrumbLabels={schemaDraft.breadcrumbLabels}
              pageUrl={articleUrlPreview}
              warnings={schemaDraft.warnings}
            />
          </CollapsibleSection>
        </aside>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={published}
            onCheckedChange={setPublishChecked}
          />
          <Label htmlFor="published">Publish article</Label>
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

const countInternalLinks = (html: string) => {
  if (!html.trim()) return 0;
  if (typeof DOMParser === "undefined") {
    return (html.match(/href\s*=\s*["'](?:\/(?!\/)|https?:\/\/(?:www\.)?foihk\.org)/gi) || []).length;
  }
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return [...parsed.querySelectorAll("a[href]")].filter((anchor) => {
    const href = anchor.getAttribute("href") || "";
    return (href.startsWith("/") && !href.startsWith("//")) || /^https?:\/\/(?:www\.)?foihk\.org(?:\/|$)/i.test(href);
  }).length;
};

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

const FieldWithNoData = ({
  id,
  label,
  unavailable,
  onUnavailableChange,
  children,
}: {
  id: string;
  label: string;
  unavailable: boolean;
  onUnavailableChange: (unavailable: boolean) => void;
  children: ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id}>{label}</Label>
      <label htmlFor={`${id}-unavailable`} className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <span>No data / 无</span>
        <Switch id={`${id}-unavailable`} checked={unavailable} onCheckedChange={onUnavailableChange} />
      </label>
    </div>
    {children}
  </div>
);

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
