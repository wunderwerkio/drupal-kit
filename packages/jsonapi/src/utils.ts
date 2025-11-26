import { RequestOptions } from "@drupal-kit/types";

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
