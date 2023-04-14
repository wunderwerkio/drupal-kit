import { DrupalkitError, DrupalkitErrorOptions } from "@drupal-kit/core";

import { SimpleOauthError, SimpleOauthInvalidRequest } from "./types.js";

const InvalidRequestHintMap = {
  auth_code_revoked: "Authorization code has been revoked",
  auth_code_malformed: "Authorization code malformed",
  auth_code_expired: "Authorization code has expired",
  auth_code_wrong_client: "Authorization code was not issued to this client",
  auth_code_decrypt_error: "Cannot decrypt the authorization code",
  code_verifier_rfc_error:
    "Code Verifier must follow the specifications of RFC-7636.",
  redirect_uri_invalid: "Invalid redirect URI",
  code_challenge_invalid: /^Code challenge method must be one of .*$/,
  code_challenge_rfc_error:
    "Code challenge must follow the specifications of RFC-7636.",
  code_challenge_missing_public_client:
    "Code challenge must be provided for public clients",
};

/**
 * Enhanced DrupalkitError with SimpleOauth specific data.
 */
export class DrupalkitSimpleOauthError extends DrupalkitError {
  readonly error: SimpleOauthError;
  readonly hint?: string;

  /**
   * @inheritdoc
   */
  constructor(
    message: string,
    statusCode: number,
    error: SimpleOauthError,
    options: DrupalkitErrorOptions,
    hint?: string,
  ) {
    super(message, statusCode, options);

    this.error = error;
    this.hint = hint;
  }

  /**
   * Gets the specific type of invalid_request error.
   */
  public getInvalidRequestType(): SimpleOauthInvalidRequest {
    if (this.error !== "invalid_request" || !this.hint) {
      return "generic";
    }

    // Check invalid parameter hints.
    if (this.hint.includes("Check the")) {
      const regexp = /`(\w+)`/g;
      const result = regexp.exec(this.hint);
      if (result && result.length > 1) {
        return ("invalid_parameter_" + result[1]) as SimpleOauthInvalidRequest;
      }
    }

    // Check invalid request hints.
    for (const key of Object.keys(
      InvalidRequestHintMap,
    ) as (keyof typeof InvalidRequestHintMap)[]) {
      const value = InvalidRequestHintMap[key];

      if (typeof value === "string" && this.hint.includes(value)) {
        return key;
      }

      if (value instanceof RegExp) {
        if (this.hint.match(value)) {
          return key;
        }
      }
    }

    return "generic";
  }

  /**
   * Create new error instance from a DrupalkitError.
   *
   * @param error - The DrupalkitError to create an instance from.
   */
  public static fromDrupalkitError(error: DrupalkitError) {
    const errorData = error.response
      ? this.extractErrorFromResponse(error.response.data)
      : null;

    if (!errorData) {
      return error;
    }

    return new this(
      errorData.message ?? error.message,
      error.statusCode,
      errorData.error,
      {
        request: error.request,
        response: error.response,
      },
      errorData.hint,
    );
  }

  /**
   * Extract SimpleOauth error from response data.
   *
   * @param data - The response data to extract the error from.
   */
  public static extractErrorFromResponse(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    data: any,
  ) {
    if (!data?.error) {
      return null;
    }

    return {
      error: data.error as SimpleOauthError,
      message: data.error_description as string | undefined,
      hint: data.hint as string | undefined,
    };
  }
}
