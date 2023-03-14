import * as DrupalkitTypes from "@drupalkit/types";

import { RequestErrorOptions } from "./types";

export type DrupalkitErrorOptions = RequestErrorOptions;

/**
 * Custom error class to help with error handling.
 */
export class DrupalkitError extends Error {
  /**
   * Error name.
   */
  readonly name: "HttpError";

  /**
   * HTTP status code.
   */
  readonly statusCode: number;

  /**
   * Request options that lead to the error.
   */
  readonly request: DrupalkitTypes.RequestOptions;

  /**
   * Response object if a response was received.
   */
  readonly response?: DrupalkitTypes.DrupalkitResponse<unknown>;

  /**
   * Construct a new DrupalkitError.
   *
   * @param message - Error message.
   * @param statusCode - HTTP status code.
   * @param options - Request / Response that lead to the error.
   */
  constructor(
    message: string,
    statusCode: number,
    options: DrupalkitErrorOptions,
  ) {
    super(message);

    // Maintains proper stack trace (only available on V8)
    // @ts-ignore
    if (Error.captureStackTrace) {
      // @ts-ignore
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = "HttpError";
    this.statusCode = statusCode;

    if (options.response) {
      this.response = options.response;
    }

    // redact request credentials without mutating original request options
    const requestCopy = Object.assign({}, options.request);
    if (options.request.headers?.authorization) {
      requestCopy.headers = Object.assign({}, options.request.headers, {
        authorization: options.request.headers.authorization.replace(
          /(?!\w).*$/,
          " [REDACTED]",
        ),
      });
    }

    this.request = requestCopy;
  }
}
