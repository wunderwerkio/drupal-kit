import { RequestOptions } from "@drupal-kit/types";
import { getHeader } from "@drupal-kit/utils";

/**
 * Checks if request is a JSON:API request.
 *
 * @param req - The request options.
 */
export const isJsonApiRequest = (req: RequestOptions) => {
  const contentType = getHeader("content-type", req);

  return contentType === "application/vnd.api+json";
};
