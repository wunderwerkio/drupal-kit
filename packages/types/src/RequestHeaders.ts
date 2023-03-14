/**
 * Common request headers.
 */
export type RequestHeaders = {
  /**
   * Use `authorization` to send authenticated request, remember `token ` / `bearer ` prefixes. Example: `Bearer 1234567890abcdef1234567890abcdef12345678`.
   */
  authorization?: string;

  /**
   * The `user-agent` header is set do a default and can be overwritten as needed.
   */
  "user-agent"?: string;

  /**
   * Allow anything.
   */
  [header: string]: string | number | undefined;
};
