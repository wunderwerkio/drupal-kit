import { Result } from "@wunderwerk/ts-functional/results";
import { Drupalkit, DrupalkitError, DrupalkitOptions } from "@drupal-kit/core";
import { OverrideableRequestOptions } from "@drupal-kit/types";

import { AuthCodeResponse } from "./types.js";

declare module "@drupal-kit/core" {
  interface DrupalkitOptions {
    authCodeEndpoint?: string;
  }
}

/**
 * DrupalkitSimpleOauthAuthCode plugin for Drupalkit.
 *
 * Extends the Drupalkit instance to support requesting
 * auth codes via the `simple_oauth_auth_code` drupal module.
 *
 * @param drupalkit - The Drupalkit instance.
 * @param drupalkitOptions - The options for the Drupalkit instance.
 */
export const DrupalkitSimpleOauthAuthCode = <Operation extends string>(
  drupalkit: Drupalkit,
  drupalkitOptions: DrupalkitOptions,
) => {
  const authCodeEndpoint =
    drupalkitOptions.authCodeEndpoint ?? "/simple-oauth/auth-code";

  /**
   * Request an auth code.
   *
   * Note: This requests MUST be made with valid
   * verification data!
   *
   * @param operation - The operation this auth code is for.
   * @param email - The email address of the user.
   * @param requestOptions - Optional request options.
   */
  const requestAuthCode = async (
    operation: Operation,
    email: string,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<AuthCodeResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(authCodeEndpoint);

    const result = await drupalkit.request<AuthCodeResponse>(
      url,
      {
        method: "POST",
        body: { operation, email },
        unauthenticated: true,
        headers: {
          "content-type": "application/json",
        },
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Extend the Drupalkit instance.
   */
  return {
    simpleOauth: {
      requestAuthCode,
    },
  };
};
