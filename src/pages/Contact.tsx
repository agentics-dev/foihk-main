import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { AlertCircle, Building2, CheckCircle, Globe2, Linkedin, Loader2, Mail, MapPin } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { toast } from "sonner";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_CONTACT_POINT,
  ORGANIZATION_EMAIL,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_FOUNDING_DATE,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LINKEDIN_URL,
  ORGANIZATION_SAME_AS,
  ORGANIZATION_URL,
} from "@/lib/schema";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const CONTACT_LIMITS = {
  name: 120,
  email: 254,
  subject: 160,
  messageMin: 10,
  messageMax: 4000,
  cooldownMs: 60_000,
};

const Contact = () => {
  const { t, language } = useLanguage();
  const homeLabel = language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页";
  const meta = language === "en"
    ? { title: "Contact FOIHK", description: "Contact FOIHK about research, education, events, philanthropy, media, partnerships, or participation in Hong Kong's family office community." }
    : language === "zh-hk"
      ? { title: "聯絡香港家族辦公室學會", description: "聯絡 FOIHK 查詢研究、教育、活動、慈善、媒體、合作或參與香港家族辦公室社群。" }
      : { title: "联系香港家族办公室学会", description: "联系 FOIHK 查询研究、教育、活动、慈善、媒体、合作或参与香港家族办公室社群。" };
  const detailsCopy = language === "en"
    ? { companyName: "Company name", companyNameValue: ORGANIZATION_ENGLISH_NAME, website: "Official website", linkedin: "Official LinkedIn" }
    : language === "zh-hk"
      ? { companyName: "公司名稱", companyNameValue: "香港家族辦公室學會", website: "官方網站", linkedin: "官方 LinkedIn" }
      : { companyName: "公司名称", companyNameValue: "香港家族办公室学会", website: "官方网站", linkedin: "官方 LinkedIn" };
  const privacyCopy = language === "en"
    ? { before: "By submitting this form, you acknowledge how FOIHK handles enquiry data in its", link: "Privacy Policy", after: "." }
    : language === "zh-hk"
      ? { before: "提交此表格即表示你已了解 FOIHK 如何按照", link: "私隱政策", after: "處理查詢資料。" }
      : { before: "提交此表格即表示你已了解 FOIHK 如何按照", link: "隐私政策", after: "处理查询资料。" };
  const formCard = useScrollAnimation(0.3);
  const contactCards = useScrollAnimation(0.3);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState(0);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const values = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      website: formData.website.trim(),
    };

    if (values.website) {
      setErrors(newErrors);
      return false;
    }

    if (!values.name) {
      newErrors.name = "Name is required";
    } else if (values.name.length > CONTACT_LIMITS.name) {
      newErrors.name = `Name must be ${CONTACT_LIMITS.name} characters or fewer`;
    }

    if (!values.email) {
      newErrors.email = "Email is required";
    } else if (values.email.length > CONTACT_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!values.subject) {
      newErrors.subject = "Subject is required";
    } else if (values.subject.length > CONTACT_LIMITS.subject) {
      newErrors.subject = `Subject must be ${CONTACT_LIMITS.subject} characters or fewer`;
    }

    if (!values.message) {
      newErrors.message = "Message is required";
    } else if (values.message.length < CONTACT_LIMITS.messageMin) {
      newErrors.message = `Message must be at least ${CONTACT_LIMITS.messageMin} characters`;
    } else if (values.message.length > CONTACT_LIMITS.messageMax) {
      newErrors.message = `Message must be ${CONTACT_LIMITS.messageMax} characters or fewer`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field !== "website" && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      if (!formData.website.trim()) {
        toast.error("Please fix the errors in the form", {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
      return;
    }

    const now = Date.now();
    if (now - lastSubmittedAt < CONTACT_LIMITS.cooldownMs) {
      toast.error("Please wait a moment before sending another message.", {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .functions
        .invoke("submit-contact", {
          body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
            website: formData.website.trim(),
            pageUrl: window.location.href,
          },
        });

      if (error) throw error;

      toast.success("Your message has been sent successfully! We will get back to you shortly.", {
        icon: <CheckCircle className="h-4 w-4" />,
      });
      setLastSubmittedAt(Date.now());
      setFormData({ name: "", email: "", subject: "", message: "", website: "" });
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
            "url": ORGANIZATION_URL,
            "email": ORGANIZATION_EMAIL,
            "foundingDate": ORGANIZATION_FOUNDING_DATE,
            "sameAs": ORGANIZATION_SAME_AS
          },
          "mainEntity": {
            "@type": "Organization",
            "name": ORGANIZATION_ENGLISH_NAME,
            "alternateName": ORGANIZATION_ALTERNATE_NAMES,
            "legalName": ORGANIZATION_LEGAL_NAME,
            "url": ORGANIZATION_URL,
            "email": ORGANIZATION_EMAIL,
            "address": ORGANIZATION_ADDRESS,
            "contactPoint": ORGANIZATION_CONTACT_POINT,
            "sameAs": ORGANIZATION_SAME_AS
          }
        }}
      />
      <Navigation />
      <main>
      
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
                <h2 className="text-2xl font-semibold leading-none">{t("contact.getInTouch")}</h2>
                <CardDescription>
                  {t("contact.getInTouchDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="sr-only" aria-hidden="true">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("contact.name")}</Label>
                    <Input
                      id="name"
                      placeholder={t("contact.namePlaceholder")}
                      maxLength={CONTACT_LIMITS.name}
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
                      maxLength={CONTACT_LIMITS.email}
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
                      maxLength={CONTACT_LIMITS.subject}
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
                      maxLength={CONTACT_LIMITS.messageMax}
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
                  <p data-contact-privacy-notice className="text-xs leading-5 text-muted-foreground">
                    {privacyCopy.before} {privacyCopy.link}
                    {privacyCopy.after}
                  </p>
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
                  <h2 className="text-2xl font-semibold leading-none">{t("contact.contactInfo")}</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">{detailsCopy.companyName}</p>
                      <p className="text-sm text-muted-foreground">{detailsCopy.companyNameValue}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">{t("contact.email")}</p>
                      <a href={`mailto:${ORGANIZATION_EMAIL}`} className="text-sm text-primary underline-offset-4 hover:underline">{ORGANIZATION_EMAIL}</a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">{t("contact.address")}</p>
                      <address className="text-sm not-italic text-muted-foreground">
                        {t("contact.addressText")}
                      </address>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Globe2 className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">{detailsCopy.website}</p>
                      <a href={`${ORGANIZATION_URL}/${language}`} className="text-sm text-primary underline-offset-4 hover:underline">www.foihk.org</a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Linkedin className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="font-medium">{detailsCopy.linkedin}</p>
                      <a href={ORGANIZATION_LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline-offset-4 hover:underline">linkedin.com/company/family-office-institute-hong-kong</a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <h2 className="text-2xl font-semibold leading-none">{t("contact.officeHours")}</h2>
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
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
