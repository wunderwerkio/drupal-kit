import { Result } from "@wunderwerk/ts-functional/results";
import { Drupalkit, DrupalkitError, DrupalkitOptions } from "@drupal-kit/core";
import { OverrideableRequestOptions } from "@drupal-kit/types";

import { DrupalkitSimpleOauthError } from "./DrupalkitSimpleOauthError.js";
import {
  SimpleOauthGrantTypes,
  SimpleOauthTokenResponse,
  SimpleOauthUserInfo,
} from "./types.js";

declare module "@drupal-kit/core" {
  interface DrupalkitOptions {
    oauthTokenEndpoint?: string;
    oauthUserInfoEndpoint?: string;
  }
}

/**
 * DrupalkitSimpleOauth plugin for Drupalkit.
 *
 * Extends the Drupalkit instance to support requesting
 * tokens via the `simple_oauth` drupal module.
 *
 * @param drupalkit - The Drupalkit instance.
 * @param drupalkitOptions - The options for the Drupalkit instance.
 */
export const DrupalkitSimpleOauth = (
  drupalkit: Drupalkit,
  drupalkitOptions: DrupalkitOptions,
) => {
  const oauthTokenEndpoint =
    drupalkitOptions.oauthTokenEndpoint ?? "/oauth/token";
  const oauthUserInfoEndpoint =
    drupalkitOptions.oauthUserInfoEndpoint ?? "/oauth/userinfo";

  /**
   * Request a access token via given grant.
   *
   * @param grantType - The grant type to use.
   * @param grant - Grant options object.
   * @param requestOptions - Optional request options.
   */
  const requestToken = async <
    GrantType extends keyof SimpleOauthGrantTypes,
    Grant extends SimpleOauthGrantTypes[GrantType],
  >(
    grantType: GrantType,
    grant: Grant,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SimpleOauthTokenResponse, DrupalkitSimpleOauthError>> => {
    const url = drupalkit.buildUrl(oauthTokenEndpoint);

    const body = new URLSearchParams();
    body.append("grant_type", grantType);
    for (const [key, value] of Object.entries(grant)) {
      body.append(key, value);
    }

    const result = await drupalkit.request<SimpleOauthTokenResponse>(
      url,
      {
        method: "POST",
        body,
        unauthenticated: true,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      },
      requestOptions,
    );

    if (result.err) {
      return Result.Err(
        DrupalkitSimpleOauthError.fromDrupalkitError(result.val),
      );
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Request user info.
   *
   * This returns the OpenID Connect claims that are configured
   * in the `simple_oauth` module.
   *
   * Do not forget to augment the SimpleOauthUserInfo interface
   * to match the OpenID Connect claims of your drupal installation!
   *
   * @param requestOptions - Optional request options.
   */
  const getUserInfo = async (
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SimpleOauthUserInfo, DrupalkitError>> => {
    const url = drupalkit.buildUrl(oauthUserInfoEndpoint);

    const result = await drupalkit.request<SimpleOauthUserInfo>(
      url,
      {
        method: "GET",
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
   * Create DrupalkitJsonApiError for JSON:API failed requests.
   */
  drupalkit.hook.error("request", (error) => {
    if (error.request.url.includes(oauthTokenEndpoint)) {
      throw DrupalkitSimpleOauthError.fromDrupalkitError(error);
    }

    throw error;
  });

  /**
   * Extend the Drupalkit instance.
   */
  return {
    simpleOauth: {
      requestToken,
      getUserInfo,
    },
  };
};
