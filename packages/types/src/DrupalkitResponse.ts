import { ResponseHeaders } from "./ResponseHeaders";
import { Url } from "./Url";

export type DrupalkitResponse<T, S extends number = number> = {
  headers: ResponseHeaders;
  /**
   * http response code
   */
  status: S;
  /**
   * URL of response after all redirects
   */
  url: Url;
  /**
   * Response data from the api.
   */
  data: T;
};
