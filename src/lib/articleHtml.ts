import DOMPurify from "dompurify";

const ALLOWED_FORMAT_CLASSES = new Set([
  "foihk-align-center",
  "foihk-align-left",
  "foihk-align-right",
  "foihk-font-mono",
  "foihk-font-sans",
  "foihk-font-serif",
  "foihk-font-song",
  "foihk-leading-loose",
  "foihk-leading-normal",
  "foihk-leading-tight",
  "foihk-paragraph-note",
  "foihk-size-12",
  "foihk-size-14",
  "foihk-size-16",
  "foihk-size-18",
  "foihk-size-20",
  "foihk-size-24",
  "foihk-size-28",
  "foihk-size-32",
  "foihk-text-lg",
  "foihk-text-sm",
  "foihk-text-xl",
]);

export const sanitizeArticleHtml = (content: string, imageAlt = "Article image") => {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "span",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "blockquote",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel", "loading", "decoding", "referrerpolicy"],
    ALLOW_DATA_ATTR: false,
  });
  const documentFragment = new DOMParser().parseFromString(sanitized, "text/html");
  const isAllowedUrl = (value: string, protocols: string[]) => {
    if (!value.trim()) return false;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      return protocols.includes(new URL(value).protocol);
    } catch {
      return false;
    }
  };
  let previousHeadingLevel = 1;

  documentFragment.querySelectorAll("[class]").forEach((element) => {
    const safeClasses = Array.from(element.classList).filter((className) => ALLOWED_FORMAT_CLASSES.has(className));
    if (safeClasses.length > 0) {
      element.setAttribute("class", safeClasses.join(" "));
    } else {
      element.removeAttribute("class");
    }
  });

  documentFragment.querySelectorAll("h2, h3, h4, h5, h6").forEach((heading) => {
    const currentLevel = Number(heading.tagName.slice(1));
    const allowedLevel = Math.min(currentLevel, previousHeadingLevel + 1);
    if (allowedLevel !== currentLevel) {
      const replacement = documentFragment.createElement(`h${allowedLevel}`);
      replacement.innerHTML = heading.innerHTML;
      for (const attribute of heading.attributes) replacement.setAttribute(attribute.name, attribute.value);
      heading.replaceWith(replacement);
    }
    previousHeadingLevel = allowedLevel;
  });

  documentFragment.querySelectorAll("img").forEach((image) => {
    const src = image.getAttribute("src") || "";
    if (!isAllowedUrl(src, ["http:", "https:"])) {
      image.remove();
      return;
    }
    if (!image.getAttribute("alt")?.trim()) image.setAttribute("alt", imageAlt);
    image.setAttribute("loading", "lazy");
    image.setAttribute("decoding", "async");
    image.setAttribute("referrerpolicy", "no-referrer");
  });

  documentFragment.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (!isAllowedUrl(href, ["http:", "https:", "mailto:"])) {
      link.removeAttribute("href");
      return;
    }
    if (/^https?:/i.test(href)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });

  return documentFragment.body.innerHTML;
};
