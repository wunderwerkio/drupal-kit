import test from "ava";
import { DrupalkitError } from "@drupal-kit/core";

import { DrupalkitJsonApiError } from "../src/index.js";
import JsonApiErrorResponse from "./fixtures/jsonapi_multiple_errors.json" assert { type: "json" };

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
      headers: {},
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
