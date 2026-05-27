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

  const grantPayloadFields = {
    authorization_code: {
      clientId: "client_id",
      client_id: "client_id",
      clientSecret: "client_secret",
      client_secret: "client_secret",
      code: "code",
      redirectUri: "redirect_uri",
      redirect_uri: "redirect_uri",
      codeVerifier: "code_verifier",
      code_verifier: "code_verifier",
    },
    client_credentials: {
      clientId: "client_id",
      client_id: "client_id",
      clientSecret: "client_secret",
      client_secret: "client_secret",
      scope: "scope",
    },
    refresh_token: {
      clientId: "client_id",
      client_id: "client_id",
      clientSecret: "client_secret",
      client_secret: "client_secret",
      refreshToken: "refresh_token",
      refresh_token: "refresh_token",
      scope: "scope",
    },
    password: {
      clientId: "client_id",
      client_id: "client_id",
      clientSecret: "client_secret",
      client_secret: "client_secret",
      username: "username",
      password: "password",
      scope: "scope",
    },
  } satisfies Record<keyof SimpleOauthGrantTypes, Record<string, string>>;

  /**
   * Request a access token via given grant.
   *
   * @param grantType - The grant type to use.
   * @param grant - Grant options object.
   * @param requestOptions - Optional request options.
   */
  const requestToken = async <
    TGrantType extends keyof SimpleOauthGrantTypes,
    TGrant extends SimpleOauthGrantTypes[TGrantType],
  >(
    grantType: TGrantType,
    grant: TGrant,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SimpleOauthTokenResponse, DrupalkitSimpleOauthError>> => {
    const url = drupalkit.buildUrl(oauthTokenEndpoint);

    const body = buildTokenRequestBody(grantType, grant);
    if (body instanceof DrupalkitSimpleOauthError) {
      return Result.Err(body);
    }

    const result = await drupalkit.request<SimpleOauthTokenResponse>(
      url,
      {
        method: "POST",
        body,
        unauthenticated: requestOptions?.unauthenticated !== false,
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

  const buildTokenRequestBody = <
    TGrantType extends keyof SimpleOauthGrantTypes,
    TGrant extends SimpleOauthGrantTypes[TGrantType],
  >(
    grantType: TGrantType,
    grant: TGrant,
  ): URLSearchParams | DrupalkitSimpleOauthError => {
    const fields = grantPayloadFields[grantType];
    const invalidKeys = Object.keys(grant).filter((key) => !(key in fields));

    if (invalidKeys.length) {
      return new DrupalkitSimpleOauthError(
        `Invalid ${String(grantType)} grant property "${invalidKeys[0]}".`,
        400,
        "invalid_request",
        {
          request: {
            url: drupalkit.buildUrl(oauthTokenEndpoint),
            baseUrl: drupalkitOptions.baseUrl,
            method: "POST",
            headers: {},
          },
        },
        `Allowed properties: ${Object.keys(fields).join(", ")}`,
      );
    }

    const body = new URLSearchParams();
    const appendedFields = new Set<string>();
    body.append("grant_type", String(grantType));

    for (const [property, field] of Object.entries(fields)) {
      if (appendedFields.has(field)) {
        continue;
      }

      const value = grant[property as keyof typeof grant];
      if (value === undefined || value === null) {
        continue;
      }

      body.append(field, String(value));
      appendedFields.add(field);
    }

    return body;
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
