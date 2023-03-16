import { Ok } from "ts-results";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { AuthCodeResponse } from "./types";

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
   */
  const requestAuthCode = async (operation: Operation, email: string) => {
    const url = drupalkit.buildUrl(authCodeEndpoint);

    const result = await drupalkit.request<AuthCodeResponse>(url, {
      method: "POST",
      body: { operation, email },
      headers: {
        "content-type": "application/json",
      },
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
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
