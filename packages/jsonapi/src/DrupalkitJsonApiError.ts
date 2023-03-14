import { DrupalkitError, DrupalkitErrorOptions } from "@drupal-kit/error";

type JsonApiError = {
  title: string;
  status: string;
  detail: string;
  source?: {
    pointer?: string;
  };
};

/**
 * Enhanced DrupalkitError with JSON:API specific data.
 */
export class DrupalkitJsonApiError extends DrupalkitError {
  /**
   * Array of JSON:API errors.
   */
  readonly errors: JsonApiError[];

  /**
   * @inheritdoc
   */
  constructor(
    message: string,
    statusCode: number,
    errors: JsonApiError[],
    options: DrupalkitErrorOptions,
  ) {
    super(message, statusCode, options);

    this.errors = errors;
  }

  /**
   * Checks if this error instance contains validation errors.
   */
  public hasValidationErrors() {
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
    return this.errors.filter(
      (error) => error.status.toString() == statusCode.toString(),
    );
  }

  /**
   * Create new error instance from a DrupalkitError.
   *
   * @param error - The DrupalkitError to create an instance from.
   */
  public static fromDrupalkitError(error: DrupalkitError) {
    const errors = error.response
      ? this.extractJsonApiErrorsFromResponse(error.response.data)
      : [];

    return new DrupalkitJsonApiError(error.message, error.statusCode, errors, {
      request: error.request,
      response: error.response,
    });
  }

  /**
   * Extract JSON API errors from response data.
   *
   * @param data - The response data to extract errors from.
   */
  public static extractJsonApiErrorsFromResponse(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    data: any,
  ) {
    if (!data?.errors) {
      return [];
    }

    return data.errors as JsonApiError[];
  }
}
