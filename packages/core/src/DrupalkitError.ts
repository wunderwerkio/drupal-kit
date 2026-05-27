import * as DrupalkitTypes from "@drupal-kit/types";
import { JsonApiError } from "@drupal-kit/types";

import { RequestErrorOptions } from "./types.js";

export const UNKNOWN_ERROR_PREFIX = "Unknown error:";

export type DrupalkitErrorOptions = RequestErrorOptions;

type GenericJsonApiError = {
  code: "drupalkit_error";
  detail: string;
  status: string;
};

/**
 * Custom error class to help with error handling.
 */
export class DrupalkitError<T = unknown> extends Error {
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
  readonly request: DrupalkitTypes.RequestRequestOptions;

  /**
   * Response object if a response was received.
   */
  readonly response?: DrupalkitTypes.DrupalkitResponse<unknown>;

  /**
   * Array of JSON:API errors if the response contains them.
   */
  readonly errors: T[] | undefined;

  /**
   * The first JSON:API error if the response contains multiple errors.
   */
  readonly firstError: T | undefined;

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
    // @ts-expect-error - Error.captureStackTrace is not available in all browsers.
    if (Error.captureStackTrace) {
      // @ts-expect-error - Error.captureStackTrace is not available in all browsers.
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = "HttpError";
    this.statusCode = statusCode;

    if (options.response) {
      this.response = options.response;

      // Parse JSON:API errors if the response has the correct content type
      if (this.isJsonApiResponse()) {
        const responseData = options.response.data as { errors?: T[] };
        if (responseData.errors) {
          this.errors = responseData.errors;
          this.firstError = responseData.errors[0];
        }
      }
      // @todo - Add better support for non-JSON:API responses.
      else {
        this.errors = [options.response.data as T];
        this.firstError = options.response.data as T;
      }
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

  /**
   * Checks if the response contains JSON:API errors.
   */
  public isJsonApiError<
    TM = T extends JsonApiError ? IntersectPick<T, keyof JsonApiError> : never,
  >(): this is DrupalkitError<TM> & {
    firstError: TM;
    errors: TM[];
  } {
    return (
      this.isJsonApiResponse() &&
      Array.isArray(this.errors) &&
      this.errors.length > 0
    );
  }

  /**
   * Gets a specific error by its error code.
   *
   * @param code - The error code to search for.
   * @returns The first error matching the provided code, or undefined if not found.
   */
  public getErrorByCode<
    C extends T extends { code: string } ? T["code"] : never,
  >(code: C): Extract<T, { code: C }> | undefined {
    return this.errors?.find((error) => {
      if (error && typeof error === "object" && "code" in error) {
        return error.code === code;
      }

      return false;
    }) as Extract<T, { code: C }>;
  }

  /**
   * Converts the error to a JSON:API compliant error object.
   *
   * If this is already a JSON:API error (has errors array), returns the first error.
   * Otherwise returns a generic error object with the message and status code.
   *
   * @returns A JSON:API compliant error object.
   */
  public toJsonApiError(): T extends JsonApiError
    ? IntersectPick<T, keyof JsonApiError> | GenericJsonApiError
    : GenericJsonApiError {
    if (this.isJsonApiError()) {
      return this.firstError as T extends JsonApiError
        ? T & GenericJsonApiError
        : GenericJsonApiError;
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
      code: "drupalkit_error",
      detail: this.message,
      status: this.statusCode.toString(),
    } as T extends JsonApiError ? T & GenericJsonApiError : GenericJsonApiError;
  }

  /**
   * Checks if the response has the JSON:API content type.
   */
  private isJsonApiResponse(): boolean {
    const contentType = Object.keys(this.response?.headers ?? {}).find(
      (key) => key.toLowerCase() === "content-type",
    );

    return (
      this.response?.headers?.[contentType ?? ""] === "application/vnd.api+json"
    );
  }
}

type IntersectPick<T, K extends keyof T> = {
  [P in K & keyof T]: T[P];
};
