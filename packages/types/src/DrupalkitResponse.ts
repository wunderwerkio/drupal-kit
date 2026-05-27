import { ResponseHeaders } from "./ResponseHeaders";
import { Url } from "./Url";

/**
 * Describes a response from any Drupal API endpoint.
 */
export type DrupalkitResponse<T, S extends number = number> = {
  headers: ResponseHeaders;
  /**
   * HTTP response code.
   */
  status: S;
  /**
   * URL of response after all redirects.
   */
  url: Url;
  /**
   * Response data from the api.
   */
  data: T;
};
