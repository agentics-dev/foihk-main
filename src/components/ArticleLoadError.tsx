import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export const ArticleLoadError = ({ onRetry }: { onRetry: () => void }) => {
  const { language } = useLanguage();
  const text = language === "en" ? ["Articles are temporarily unavailable. Please try again.", "Retry"]
    : language === "zh-hk" ? ["暫時無法讀取文章，請稍後重試。", "重試"] : ["暂时无法读取文章，请稍后重试。", "重试"];
  return <div role="alert" className="py-8 text-center"><p className="mb-4">{text[0]}</p><Button onClick={onRetry}>{text[1]}</Button></div>;
};
