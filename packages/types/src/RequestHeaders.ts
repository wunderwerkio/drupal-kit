export type RequestHeaders = {
  /**
   * Use `authorization` to send authenticated request, remember `token ` / `bearer ` prefixes. Example: `Bearer 1234567890abcdef1234567890abcdef12345678`
   */
  authorization?: string;
  /**
   * `user-agent` is set do a default and can be overwritten as needed.
   */
  "user-agent"?: string;

  [header: string]: string | number | undefined;
};
