import { expect, test } from "vitest";
import { DrupalkitError, UNKNOWN_ERROR_PREFIX } from "@drupal-kit/core";

import { DrupalkitJsonApiError } from "../src/index.js";
import JsonApiErrorResponse from "./fixtures/jsonapi_multiple_errors.js";

const request = {
  method: "GET",
  headers: {
    "Content-Type": "application/vnd.api+json",
  },
  url: "https://example.com",
  baseUrl: "https://example.com",
};

test("Instanciate from DrupalkitError", () => {
  const error = new DrupalkitError("test-error", 400, {
    request,
  });

  const jaError = DrupalkitJsonApiError.fromDrupalkitError(error);

  expect(jaError instanceof DrupalkitJsonApiError).toBeTruthy();
  expect(jaError instanceof DrupalkitError).toBeTruthy();
});

test("Extract errors from JSON:API response", () => {
  const error = new DrupalkitError("test-error", 400, {
    request,
    response: {
      headers: {
        "Content-Type": "application/vnd.api+json",
      },
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

  expect(jaError.getErrorsByStatus(400).length).toBe(1);
  expect(jaError.getErrorsByStatus(422).length).toBe(2);

  expect(jaError.getErrorsByStatus(400)).toMatchSnapshot("bad-request-errors");
  expect(jaError.getErrorsByStatus(422)).toMatchSnapshot(
    "unprocessable-entity-errors",
  );
});

test("Unknown error message is replaced with JSON:API error detail", () => {
  const unknownMessage = `${UNKNOWN_ERROR_PREFIX} {"some":"data"}`;
  const error = new DrupalkitError(unknownMessage, 400, {
    request,
    response: {
      headers: {
        "Content-Type": "application/vnd.api+json",
      },
      status: 400,
      data: {
        errors: [
          {
            title: "Bad Request",
            status: "400",
            detail: "The specific error detail from JSON:API",
          },
        ],
      },
      url: "some-url",
    },
  });

  const jaError = DrupalkitJsonApiError.fromDrupalkitError(error);

  expect(jaError.message).toBe("The specific error detail from JSON:API");
});

test("Unknown error message falls back to JSON:API error title when detail is missing", () => {
  const unknownMessage = `${UNKNOWN_ERROR_PREFIX} {"some":"data"}`;
  const error = new DrupalkitError(unknownMessage, 400, {
    request,
    response: {
      headers: {
        "Content-Type": "application/vnd.api+json",
      },
      status: 400,
      data: {
        errors: [
          {
            title: "Bad Request Title",
            status: "400",
          },
        ],
      },
      url: "some-url",
    },
  });

  const jaError = DrupalkitJsonApiError.fromDrupalkitError(error);

  expect(jaError.message).toBe("Bad Request Title");
});

test("Unknown error message is kept when no JSON:API errors are present", () => {
  const unknownMessage = `${UNKNOWN_ERROR_PREFIX} {"some":"data"}`;
  const error = new DrupalkitError(unknownMessage, 500, {
    request,
    response: {
      headers: {
        "Content-Type": "text/html",
      },
      status: 500,
      data: "<html>Server Error</html>",
      url: "some-url",
    },
  });

  const jaError = DrupalkitJsonApiError.fromDrupalkitError(error);

  expect(jaError.message).toBe(unknownMessage);
});

test("Non-unknown error message is preserved even with JSON:API errors", () => {
  const customMessage = "Custom error message";
  const error = new DrupalkitError(customMessage, 400, {
    request,
    response: {
      headers: {
        "Content-Type": "application/vnd.api+json",
      },
      status: 400,
      data: {
        errors: [
          {
            title: "Bad Request",
            status: "400",
            detail: "This should not replace the custom message",
          },
        ],
      },
      url: "some-url",
    },
  });

  const jaError = DrupalkitJsonApiError.fromDrupalkitError(error);

  expect(jaError.message).toBe(customMessage);
});
