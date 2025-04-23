import { DrupalkitError } from "@drupal-kit/core";
import { JsonApiError } from "@drupal-kit/types";

/**
 * Enhanced DrupalkitError with JSON:API specific data.
 */
export class DrupalkitJsonApiError<
  T extends JsonApiError = JsonApiError,
> extends DrupalkitError<T> {
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
