---
name: "admin-replicator"
description: "Builds a multi-language content management admin dashboard with authentication, article CRUD, image management with crop, and publish workflow using React + TypeScript + Supabase. Invoke when user wants to create or replicate an admin backend with multilingual article management."
---

# Admin Dashboard Replicator

This skill guides the creation of a production-ready admin dashboard for multilingual content management, based on the FOIHK admin system architecture. It covers authentication, article CRUD with rich text editing, image management with crop/focus, multi-language content, preview dialogs, and publish workflows.

## IMPORTANT: Mandatory Confirmation Step

**Before doing ANY coding or file creation, you MUST ask the user the following two questions using the `AskUserQuestion` tool.** Do NOT proceed until both questions are answered.

### Question 1: Content Modules (Categories)

Ask the user:
> "What content modules/categories should the admin dashboard have? Please list them, including their names and optional descriptions."

The original system has: `education_research`, `news_events`, `philanthropy`. For the new site, the user may want different categories (e.g., `blog`, `products`, `events`, `services`).

**Why this matters:** The category enum drives the database schema (the `article_category` enum), the dashboard tab structure, the article list filtering, the form logic, and the frontend display.

### Question 2: Languages

Ask the user:
> "Which languages should the admin dashboard support? Please list them."

The original system has: `en` (English), `zh-TW` (Traditional Chinese), `zh-CN` (Simplified Chinese). For the new site, the user may want fewer or different languages (e.g., just `en` and `fr`, or `en`, `ja`, `ko`).

**Why this matters:** The language list drives the database column structure (`{field}_langcode` naming convention), the form tab structure, the `getLocalizedField` utility function, and the frontend i18n.

### Starting Work

Only after receiving clear answers to both questions, proceed to build the admin system following the architecture described below.

---

## System Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React + TypeScript |
| Build Tool | Vite |
| UI Components | shadcn/ui (Radix UI primitives + Tailwind CSS) |
| Database / Auth / Storage | Supabase |
| Rich Text Editor | ReactQuill |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Image Cropping | react-easy-crop |
| Routing | react-router-dom v6 |
| Toast Notifications | shadcn/ui Sonner + useToast |

### Route Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | Auth | Admin login page (email/password) |
| `/admin/dashboard` | AdminDashboard | Main admin panel (requires auth + admin role) |

---

## Module 1: Authentication & Authorization

### Auth.tsx — Login Page

- **Path**: `src/pages/Auth.tsx`
- Uses Supabase `signInWithPassword` for login
- Uses Supabase `signUp` for account creation (with `emailRedirectTo`)
- Contains both Sign In and Sign Up tabs
- On successful auth, navigates to `/admin/dashboard`
- Uses `onAuthStateChange` listener to auto-redirect if session exists
- Sets `SEO noindex` to prevent search engine indexing

### AdminDashboard.tsx — Access Control

- **Path**: `src/pages/AdminDashboard.tsx`
- Double-layer authorization:
  1. Check Supabase Auth session exists
  2. Query `user_roles` table for `admin` role
- On auth state change, re-validate role
- If unauthorized: show toast, sign out, redirect to `/admin`

### Database: `user_roles` Table

```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  PRIMARY KEY (user_id, role)
);

-- RLS function
CREATE OR REPLACE FUNCTION has_role(user_id UUID, role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = $1 AND user_roles.role = $2
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## Module 2: Admin Dashboard Main Panel

### AdminDashboard.tsx — Layout

- **Path**: `src/pages/AdminDashboard.tsx`
- Header bar: site title + Sign Out button
- State management: `showForm` (boolean), `editingArticle` (article object or null), `activeTab` (current category)
- When `showForm` is false → show tabs + article list
- When `showForm` is true → show article form (create or edit mode)
- Three tabs based on user's configured categories (use `Tabs` from shadcn/ui)
- Each tab renders `<ArticleList category={category} onEdit={handleEdit} />`
- "New Article" button sets `showForm = true` and `editingArticle = null`
- "Edit" (from list) sets `showForm = true` and `editingArticle = article`
- "Back to Article List" resets both

---

## Module 3: Article List (ArticleList.tsx)

### Path: `src/components/admin/ArticleList.tsx`

### Props

```typescript
interface ArticleListProps {
  category: string; // one of the user-configured categories
  onEdit: (article: any) => void;
}
```

### Features

- Fetches articles from Supabase filtered by `category`, ordered by `created_at` DESC
- Each article card displays:
  - First image thumbnail (with count badge if multiple images exist)
  - Article title (primary language)
  - Article excerpt/description (primary language)
  - Creation date
  - Publish status badge: "Published" (green default badge) / "Draft" (gray secondary badge)
- Three action buttons per article:

| Action | Behavior |
|--------|----------|
| **Edit** | Calls `onEdit(article)` to open the form in edit mode |
| **Publish/Unpublish** | Toggles `published` boolean; sets `published_at` to now() when publishing, null when unpublishing |
| **Delete** | Opens `AlertDialog` for confirmation; on confirm, deletes from Supabase and refreshes list |

### Delete Confirmation

Use shadcn/ui `AlertDialog` component with headline "Are you sure?" and description "This action cannot be undone. This will permanently delete the article."

---

## Module 4: Article Form (ArticleForm.tsx) — Core Module

### Path: `src/components/admin/ArticleForm.tsx`

### Props

```typescript
interface ArticleFormProps {
  article?: any; // null for create, populated for edit
  category: string; // current category
  onSuccess: () => void;
  onCancel: () => void;
}
```

### Multi-Language Content Tabs

The form uses shadcn/ui `Tabs` with one tab per language. Each tab contains:

| Field | Component | Required |
|-------|-----------|----------|
| Title | `Input` (text) | Yes (for primary language only) |
| Description/Excerpt | `Textarea` (3 rows) | No |
| Content | ReactQuill rich text editor | Yes (for primary language only) |

### ReactQuill Configuration

```typescript
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': ['arial', 'times-new-roman', 'courier-new', 'georgia', 'verdana', ''] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'image', 'video'],
    ['blockquote', 'code-block'],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['clean']
  ]
};
```

### Slug Generation

- Auto-generated from the primary language title on create
- Uses `toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')`
- Manually editable in a dedicated Slug input field
- Only auto-generates when creating a new article (not on edit)

### Date Picker

- Uses shadcn/ui `Popover` + react-day-picker `Calendar` component
- Allows selecting the article's created date
- Shows formatted date with `format(date, "PPP")` from date-fns

### Publish Toggle

- `Switch` component with label "Publish immediately"
- Toggles `published` boolean state

---

## Module 5: Image Management

### Upload

- File input (hidden) triggered by a button
- Maximum 5 images (total existing + new)
- Shows count: "Upload Images (2/5)"
- Uploads to Supabase Storage `article-images` bucket on form submit
- File naming: `${random}.${timestamp}.${extension}`

### Drag-to-Reorder

- Uses `@dnd-kit/core` and `@dnd-kit/sortable`
- Separate DndContext for existing images and new images
- `SortableContext` with `verticalListSortingStrategy`
- Each image item is a `SortableImageItem` component with drag handle (GripVertical icon)

### Image Crop Dialog (ImageCropperDialog.tsx)

- **Path**: `src/components/admin/ImageCropperDialog.tsx`
- Uses `react-easy-crop` with 16:9 aspect ratio
- Zoom control via shadcn/ui `Slider` (range: 0.5 to 3, step: 0.1)
- Saves crop data as `ImageCropData` interface:

```typescript
interface ImageCropData {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPercentages: { x: number; y: number; width: number; height: number } | null;
  focus: { x: number; y: number };
}
```

### CroppedImage Component (Frontend Rendering)

- **Path**: `src/components/CroppedImage.tsx`
- Renders images with crop metadata applied via CSS transforms
- Takes `src`, `alt`, `metadata` (ImageCropData), `containerClassName`, `className`
- Falls back to standard `object-cover` rendering if no metadata

### Form Submit — Image Upload Flow

1. Upload new image files to Supabase Storage
2. Merge existing image URLs with newly uploaded URLs
3. Remap image metadata keys from temporary IDs (`new-0`, `new-1`) to actual URLs
4. Store `image_urls` as PostgreSQL `text[]` and `image_metadata` as JSONB

---

## Module 6: Article Preview Dialog (ArticlePreviewDialog.tsx)

### Path: `src/components/admin/ArticlePreviewDialog.tsx`

### IMPORTANT: All layouts use 1 column

The preview dialog shows how the article card will appear in different device layouts. **All three layouts show 1 column each**:

| Layout | Columns | Description |
|--------|---------|-------------|
| Desktop | **1 column** | Single card preview |
| Tablet | **1 column** | Single card preview |
| Mobile | **1 column** | Single card preview |

### Props

```typescript
interface ArticlePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  excerpt: string;
  createdDate: Date;
  imageUrl: string | null;
  imageMetadata: any;
}
```

### Card Layout

Each card contains:
1. **Image**: Uses `CroppedImage` component with metadata, or placeholder with Calendar icon if no image
2. **Date**: Calendar icon + formatted date (using `toLocaleDateString`)
3. **Title**: Bold, 2-line clamp (`line-clamp-2`)
4. **Excerpt**: Muted text, 3-line clamp (`line-clamp-3`)

### Dialog Size

- `max-w-[1100px]` dialog width
- `max-h-[90vh]` with overflow scroll
- Three sections labeled "Desktop (1 column)", "Tablet (1 column)", "Mobile (1 column)"

### Implementation Reference

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="!max-w-[1100px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Card Preview — Articles Listing</DialogTitle>
    </DialogHeader>
    <div className="space-y-8 py-2">
      {/* Desktop: 1 column */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-4">
          Desktop (1 column)
        </p>
        <div className="max-w-[1024px] mx-auto px-4">
          <div className="grid gap-6">
            {card}
          </div>
        </div>
      </div>

      {/* Tablet: 1 column */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-4">
          Tablet (1 column)
        </p>
        <div className="max-w-[1024px] mx-auto px-4">
          <div className="grid gap-6">
            {card}
          </div>
        </div>
      </div>

      {/* Mobile: 1 column */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-4">
          Mobile (1 column)
        </p>
        <div className="max-w-[1024px] mx-auto px-4">
          <div className="grid gap-6">
            {card}
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

## Database Schema

### `articles` Table

```sql
CREATE TYPE article_category AS ENUM ('<category1>', '<category2>', ...);

CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  -- For each additional language, add: title_<langcode> TEXT
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  -- For each additional language, add: excerpt_<langcode> TEXT
  content TEXT,
  -- For each additional language, add: content_<langcode> TEXT
  image_urls TEXT[],
  image_metadata JSONB,
  category article_category NOT NULL,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Published articles are publicly readable
CREATE POLICY "Published articles are viewable" ON articles
  FOR SELECT USING (published = true);

-- RLS: Authenticated admin can do all operations
CREATE POLICY "Admin full access" ON articles
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

### Language Column Naming Convention

Use suffix pattern: `{base_field}_{langcode}`. Examples:
- For primary language `en`: `title`, `excerpt`, `content`
- For `zh`: `title_zh`, `excerpt_zh`, `content_zh`
- For `fr`: `title_fr`, `excerpt_fr`, `content_fr`

---

## Utility: getLocalizedField

### Path: `src/lib/utils.ts`

```typescript
export function getLocalizedField<T = string>(
  article: Record<string, any> | null,
  field: string,
  language: string
): T {
  if (!article) return "" as T;
  
  // Map of language codes to field suffixes
  const langSuffixMap: Record<string, string> = {
    // Configure based on user's language choices
    // 'zh-TW': 'zhtw',
    // 'zh-CN': 'zhcn',
  };
  
  const suffix = langSuffixMap[language];
  if (suffix && article[`${field}_${suffix}`]) {
    return article[`${field}_${suffix}`] as T;
  }
  
  return (article[field] ?? "") as T;
}
```

---

## Supabase Storage

### Bucket: `article-images`

- Set to public access
- RLS policies for admin INSERT/UPDATE/DELETE
- Upload path: `{random}-{timestamp}.{extension}`

---

## Code Example: Multi-Language Form State

For each language configured by the user, create corresponding state variables:

```typescript
// Primary language (first in user's list)
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [content, setContent] = useState("");

// Additional language 1
const [titleLang1, setTitleLang1] = useState("");
const [descriptionLang1, setDescriptionLang1] = useState("");
const [contentLang1, setContentLang1] = useState("");

// Additional language 2
const [titleLang2, setTitleLang2] = useState("");
const [descriptionLang2, setDescriptionLang2] = useState("");
const [contentLang2, setContentLang2] = useState("");
```

---

## Code Example: Multi-Language Tab Structure

```tsx
<Tabs value={langTab} onValueChange={setLangTab}>
  <div className="flex items-center justify-between mb-4">
    <TabsList>
      <TabsTrigger value="en">English</TabsTrigger>
      <TabsTrigger value="zh">中文</TabsTrigger>
      {/* ... more languages as configured */}
    </TabsList>
  </div>

  <TabsContent value="en" className="space-y-6 mt-0">
    {/* Title, Description, Content fields for English */}
  </TabsContent>

  <TabsContent value="zh" className="space-y-6 mt-0">
    {/* Title, Description, Content fields for Chinese */}
  </TabsContent>
</Tabs>
```

---

## Files to Create Checklist

| File | Purpose |
|------|---------|
| `src/pages/Auth.tsx` | Admin login/signup page |
| `src/pages/AdminDashboard.tsx` | Main admin panel with tabs |
| `src/components/admin/ArticleList.tsx` | Article list with edit/publish/delete |
| `src/components/admin/ArticleForm.tsx` | Multi-language article form |
| `src/components/admin/ImageCropperDialog.tsx` | Image crop dialog |
| `src/components/admin/ArticlePreviewDialog.tsx` | Card preview (1 column all layouts) |
| `src/components/CroppedImage.tsx` | Crop-aware image renderer |
| `src/lib/utils.ts` | `getLocalizedField` utility |
| `src/App.tsx` | Route additions (/admin, /admin/dashboard) |

### Route Registration in App.tsx

```tsx
<Route path="/admin" element={<Auth />} />
<Route path="/admin/dashboard" element={<AdminDashboard />} />
```

---

## Summary

When invoked, this skill will:

1. **Ask the user** what content categories/modules and languages they need
2. **Generate all required files** with the correct category enum, language tabs, and database schema
3. **Use 1-column layout** for all preview dialog views (Desktop, Tablet, Mobile)
4. **Set up Supabase** tables, RLS policies, storage bucket, and auth configuration
5. **Maintain conventions**: multi-language field naming, category-driven filtering, admin role authorization
