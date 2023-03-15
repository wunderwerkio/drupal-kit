import { Ok } from "ts-results";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { SimpleOauthGrantTypes, SimpleOauthTokenResponse } from "./types";
import { DrupalkitSimpleOauthError } from "./DrupalkitSimpleOauthError";

declare module "@drupal-kit/core" {
  interface DrupalkitOptions {
    oauthTokenEndpoint?: string;
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
  const oauthTokenEndpoint = drupalkitOptions.oauthTokenEndpoint ?? "/oauth/token";

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
      async requestToken<
        GrantType extends keyof SimpleOauthGrantTypes,
        Grant extends SimpleOauthGrantTypes[GrantType],
      >(grantType: GrantType, grant: Grant) {
        const url = drupalkit.buildUrl(oauthTokenEndpoint);

        const body = new URLSearchParams();
        body.append("grant_type", grantType);
        for (const [key, value] of Object.entries(grant)) {
          body.append(key, value);
        }

        const result = await drupalkit.request<SimpleOauthTokenResponse>(url, {
          method: "POST",
          body,
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        });

        if (result.err) {
          return result;
        }

        return Ok(result.val.data);
      },
    },
  };
};
