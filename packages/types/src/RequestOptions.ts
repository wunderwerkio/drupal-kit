import { Log } from "./Log";
import { RequestHeaders } from "./RequestHeaders";

/**
 * Drupalkit-specific request options.
 */
export type RequestOptions = {
  /**
   * Request method.
   */
  method: string;

  /**
   * Additional request headers.
   */
  headers?: RequestHeaders;

  /**
   * Request body.
   */
  body?: string | Array<unknown> | object;

  /**
   * Override the locale for the request.
   */
  locale?: string;

  /**
   * If true, the request will be unauthenticated.
   */
  unauthenticated?: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [option: string]: any;
};

/**
 * Request options for the actual fetch call.
 */
export type RequestRequestOptions = RequestOptions & {
  url: string;
  baseUrl: string;
  log?: Log;
};
