import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Mail, MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { toast } from "sonner";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_CONTACT_POINT,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_URL,
} from "@/lib/schema";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const Contact = () => {
  const { t, language } = useLanguage();
  const homeLabel = language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页";
  const meta = language === "en"
    ? { title: "Contact FOIHK", description: "Contact FOIHK about research, education, events, philanthropy, media, partnerships, or participation in Hong Kong's family office community." }
    : language === "zh-hk"
      ? { title: "聯絡香港家族辦公室學會", description: "聯絡 FOIHK 查詢研究、教育、活動、慈善、媒體、合作或參與香港家族辦公室社群。" }
      : { title: "联系香港家族办公室学会", description: "联系 FOIHK 查询研究、教育、活动、慈善、媒体、合作或参与香港家族办公室社群。" };
  const formCard = useScrollAnimation(0.3);
  const contactCards = useScrollAnimation(0.3);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors in the form", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("contact_submissions")
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        });

      if (error) throw error;

      toast.success("Your message has been sent successfully! We will get back to you shortly.", {
        icon: <CheckCircle className="h-4 w-4" />,
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again later.", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={meta.title}
        description={meta.description}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": t("contact.title"),
          "description": meta.description,
          "url": `${ORGANIZATION_URL}/${language}/contact`,
          "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
          "about": {
            "@type": "Organization",
            "name": ORGANIZATION_ENGLISH_NAME,
            "alternateName": ORGANIZATION_ALTERNATE_NAMES,
            "legalName": ORGANIZATION_LEGAL_NAME,
            "url": ORGANIZATION_URL
          },
          "mainEntity": {
            "@type": "Organization",
            "name": ORGANIZATION_ENGLISH_NAME,
            "alternateName": ORGANIZATION_ALTERNATE_NAMES,
            "legalName": ORGANIZATION_LEGAL_NAME,
            "address": ORGANIZATION_ADDRESS,
            "contactPoint": ORGANIZATION_CONTACT_POINT
          }
        }}
        breadcrumbs={[
          { name: homeLabel, url: `${ORGANIZATION_URL}/${language}` },
          { name: t("contact.title"), url: `${ORGANIZATION_URL}/${language}/contact` },
        ]}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: homeLabel, to: "/" }, { label: t("contact.title") }]} />
          <h1 className="text-4xl font-bold text-foreground mb-8 text-center">{t("contact.title")}</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card 
              ref={formCard.elementRef}
              className={`shadow-elegant ${
                formCard.isVisible 
                  ? 'animate-in slide-in-from-left-8 fade-in duration-300' 
                  : ''
              }`}
            >
              <CardHeader>
                <CardTitle>{t("contact.getInTouch")}</CardTitle>
                <CardDescription>
                  {t("contact.getInTouchDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("contact.name")}</Label>
                    <Input
                      id="name"
                      placeholder={t("contact.namePlaceholder")}
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("contact.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("contact.emailPlaceholder")}
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t("contact.subject")}</Label>
                    <Input
                      id="subject"
                      placeholder={t("contact.subjectPlaceholder")}
                      value={formData.subject}
                      onChange={(e) => handleChange("subject", e.target.value)}
                      className={errors.subject ? "border-destructive" : ""}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">{errors.subject}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t("contact.message")}</Label>
                    <Textarea
                      id="message"
                      placeholder={t("contact.messagePlaceholder")}
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      t("contact.sendMessage")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div 
              ref={contactCards.elementRef}
              className={`space-y-6 ${
                contactCards.isVisible 
                  ? 'animate-in slide-in-from-right-8 fade-in duration-300' 
                  : ''
              }`}
            >
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>{t("contact.contactInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">{t("contact.email")}</p>
                      <p className="text-sm text-muted-foreground">info@foihk.org</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">{t("contact.address")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("contact.addressText")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>{t("contact.officeHours")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{t("contact.mondayFriday")}</span>
                      <span className="text-muted-foreground">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">{t("contact.saturdaySunday")}</span>
                      <span className="text-muted-foreground">{t("contact.closed")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
