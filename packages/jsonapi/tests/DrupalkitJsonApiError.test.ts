import { DrupalkitError } from "@drupal-kit/error";

import { DrupalkitJsonApiError } from "../src";
import JsonApiErrorResponse from "./fixtures/jsonapi_multiple_errors.json";

describe("DrupalkitJsonApiError", () => {
  const request = {
    method: "GET",
    headers: {
      "Content-Type": "application/vnd.api+json",
    },
    url: "https://example.com",
    baseUrl: "https://example.com",
  };

  it("should instanciate from DrupalkitError", () => {
    const error = new DrupalkitError("test-error", 400, {
      request,
    });

    const jaError = DrupalkitJsonApiError.fromDrupalkitError(error);

    expect(jaError).toBeInstanceOf(DrupalkitJsonApiError);
    expect(jaError).toBeInstanceOf(DrupalkitError);
  });

  it("should extract errors from JSON:API response", () => {
    const error = new DrupalkitError("test-error", 400, {
      request,
      response: {
        headers: {},
        status: 422,
        data: JsonApiErrorResponse,
        url: "some-url",
      },
    });

    const jaError = DrupalkitJsonApiError.fromDrupalkitError(error);

    expect(jaError.hasValidationErrors()).toBeTruthy();
    expect(jaError.getInvalidFields()).toEqual([
      "field_firstname",
      "field_lastname",
    ]);
    expect(jaError.getErrorsByStatus(400)).toHaveLength(1);
    expect(jaError.getErrorsByStatus(422)).toHaveLength(2);

    expect(jaError.getErrorsByStatus(400)).toMatchSnapshot(
      "bad-request-errors",
    );
    expect(jaError.getErrorsByStatus(422)).toMatchSnapshot(
      "unprocessable-entity-errors",
    );
  });
});
