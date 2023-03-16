import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import "@drupal-kit/error";

declare module "@drupal-kit/core" {
  interface DrupalkitOptions {
    consumerHeaderName?: string;
    consumerUUID?: string;
  }
}

/**
 * DrupalkitConsumers plugin for Drupalkit.
 *
 * Integrates the `consumers` drupal module with Drupalkit.
 *
 * @param drupalkit - The Drupalkit instance.
 * @param drupalkitOptions - The Drupalkit options.
 */
export const DrupalkitConsumers = (
  drupalkit: Drupalkit,
  drupalkitOptions: DrupalkitOptions,
) => {
  const headerName = drupalkitOptions.consumerHeaderName ?? "X-Consumer-ID";

  /**
   * Add the consumer id header to the request if value is set.
   */
  drupalkit.hook.before("request", (requestOptions) => {
    if (drupalkitOptions.consumerUUID) {
      requestOptions.headers[headerName] = drupalkitOptions.consumerUUID;
    }
  });
};
