import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleList } from "@/components/admin/ArticleList";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { SiteDeployStatusCard } from "@/components/admin/SiteDeployStatusCard";
import { LogOut, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Session } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";
import { requestSiteDeployStatus, type SiteDeployStatus } from "@/lib/siteDeploy";

type ArticleRow = Tables<"articles">;
type ArticleCategory = ArticleRow["category"];

const AdminDashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleRow | null>(null);
  const [activeTab, setActiveTab] = useState<ArticleCategory>("education_research");
  const [deployStatus, setDeployStatus] = useState<SiteDeployStatus | null>(null);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployActionLoading, setDeployActionLoading] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const statusRequest = useRef(0);
  const refreshDeployStatus = useCallback(async () => {
    const requestId = ++statusRequest.current;
    setDeployLoading(true);
    setDeployStatus(null);
    try {
      const next = await requestSiteDeployStatus();
      if (requestId !== statusRequest.current) return;
      setDeployStatus(next);
      setDeployError(null);
    } catch (error) {
      if (requestId !== statusRequest.current) return;
      setDeployError(error instanceof Error ? error.message : "Unable to load production publishing status");
    } finally {
      if (requestId === statusRequest.current) setDeployLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error || !roles) {
        toast({
          title: "Access Denied",
          description: "You do not have administrator privileges",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      setSession(session);
    };

    checkAdminAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        navigate("/admin");
        return;
      }

      // Defer role check to avoid blocking auth state change
      setTimeout(async () => {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!roles) {
          toast({
            title: "Access Denied",
            description: "You do not have administrator privileges",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate("/admin");
        } else {
          setSession(session);
        }
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  useEffect(() => {
    if (!session) return undefined;
    void refreshDeployStatus();
    const interval = window.setInterval(() => void refreshDeployStatus(), 15_000);
    return () => window.clearInterval(interval);
  }, [refreshDeployStatus, session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
    navigate("/admin");
  };

  const handleEdit = (article: ArticleRow) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingArticle(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    void refreshDeployStatus();
  };

  const handleDeployAction = async (action: "retry" | "rebuild") => {
    setDeployActionLoading(true);
    try {
      const status = await requestSiteDeployStatus(action);
      setDeployStatus(status);
      setDeployError(null);
      toast({
        title: action === "retry" ? "Rebuild retry queued" : "Full content rebuild queued",
        description: "Production will be marked Live only after raw HTML verification succeeds.",
      });
    } catch (error) {
      toast({
        title: "Unable to queue deployment",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setDeployActionLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Admin Dashboard | FOIHK"
        description="Private FOIHK content management dashboard for creating, editing, organizing, and publishing Family Office Institute Hong Kong articles and updates securely."
        noindex
      />
      <Navigation />
      
      <div className="border-b border-border bg-secondary/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FOIHK Admin Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <SiteDeployStatusCard
            deploy={deployStatus}
            loading={deployLoading}
            error={deployError}
            actionLoading={deployActionLoading}
            onRefresh={() => void refreshDeployStatus()}
            onAction={(action) => void handleDeployAction(action)}
          />
        </div>
        {showForm ? (
          <div className="space-y-4">
            <Button variant="outline" onClick={handleFormClose}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Article List
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>{editingArticle ? "Edit Article" : "Create New Article"}</CardTitle>
                <CardDescription>
                  Fill in the details below to {editingArticle ? "update" : "create"} an article
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArticleForm
                  article={editingArticle}
                  category={activeTab}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormClose}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Content Management</h2>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Article
              </Button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                if (value === "education_research" || value === "news_events" || value === "philanthropy") {
                  setActiveTab(value);
                }
              }}
            >
              <TabsList className="grid w-full max-w-xl grid-cols-3">
                <TabsTrigger value="education_research">{t("nav.educationResearch")}</TabsTrigger>
                <TabsTrigger value="news_events">{t("nav.newsEvents")}</TabsTrigger>
                <TabsTrigger value="philanthropy">{t("nav.philanthropy")}</TabsTrigger>
              </TabsList>

              <TabsContent value="education_research" className="mt-6">
                <ArticleList category="education_research" onEdit={handleEdit} deployStatus={deployStatus} onContentChanged={refreshDeployStatus} />
              </TabsContent>

              <TabsContent value="news_events" className="mt-6">
                <ArticleList category="news_events" onEdit={handleEdit} deployStatus={deployStatus} onContentChanged={refreshDeployStatus} />
              </TabsContent>

              <TabsContent value="philanthropy" className="mt-6">
                <ArticleList category="philanthropy" onEdit={handleEdit} deployStatus={deployStatus} onContentChanged={refreshDeployStatus} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
