import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";
import "./types.js";

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
  // Support deprecated options.
  if (drupalkitOptions.consumerUUID) {
    drupalkitOptions.consumerId = drupalkitOptions.consumerUUID;
  }

  const headerName = drupalkitOptions.consumerHeaderName ?? "X-Consumer-ID";

  /**
   * Add the consumer id header to the request if value is set.
   */
  drupalkit.hook.before("request", (requestOptions) => {
    if (drupalkitOptions.consumerId && !requestOptions.headers[headerName]) {
      requestOptions.headers[headerName] = drupalkitOptions.consumerId;
    }
  });
};
