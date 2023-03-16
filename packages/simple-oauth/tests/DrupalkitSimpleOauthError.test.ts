import { DrupalkitError } from "@drupal-kit/core";
import { DrupalkitResponse } from "@drupal-kit/types";

import {
  DrupalkitSimpleOauthError,
  SimpleOauthError,
  SimpleOauthErrorResponse,
} from "../src";

describe("DrupalkitSimpleOauthError", () => {
  const request = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    baseUrl: "https://example.com",
    url: "/endpoint",
  };

  it("should instanciate from DrupalkitError", () => {
    const error = new DrupalkitError("test-error", 400, {
      request,
      response: createResponse({}),
    });

    const soError = DrupalkitSimpleOauthError.fromDrupalkitError(error);

    expect(soError).toBeInstanceOf(DrupalkitSimpleOauthError);
    expect(soError).toBeInstanceOf(DrupalkitError);
  });

  it("should return DrupalkitError if error does not contain simple oauth error data", () => {
    // Without response.
    let error = new DrupalkitError("test-error", 400, {
      request,
    });

    let soError = DrupalkitSimpleOauthError.fromDrupalkitError(error);

    expect(soError).not.toBeInstanceOf(DrupalkitSimpleOauthError);
    expect(soError).toBeInstanceOf(DrupalkitError);

    // Without payload.
    error = new DrupalkitError("test-error", 400, {
      request,
      response: {
        ...createResponse({}),
        data: undefined,
      },
    });

    soError = DrupalkitSimpleOauthError.fromDrupalkitError(error);

    expect(soError).not.toBeInstanceOf(DrupalkitSimpleOauthError);
    expect(soError).toBeInstanceOf(DrupalkitError);

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

    expect(soError).not.toBeInstanceOf(DrupalkitSimpleOauthError);
    expect(soError).toBeInstanceOf(DrupalkitError);
  });

  it("should set error type, hint and message from response", () => {
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

    expect(soError.error).toBe(type);
    expect(soError.hint).toBe(hint);
    expect(soError.message).toBe(message);
  });

  it("should get type of invalid_request error", () => {
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

    expect(soError.getInvalidRequestType()).toBe(
      "invalid_parameter_client_secret",
    );
  });

  it("should get invalid_request type as generic if no hint is set", () => {
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

    expect(soError.getInvalidRequestType()).toBe("generic");
  });

  it("should get invalid_request type by hint", () => {
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

    expect(soError.getInvalidRequestType()).toBe("auth_code_revoked");
  });

  it("should get invalid_request type by hint regexp", () => {
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

    expect(soError.getInvalidRequestType()).toBe("code_challenge_invalid");
  });

  it("should get invalid_request type as generic if nothing matches", () => {
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

    expect(soError.getInvalidRequestType()).toBe("generic");
  });

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
});
