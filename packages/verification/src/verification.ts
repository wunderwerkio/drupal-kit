import { RequestRequestOptions } from "@drupal-kit/types";

/**
 * All verification providers must implement this interface.
 */
export interface VerificationProvider {
  provide(requestOptions: RequestRequestOptions): Promise<void> | void;
}

/**
 * A generic verification provider that adds
 * the verification data to the request via a
 * HTTP header.
 *
 * @param name - The HTTP header name.
 * @param value - The HTTP header value.
 */
export const headerVerification = (
  name: string,
  value: string,
): VerificationProvider => {
  return {
    provide(requestOptions) {
      requestOptions.headers[name] = value;
    },
  };
};

/**
 * Hash verification provider.
 *
 * Use this provider when using the `verification_hash` verification
 * provider drupal module.
 *
 * @param hash - The verification hash.
 */
export const hashVerification = (hash: string) =>
  headerVerification("x-verification-hash", hash);

/**
 * Magic Code verification provider.
 *
 * Use this provider when using the `magic_code` verification
 * provider drupal module.
 *
 * @param code - The magic code.
 */
export const magicCodeVerification = (code: string) =>
  headerVerification("x-verification-magic-code", code);
