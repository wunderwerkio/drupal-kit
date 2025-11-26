import test from "ava";
import { DrupalkitError, UNKNOWN_ERROR_PREFIX } from "@drupal-kit/core";

import { DrupalkitJsonApiError } from "../src/index.js";
import JsonApiErrorResponse from "./fixtures/jsonapi_multiple_errors.json" with { type: "json" };

const request = {
  method: "GET",
  headers: {
    "Content-Type": "application/vnd.api+json",
  },
  url: "https://example.com",
  baseUrl: "https://example.com",
};

test("Instanciate from DrupalkitError", (t) => {
  const error = new DrupalkitError("test-error", 400, {
    request,
  });

  const jaError = DrupalkitJsonApiError.fromDrupalkitError(error);

  t.assert(jaError instanceof DrupalkitJsonApiError);
  t.assert(jaError instanceof DrupalkitError);
});

test("Extract errors from JSON:API response", (t) => {
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

  t.assert(jaError.hasValidationErrors());
  t.deepEqual(jaError.getInvalidFields(), [
    "field_firstname",
    "field_lastname",
  ]);

  t.is(jaError.getErrorsByStatus(400).length, 1);
  t.is(jaError.getErrorsByStatus(422).length, 2);

  t.snapshot(jaError.getErrorsByStatus(400), "bad-request-errors");
  t.snapshot(jaError.getErrorsByStatus(422), "unprocessable-entity-errors");
});

test("Unknown error message is replaced with JSON:API error detail", (t) => {
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

  t.is(jaError.message, "The specific error detail from JSON:API");
});

test("Unknown error message falls back to JSON:API error title when detail is missing", (t) => {
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

  t.is(jaError.message, "Bad Request Title");
});

test("Unknown error message is kept when no JSON:API errors are present", (t) => {
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

  t.is(jaError.message, unknownMessage);
});

test("Non-unknown error message is preserved even with JSON:API errors", (t) => {
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

  t.is(jaError.message, customMessage);
});
