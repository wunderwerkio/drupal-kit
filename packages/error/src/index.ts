import * as DrupalkitTypes from "@drupalkit/types";

import { RequestErrorOptions as DrupalkitErrorOptions } from "./types";

/**
 * Custom error class to help with error handling.
 */
export class DrupalkitError extends Error {
  /**
   * Error name.
   */
  name: "HttpError";

  /**
   * HTTP status code.
   */
  status: number;

  /**
   * Request options that lead to the error.
   */
  request: DrupalkitTypes.RequestOptions;

  /**
   * Response object if a response was received.
   */
  response?: DrupalkitTypes.DrupalkitResponse<unknown>;

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
    this.status = statusCode;

    if (options.response) {
      this.response = options.response;
    }

    // redact request credentials without mutating original request options
    const requestCopy = Object.assign({}, options.request);
    if (options.request.headers.authorization) {
      requestCopy.headers = Object.assign({}, options.request.headers, {
        authorization: options.request.headers.authorization.replace(
          / .*$/,
          " [REDACTED]",
        ),
      });
    }

    this.request = requestCopy;
  }
}
