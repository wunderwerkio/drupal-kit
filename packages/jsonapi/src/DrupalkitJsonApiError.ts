import {
  DrupalkitError,
  DrupalkitErrorOptions,
  UNKNOWN_ERROR_PREFIX,
} from "@drupal-kit/core";
import { JsonApiError } from "@drupal-kit/types";

/**
 * Enhanced DrupalkitError with JSON:API specific data.
 */
export class DrupalkitJsonApiError<
  T extends JsonApiError = JsonApiError,
> extends DrupalkitError<T> {
  /**
   * Construct a new DrupalkitJsonApiError.
   *
   * @param message - Error message.
   * @param statusCode - HTTP status code.
   * @param options - Error options (request/response).
   */
  constructor(
    message: string,
    statusCode: number,
    options: DrupalkitErrorOptions,
  ) {
    super(message, statusCode, options);
    // If the message uses the generic unknown error prefix, try to replace it
    // with a more specific detail from the first JSON:API error if available.
    if (message.startsWith(UNKNOWN_ERROR_PREFIX) && this.errors?.length) {
      const first = this.errors[0] as JsonApiError;
      if (first?.detail) {
        this.message = first.detail;
      } else if (first?.title) {
        this.message = first.title;
      }
    }
  }
  /**
   * Checks if this error instance contains validation errors.
   */
  public hasValidationErrors() {
    if (!this.isJsonApiError()) {
      return false;
    }

    return this.errors.some((error) => error.status == "422");
  }

  /**
   * Get an array of all fields with invalid values.
   */
  public getInvalidFields() {
    return this.getErrorsByStatus(422)
      .map((error) => {
        const pointer = error?.source?.pointer;

        if (!pointer) {
          return null;
        }

        return pointer.split("/").pop();
      })
      .filter((field) => field !== null);
  }

  /**
   * Get all errors with the given status code.
   *
   * @param statusCode - The status code to filter by.
   */
  public getErrorsByStatus(statusCode: number) {
    if (!this.isJsonApiError()) {
      return [];
    }

    return this.errors.filter(
      (error) => error.status?.toString() == statusCode.toString(),
    );
  }

  /**
   * Create new error instance from a DrupalkitError.
   *
   * @param error - The DrupalkitError to create an instance from.
   */
  public static fromDrupalkitError(error: DrupalkitError) {
    return new DrupalkitJsonApiError(error.message, error.statusCode, {
      request: error.request,
      response: error.response,
    });
  }
}
