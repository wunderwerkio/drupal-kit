/**
 * Augment this interface if you want to implement your
 * own OAuth grant types.
 */
export interface SimpleOauthGrantTypes {
  authorization_code: SimpleOauthAuthCodeGrant;
  client_credentials: SimpleOauthClientCredentialsGrant;
  refresh_token: SimpleOauthRefreshTokenGrant;
  password: SimpleOauthPasswordGrant;
}

/**
 * Augment this interface to suit your needs.
 */
export interface SimpleOauthUserInfo {
  sub: string;
  name: string;
  preferred_username: string;
  email: string;
  email_verified: boolean;
  locale: string;
  zoneinfo: string | null;
  profile: string;
}

export interface SimpleOauthTokenResponse {
  token_type: "Bearer";
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

export interface SimpleOauthErrorResponse {
  error: SimpleOauthError;
  error_description?: string;
  hint?: string;
}

export type SimpleOauthGrant =
  | SimpleOauthCamelCaseClient
  | SimpleOauthSnakeCaseClient;

export interface SimpleOauthCamelCaseClient {
  clientId: string;
  clientSecret: string;
}

export interface SimpleOauthSnakeCaseClient {
  client_id: string;
  client_secret: string;
}

export type SimpleOauthAuthCodeGrant = SimpleOauthGrant & {
  code: string;
  redirectUri?: string;
  redirect_uri?: string;
  codeVerifier?: string;
  code_verifier?: string;
};

export type SimpleOauthClientCredentialsGrant = SimpleOauthGrant & {
  scope?: string;
};

export type SimpleOauthRefreshTokenGrant = SimpleOauthGrant &
  (
    | {
        refreshToken: string;
        refresh_token?: string;
      }
    | {
        refresh_token: string;
        refreshToken?: string;
      }
  ) & {
    scope?: string;
  };

export type SimpleOauthPasswordGrant = SimpleOauthGrant & {
  username: string;
  password: string;
  scope?: string;
};

export type SimpleOauthError =
  | "invalid_request"
  | "unsupported_grant_type"
  | "invalid_client"
  | "invalid_scope"
  | "server_error"
  | "access_denied"
  | "invalid_grant"
  | null;

export type SimpleOauthInvalidRequest =
  | "auth_code_expired"
  | "auth_code_malformed"
  | "auth_code_revoked"
  | "auth_code_decrypt_error"
  | "auth_code_wrong_client"
  | "redirect_uri_invalid"
  | "code_verifier_rfc_error"
  | "code_challenge_invalid"
  | "code_challenge_rfc_error"
  | "code_challenge_missing_public_client"
  | "generic"
  | "invalid_parameter_scope"
  | "invalid_parameter_client_secret"
  | "invalid_parameter_client_id"
  | "invalid_parameter_redirect_uri"
  | "invalid_parameter_refresh_token"
  | "invalid_parameter_state"
  | "invalid_parameter_redirect_uri"
  | "invalid_parameter_password"
  | "invalid_parameter_username"
  | "invalid_parameter_code_verifier"
  | "invalid_parameter_code";
