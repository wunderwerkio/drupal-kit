import { Fetch } from "./Fetch";
import { Log } from "./Log";
import { RequestHeaders } from "./RequestHeaders";

/**
 * Drupalkit-specific request options.
 */
export type RequestOptions = {
  method: string;
  headers: RequestHeaders;
  body?: string | Array<any> | object;

  locale?: string;
  defaultLocale?: string;

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
