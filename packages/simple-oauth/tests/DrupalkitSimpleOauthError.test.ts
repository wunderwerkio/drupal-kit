import test from "ava";
import { DrupalkitError } from "@drupal-kit/core";
import { DrupalkitResponse } from "@drupal-kit/types";

import {
  DrupalkitSimpleOauthError,
  SimpleOauthError,
  SimpleOauthErrorResponse,
} from "../src/index.js";

const request = {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  baseUrl: "https://example.com",
  url: "/endpoint",
};

const createResponse = ({
  status = 400,
  error = "invalid_request" as SimpleOauthError,
  description = undefined as string | undefined,
  hint = undefined as string | undefined,
}): DrupalkitResponse<SimpleOauthErrorResponse> => {
  return {
    url: "/oauth/token",
    status,
    headers: {
      "content-type": "application/json",
    },
    data: {
      error,
      error_description: description,
      hint,
    },
  };
};

test("Instanciate from DrupalkitError", (t) => {
  const error = new DrupalkitError("test-error", 400, {
    request,
    response: createResponse({}),
  });

  const soError = DrupalkitSimpleOauthError.fromDrupalkitError(error);

  t.assert(soError instanceof DrupalkitSimpleOauthError);
  t.assert(soError instanceof DrupalkitError);
});

test("OauthError should be null if error does not contain simple oauth error data", (t) => {
  // Without response.
  let error = new DrupalkitError("test-error", 400, {
    request,
  });

  let soError = DrupalkitSimpleOauthError.fromDrupalkitError(error);

  t.assert(soError instanceof DrupalkitSimpleOauthError);
  t.is(soError.error, null);

  // Without payload.
  error = new DrupalkitError("test-error", 400, {
    request,
    response: {
      ...createResponse({}),
      data: undefined,
    },
  });

  soError = DrupalkitSimpleOauthError.fromDrupalkitError(error);

  t.assert(soError instanceof DrupalkitSimpleOauthError);
  t.is(soError.error, null);

  // With invalid payload.
  error = new DrupalkitError("test-error", 400, {
    request,
    response: {
      ...createResponse({}),
      data: {
        status: "error",
      },
    },
  });

  soError = DrupalkitSimpleOauthError.fromDrupalkitError(error);

  t.assert(soError instanceof DrupalkitSimpleOauthError);
  t.is(soError.error, null);
});

test("Set error type, hint and message from response", (t) => {
  const type: SimpleOauthError = "access_denied";
  const hint = "Insufficent permissions";
  const message =
    "You do not have sufficient permissions to perform this action.";

  const error = new DrupalkitError("test-error", 400, {
    request,
    response: createResponse({
      status: 403,
      hint,
      error: type,
      description: message,
    }),
  });

  const soError = DrupalkitSimpleOauthError.fromDrupalkitError(
    error,
  ) as DrupalkitSimpleOauthError;

  t.is(soError.error, type);
  t.is(soError.hint, hint);
  t.is(soError.message, message);
});

test("Get type of invalid_request error", (t) => {
  const type: SimpleOauthError = "invalid_request";
  const hint = "Check the `client_secret` parameter";

  const error = new DrupalkitError("test-error", 400, {
    request,
    response: createResponse({
      hint,
      error: type,
    }),
  });

  const soError = DrupalkitSimpleOauthError.fromDrupalkitError(
    error,
  ) as DrupalkitSimpleOauthError;

  t.is(soError.getInvalidRequestType(), "invalid_parameter_client_secret");
});

test("Get invalid_request type as generic if no hint is set", (t) => {
  const type: SimpleOauthError = "invalid_request";
  const hint = "";

  const error = new DrupalkitError("test-error", 400, {
    request,
    response: createResponse({
      hint,
      error: type,
    }),
  });

  const soError = DrupalkitSimpleOauthError.fromDrupalkitError(
    error,
  ) as DrupalkitSimpleOauthError;

  t.is(soError.getInvalidRequestType(), "generic");
});

test("Get invalid_request type by hint", (t) => {
  const type: SimpleOauthError = "invalid_request";
  const hint = "Authorization code has been revoked";

  const error = new DrupalkitError("test-error", 400, {
    request,
    response: createResponse({
      hint,
      error: type,
    }),
  });

  const soError = DrupalkitSimpleOauthError.fromDrupalkitError(
    error,
  ) as DrupalkitSimpleOauthError;

  t.is(soError.getInvalidRequestType(), "auth_code_revoked");
});

test("Get invalid_request type by hint regexp", (t) => {
  const type: SimpleOauthError = "invalid_request";
  const hint = "Code challenge method must be one of one, two, three.";

  const error = new DrupalkitError("test-error", 400, {
    request,
    response: createResponse({
      hint,
      error: type,
    }),
  });

  const soError = DrupalkitSimpleOauthError.fromDrupalkitError(
    error,
  ) as DrupalkitSimpleOauthError;

  t.is(soError.getInvalidRequestType(), "code_challenge_invalid");
});

test("Get invalid_request type as generic if nothing matches", (t) => {
  const type: SimpleOauthError = "invalid_request";
  const hint = "Some unhandled hint.";

  const error = new DrupalkitError("test-error", 400, {
    request,
    response: createResponse({
      hint,
      error: type,
    }),
  });

  const soError = DrupalkitSimpleOauthError.fromDrupalkitError(
    error,
  ) as DrupalkitSimpleOauthError;

  t.is(soError.getInvalidRequestType(), "generic");
});
