import { Log } from "./Log";
import { RequestHeaders } from "./RequestHeaders";

/**
 * Drupalkit-specific request options.
 */
export type RequestOptions = OverrideableRequestOptions & {
  /**
   * Request method.
   */
  method: string;

  /**
   * Request body.
   */
  body?: string | Array<unknown> | object;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [option: string]: any;
};

export type OverrideableRequestOptions = Omit<
  RequestInit,
  "headers" | "method" | "body"
> & {
  /**
   * Override the locale for the request.
   */
  locale?: string;

  /**
   * Additional request headers.
   */
  headers?: RequestHeaders;

  /**
   * If true, the request will be unauthenticated.
   */
  unauthenticated?: boolean;
};

/**
 * Request options for the actual fetch call.
 */
export type RequestRequestOptions = RequestOptions & {
  url: string;
  baseUrl: string;
  headers: RequestHeaders;
  log?: Log;
};
