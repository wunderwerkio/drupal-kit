import { RequestOptions } from "@drupal-kit/types";

/**
 * Sanitize filename for safe use in Content-Disposition header.
 *
 * Removes illegal/unsafe chars, control codes, Windows reserved names.
 * Transliterates umlauts and removes other diacritics.
 *
 * @param filename - The filename to sanitize.
 */
export const sanitizeFilename = (filename: string): string => {
  const dotIdx = filename.lastIndexOf(".");
  const ext = dotIdx > 0 ? filename.slice(dotIdx) : "";
  const name = dotIdx > 0 ? filename.slice(0, dotIdx) : filename;

  const clean = (s: string) =>
    s
      // German umlauts → ae/oe/ue/ss
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/Ä/g, "Ae")
      .replace(/Ö/g, "Oe")
      .replace(/Ü/g, "Ue")
      .replace(/ß/g, "ss")
      // Other diacritics → base char
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Illegal chars & control codes
      .replace(/[/?<>\\:*|"]/g, "")
      // biome-ignore lint/suspicious/noControlCharactersInRegex: Needed for file upload.
      .replace(/[\x00-\x1f\x80-\x9f]/g, "")
      .replace(/[. ]+$/, "");

  const sanitizedName = clean(name);
  const sanitizedExt = clean(ext);

  // Handle reserved names (., .., Windows reserved)
  const baseName =
    /^\.+$/.test(sanitizedName) ||
    /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(sanitizedName)
      ? "file"
      : sanitizedName || "file";

  return (baseName + sanitizedExt).slice(0, 255);
};

/**
 * Checks if request is a JSON:API request.
 *
 * @param req - The request options.
 */
export const isJsonApiRequest = (req: RequestOptions) => {
  const contentType = getHeader("content-type", req);

  return contentType === "application/vnd.api+json";
};

/**
 * Get header from request.
 *
 * Gets the header as case insensitive.
 *
 * @param name - The header name.
 * @param req - Either request options or a request object.
 */
export const getHeader = (name: string, req: RequestOptions) => {
  if (!req.headers) {
    return null;
  }

  for (const header of Object.keys(req.headers)) {
    if (header.toLowerCase() === name.toLowerCase()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (req.headers as unknown as any)[header];
    }
  }

  return null;
};

/**
 * Checks if response has JSON:API content-type.
 *
 * @param response - The response object.
 * @param response.headers - The response headers.
 */
export const isJsonApiResponse = (response?: {
  headers?: Record<string, string | number | undefined>;
}) => {
  if (!response?.headers) {
    return false;
  }

  const contentType = Object.keys(response.headers).find(
    (key) => key.toLowerCase() === "content-type",
  );

  return response.headers[contentType ?? ""] === "application/vnd.api+json";
};
