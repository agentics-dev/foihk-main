export type StructuredDataLanguage = "en" | "zh-hk" | "zh-cn";
export type EventAttendanceMode = "offline" | "online" | "mixed";
export type EventStatus = "scheduled" | "cancelled" | "postponed" | "rescheduled";

export interface FaqSchemaItem {
  enabled: boolean;
  question: string;
  answer: string;
}

export interface FaqPageSchema extends Record<string, unknown> {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  "@id": string;
  url: string;
  inLanguage: "en" | "zh-Hant" | "zh-Hans";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: { "@type": "Answer"; text: string };
  }>;
}

export interface EventLocationSchema {
  "@type": "Place" | "VirtualLocation";
  name?: string;
  url?: string;
  address?: { "@type": "PostalAddress"; streetAddress: string };
}

export interface EventSchema extends Record<string, unknown> {
  "@context": "https://schema.org";
  "@type": "Event";
  "@id": string;
  name: string;
  url: string;
  inLanguage: "en" | "zh-Hant" | "zh-Hans";
  description?: string;
  image?: string[];
  startDate: string;
  endDate?: string;
  previousStartDate?: string;
  eventStatus?: string;
  eventAttendanceMode: string;
  location: EventLocationSchema | EventLocationSchema[];
  organizer?: { "@type": "Organization"; name: string; url?: string };
}

export interface EventSchemaInput {
  enabled: boolean;
  category: string;
  language: StructuredDataLanguage;
  url: string;
  name: string;
  description: string | null;
  image: string | null;
  attendanceMode: EventAttendanceMode | null;
  startDate: string | null;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  timezone: string | null;
  venueName: string | null;
  address: string | null;
  onlineUrl: string | null;
  organizerName: string | null;
  organizerUrl: string | null;
  status: EventStatus | null;
  previousStartDate: string | null;
  previousStartTime: string | null;
}

const SCHEMA_LANGUAGE: Record<StructuredDataLanguage, FaqPageSchema["inLanguage"]> = {
  en: "en",
  "zh-hk": "zh-Hant",
  "zh-cn": "zh-Hans",
};

const ABSENT_VALUES = new Set(["无", "無"]);

export const meaningfulSchemaValue = (value: string | null | undefined) => {
  const normalized = value?.trim() || "";
  return normalized && !ABSENT_VALUES.has(normalized) ? normalized : "";
};

export const getLocalizedSchemaValue = (
  record: Record<string, unknown>,
  field: string,
  language: StructuredDataLanguage,
) => {
  const localizedField = language === "zh-hk" ? `${field}_zhtw` : language === "zh-cn" ? `${field}_zhcn` : field;
  const value = record[localizedField];
  return meaningfulSchemaValue(typeof value === "string" ? value : null);
};

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const buildFaqPageSchema = ({
  url,
  language,
  enabled,
  items,
}: {
  url: string;
  language: StructuredDataLanguage;
  enabled: boolean;
  items: FaqSchemaItem[];
}): FaqPageSchema | null => {
  if (!enabled) return null;
  const mainEntity = items.flatMap<FaqPageSchema["mainEntity"][number]>((item) => {
    const question = meaningfulSchemaValue(item.question);
    const answer = meaningfulSchemaValue(item.answer);
    return item.enabled && question && answer
      ? [{ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }]
      : [];
  });
  if (mainEntity.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    inLanguage: SCHEMA_LANGUAGE[language],
    mainEntity,
  };
};

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return Math.round((representedAsUtc - date.getTime()) / 60_000);
};

const formatOffset = (minutes: number) => {
  const sign = minutes < 0 ? "-" : "+";
  const absolute = Math.abs(minutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
};

export const formatEventDateTime = (
  date: string | null,
  time: string | null,
  timezone: string | null,
) => {
  const normalizedDate = meaningfulSchemaValue(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return undefined;
  const normalizedTime = meaningfulSchemaValue(time);
  if (!normalizedTime) return normalizedDate;
  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(normalizedTime)) return undefined;
  const [year, month, day] = normalizedDate.split("-").map(Number);
  const [hour, minute, second = 0] = normalizedTime.split(":").map(Number);
  const timeZone = meaningfulSchemaValue(timezone) || "Asia/Hong_Kong";
  try {
    const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    let offset = getTimeZoneOffsetMinutes(new Date(localAsUtc), timeZone);
    const actual = new Date(localAsUtc - offset * 60_000);
    offset = getTimeZoneOffsetMinutes(actual, timeZone);
    return `${normalizedDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}${formatOffset(offset)}`;
  } catch {
    return undefined;
  }
};

const EVENT_STATUS: Record<EventStatus, string> = {
  scheduled: "https://schema.org/EventScheduled",
  cancelled: "https://schema.org/EventCancelled",
  postponed: "https://schema.org/EventPostponed",
  rescheduled: "https://schema.org/EventRescheduled",
};

const EVENT_ATTENDANCE: Record<EventAttendanceMode, string> = {
  offline: "https://schema.org/OfflineEventAttendanceMode",
  online: "https://schema.org/OnlineEventAttendanceMode",
  mixed: "https://schema.org/MixedEventAttendanceMode",
};

export const buildEventSchema = (input: EventSchemaInput): {
  schema: EventSchema | null;
  missingCore: string[];
  warnings: string[];
} => {
  if (!input.enabled || input.category !== "news_events") {
    return { schema: null, missingCore: [], warnings: [] };
  }

  const name = meaningfulSchemaValue(input.name);
  const mode = input.attendanceMode;
  const startDate = formatEventDateTime(input.startDate, input.startTime, input.timezone);
  const venueName = meaningfulSchemaValue(input.venueName);
  const address = meaningfulSchemaValue(input.address);
  const onlineUrl = meaningfulSchemaValue(input.onlineUrl);
  const missingCore: string[] = [];

  if (!name) missingCore.push("name");
  if (!mode) missingCore.push("attendanceMode");
  if (!startDate) missingCore.push("startDate");
  if ((mode === "offline" || mode === "mixed") && !venueName) missingCore.push("venueName");
  if ((mode === "offline" || mode === "mixed") && !address) missingCore.push("address");
  if ((mode === "online" || mode === "mixed") && (!onlineUrl || !isHttpUrl(onlineUrl))) missingCore.push("onlineUrl");

  const warnings = mode === "online"
    ? ["Google Event rich results currently require a physical location; this online Event remains valid Schema.org markup."]
    : [];
  if (missingCore.length > 0 || !mode || !startDate) return { schema: null, missingCore, warnings };

  const physicalLocation: EventLocationSchema = {
    "@type": "Place",
    name: venueName,
    address: { "@type": "PostalAddress", streetAddress: address },
  };
  const virtualLocation: EventLocationSchema = { "@type": "VirtualLocation", url: onlineUrl };
  const location = mode === "offline"
    ? physicalLocation
    : mode === "online"
      ? virtualLocation
      : [physicalLocation, virtualLocation];

  const status = input.status;
  const description = meaningfulSchemaValue(input.description);
  const image = meaningfulSchemaValue(input.image);
  const organizerName = meaningfulSchemaValue(input.organizerName);
  const organizerUrl = meaningfulSchemaValue(input.organizerUrl);
  const endDate = formatEventDateTime(input.endDate, input.endTime, input.timezone);
  const previousStartDate = status === "rescheduled"
    ? formatEventDateTime(input.previousStartDate, input.previousStartTime, input.timezone)
    : undefined;

  const schema: EventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${input.url}#event`,
    name,
    url: input.url,
    inLanguage: SCHEMA_LANGUAGE[input.language],
    startDate,
    eventAttendanceMode: EVENT_ATTENDANCE[mode],
    location,
  };
  if (status) schema.eventStatus = EVENT_STATUS[status];
  if (description) schema.description = description;
  if (image && isHttpUrl(image)) schema.image = [image];
  if (endDate) schema.endDate = endDate;
  if (previousStartDate) schema.previousStartDate = previousStartDate;
  if (organizerName) {
    schema.organizer = {
      "@type": "Organization",
      name: organizerName,
      ...(organizerUrl && isHttpUrl(organizerUrl) ? { url: organizerUrl } : {}),
    };
  }

  return { schema, missingCore, warnings };
};
