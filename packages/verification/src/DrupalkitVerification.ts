import { Drupalkit } from "@drupal-kit/core";

import { VerificationProvider } from "./verification.js";

/*
declare module "@drupal-kit/core" {
  interface DrupalkitOptions {
  }
}
*/

/**
 * DrupalkitVerification plugin for Drupalkit.
 *
 * Provides a generic way to set and inject verification data
 * into Drupalkit.
 * This plugin requires the `verification` drupal module.
 *
 * @param drupalkit - The Drupalkit instance.
 */
export const DrupalkitVerification = (
  drupalkit: Drupalkit,
  //drupalkitOptions: DrupalkitOptions,
) => {
  const enhancedDrupalkit = drupalkit as Drupalkit &
    ReturnType<typeof DrupalkitVerification>;

  /**
   * Add a verification via a verification provider function.
   *
   * This provider will be used for the next request only!
   *
   * @param provider - The verification provider function.
   */
  const addVerification = (provider: VerificationProvider) => {
    enhancedDrupalkit.verification.provider = provider;
  };

  /**
   * Removes an active verification provider.
   */
  const removeVerification = () => {
    if (enhancedDrupalkit.verification.provider) {
      enhancedDrupalkit.verification = {
        provider: null,
      };
    }
  };

  /**
   * If a verification is set, add it to the request.
   */
  drupalkit.hook.before("request", async (requestOptions) => {
    if (enhancedDrupalkit.verification.provider) {
      await enhancedDrupalkit.verification.provider.provide(requestOptions);
    }
  });

  /**
   * Remove verification after each successful request.
   */
  drupalkit.hook.after("request", () => {
    removeVerification();
  });

  /**
   * Extend the Drupalkit instance.
   */
  return {
    addVerification,
    removeVerification,
    verification: {
      provider: null as VerificationProvider | null,
    },
  };
};
