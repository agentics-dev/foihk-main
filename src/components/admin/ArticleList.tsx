import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import type { SiteDeployStatus } from "@/lib/siteDeploy";
import { saveArticle, deleteArticle } from "@/lib/articleEditor";
import { canPublishArticle } from "@/lib/articlePublication";
import { getArticleSyncLabel } from "@/lib/siteDeploy";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ArticleListProps {
  category: "education_research" | "news_events" | "philanthropy";
  onEdit: (article: ArticleRow) => void;
  deployStatus: SiteDeployStatus | null;
  onContentChanged: () => void | Promise<void>;
}

type ArticleRow = Tables<"articles">;

export const ArticleList = ({ category, onEdit, deployStatus, onContentChanged }: ArticleListProps) => {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive",
      });
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  }, [category, toast]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const [writing, setWriting] = useState(false);
  const mutate = async (operation: () => Promise<unknown>) => {
    setWriting(true);
    try {
      await operation();
      toast({ title: "Article saved", description: "The change is saved. Static synchronization is shown separately." });
      await onContentChanged();
      await fetchArticles();
    } catch (error) {
      toast({ title: "Change not saved", description: error instanceof Error ? error.message : "Please retry", variant: "destructive" });
    } finally { setWriting(false); }
  };
  const handleDelete = (article: ArticleRow) => mutate(() => deleteArticle(article));
  const togglePublished = (article: ArticleRow) => mutate(async () => {
    if (!article.published && !canPublishArticle(article)) throw new Error("Add a title and text or an image before publishing.");
    return saveArticle({ published: !article.published }, article);
  });

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No articles yet. Create your first one!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {articles.map((article) => {
        const deliveryLabel = getArticleSyncLabel(deployStatus, article.id);
        const deliveryFailed = deliveryLabel === "Sync failed";
        return (
        <Card key={article.id}>
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              {article.image_urls && article.image_urls.length > 0 && (
                <div className="relative flex-shrink-0">
                  <img
                    src={article.image_urls[0]}
                    alt={article.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                  {article.image_urls.length > 1 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs">
                      {article.image_urls.length}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-xl">{article.title}</CardTitle>
                <CardDescription className="mt-2">{article.excerpt}</CardDescription>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {new Date(article.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
              <Badge variant={deliveryFailed ? "destructive" : deliveryLabel === "Sync verified" ? "default" : "secondary"} className="flex-shrink-0">
                {article.published ? "Published" : "Draft"} · {deliveryLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(article)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={writing} onClick={() => togglePublished(article)}
              >
                {article.published ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the article.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={writing} onClick={() => handleDelete(article)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
};
