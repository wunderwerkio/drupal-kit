// eslint-disable-next-line
import type { DrupalkitOptions } from "@drupal-kit/core";

/**
 * Augment DrupalkitOptions and add custom configuration.
 */
declare module "@drupal-kit/core" {
  interface DrupalkitOptions {
    consumerHeaderName?: string;
    consumerId?: string;

    //
    // Deprecated properties.
    //

    /**
     * The consumer id to set on requests.
     *
     * @deprecated Deprecated in `0.10.2` will be removed in `1.0.0`. Use `consumerId` instead.
     */
    consumerUUID?: string;
  }
}
