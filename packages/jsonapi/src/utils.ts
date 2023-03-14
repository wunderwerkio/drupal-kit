import { RequestOptions } from "@drupalkit/types";
import { getHeader } from "@drupalkit/utils";

/**
 * Checks if request is a JSON:API request.
 *
 * @param req - The request options.
 */
export const isJsonApiRequest = (req: RequestOptions) => {
  const contentType = getHeader("content-type", req);

  return contentType === "application/vnd.api+json";
};
