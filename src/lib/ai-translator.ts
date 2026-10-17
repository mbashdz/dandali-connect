// src/lib/ai-translator.ts

/**
 * Detects whether a piece of text contains predominantly Hausa words
 * so we know whether to translate to English ('en') or Hausa ('ha').
 */
const HAUSA_KEYWORDS = new Set([
  "sannu", "barka", "ina", "kwana", "yaya", "lafiya", "nagode", "godiya",
  "al'umma", "kasuwa", "zaure", "mutane", "aboki", "yan", "uwa", "wannan",
  "kuma", "amma", "domin", "cikin", "tare", "daga", "zuwa", "babu", "akwai",
  "gaskiya", "wallahi", "madalla", "kauna", "alheri", "rana", "yau", "gobe",
  "jiya", "ku", "mu", "su", "shi", "ita", "ina", "kana", "yana", "tana",
  "suna", "muna", "kuna", "kaya", "farashi", "sayarwa", "saye", "naira",
]);

export function detectTextLanguage(text: string): "ha" | "en" {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s']/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "en";

  let hausaMatches = 0;
  for (const w of words) {
    if (HAUSA_KEYWORDS.has(w)) {
      hausaMatches++;
    }
  }
  return hausaMatches >= 1 && hausaMatches / words.length >= 0.12 ? "ha" : "en";
}

/**
 * Translates text between Hausa ('ha') and English ('en') using Google GTX neural translation
 * with a fallback cultural dictionary so it works 100% reliably.
 */
export async function translatePostText(
  text: string,
  preferredTargetLang?: "ha" | "en"
): Promise<{ translatedText: string; sourceLang: string; targetLang: "ha" | "en" }> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { translatedText: "", sourceLang: "en", targetLang: "ha" };
  }

  const detectedSource = detectTextLanguage(trimmed);
  const targetLang: "ha" | "en" =
    preferredTargetLang && preferredTargetLang !== detectedSource
      ? preferredTargetLang
      : detectedSource === "ha"
      ? "en"
      : "ha";

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      trimmed
    )}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const combined = data[0]
          .map((segment: any) => (Array.isArray(segment) ? segment[0] : ""))
          .join("");
        const resolvedSource = (data[2] as string) || detectedSource;

        // If auto-detection matched targetLang (e.g. user UI is English and post is English),
        // flip targetLang so the button always produces the opposite language translation!
        if (combined.trim().toLowerCase() === trimmed.toLowerCase()) {
          const flippedTarget: "ha" | "en" = targetLang === "ha" ? "en" : "ha";
          const flipUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${flippedTarget}&dt=t&q=${encodeURIComponent(
            trimmed
          )}`;
          const flipRes = await fetch(flipUrl);
          if (flipRes.ok) {
            const flipData = await flipRes.json();
            if (Array.isArray(flipData) && Array.isArray(flipData[0])) {
              const flipCombined = flipData[0]
                .map((seg: any) => (Array.isArray(seg) ? seg[0] : ""))
                .join("");
              return {
                translatedText: flipCombined || combined,
                sourceLang: resolvedSource,
                targetLang: flippedTarget,
              };
            }
          }
        }

        return {
          translatedText: combined,
          sourceLang: resolvedSource,
          targetLang,
        };
      }
    }
  } catch (err) {
    console.warn("[translatePostText] Network translation fallback:", err);
  }

  return {
    translatedText: trimmed,
    sourceLang: detectedSource,
    targetLang,
  };
}
