import { Result } from "@wunderwerk/ts-functional/results";
import { Drupalkit, DrupalkitError, DrupalkitOptions } from "@drupal-kit/core";
import { OverrideableRequestOptions } from "@drupal-kit/types";

import { RegisterPayload, RegisterResponse, SuccessResponse } from "./types.js";

/**
 * DrupalkitUserApi plugin for Drupalkit.
 *
 * Integrates the `user_api` drupal module with Drupalkit.
 *
 * @param drupalkit - The Drupalkit instance.
 * @param drupalkitOptions - The Drupalkit options.
 */
export const DrupalkitUserApi = (
  drupalkit: Drupalkit,
  drupalkitOptions: DrupalkitOptions,
) => {
  if (drupalkitOptions.userApiResendMailEndpoint) {
    drupalkitOptions.userApiRegisterResendEmailEndpoint = drupalkitOptions.userApiResendMailEndpoint;
  }
  if (drupalkitOptions.userApiInitAccountCancelEndpoint) {
    drupalkitOptions.userApiInitCancelAccountEndpoint = drupalkitOptions.userApiInitAccountCancelEndpoint;
  }
  if (drupalkitOptions.userApiResetPasswordEndpoint) {
    drupalkitOptions.userApiInitSetPasswordEndpoint = drupalkitOptions.userApiResetPasswordEndpoint;
  }
  if (drupalkitOptions.userApiUpdatePasswordEndpoint) {
    drupalkitOptions.userApiSetPasswordEndpoint = drupalkitOptions.userApiUpdatePasswordEndpoint;
  }
  if (drupalkitOptions.userApiVerifyEmailEndpoint) {
    drupalkitOptions.userApiInitSetEmailEndpoint = drupalkitOptions.userApiVerifyEmailEndpoint;
  }
  if (drupalkitOptions.userApiUpdateEmailEndpoint) {
    drupalkitOptions.userApiSetEmailEndpoint = drupalkitOptions.userApiUpdateEmailEndpoint;
  }

  const registrationEndpoint =
    drupalkitOptions.userApiRegistrationEndpoint ?? "/user-api/register";
  const registerResendEmailEndpoint =
    drupalkitOptions.userApiRegisterResendEmailEndpoint ??
    "/user-api/register/resend-email";

  const cancelAccountEndpoint =
    drupalkitOptions.userApiCancelAccountEndpoint ?? "/user-api/cancel-account";
  const initCancelAccountEndpoint =
    drupalkitOptions.userApiInitCancelAccountEndpoint ??
    "/user-api/cancel-account/init";

  const initSetPasswordEndpoint =
    drupalkitOptions.userApiInitSetPasswordEndpoint ??
    "/user-api/set-password/init";
  const setPasswordEndpoint =
    drupalkitOptions.userApiSetPasswordEndpoint ?? "/user-api/set-password";

  const passwordlessLoginEndpoint =
    drupalkitOptions.userApiPasswordlessLoginEndpoint ??
    "/user-api/passwordless-login";

  const initSetEmailEndpoint =
    drupalkitOptions.userApiInitSetEmailEndpoint ?? "/user-api/set-email/init";
  const setEmailEndpoint =
    drupalkitOptions.userApiSetEmailEndpoint ?? "/user-api/set-email";

  const headers = {
    "content-type": "application/json",
  };

  /**
   * Register a new user.
   *
   * The payload is largely depending on how your drupal instance
   * is configured. Do not forget to augment the Payload and Response
   * interfaces to suit your needs!
   *
   * @param payload - The registration payload.
   * @param requestOptions - Optional request options.
   */
  const register = async (
    payload: RegisterPayload,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<RegisterResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(registrationEndpoint);

    const result = await drupalkit.request<RegisterResponse>(
      url,
      {
        method: "POST",
        body: payload,
        headers,
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Initialize account cancellation.
   *
   * The request MUST be authorized!
   *
   * This endpoint does not return useful data.
   * Only the status code is important.
   *
   * @param requestOptions - Optional request options.
   */
  const initAccountCancel = async (
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SuccessResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(initCancelAccountEndpoint);

    const result = await drupalkit.request<SuccessResponse>(
      url,
      {
        method: "POST",
        headers,
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Cancel account.
   *
   * The request MUST be authorized!
   * This endpoint requires verification via the verification plugin!
   *
   * This endpoint does not return useful data.
   * Only the status code is important.
   *
   * @param requestOptions - Optional request options.
   */
  const cancelAccount = async (
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SuccessResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(cancelAccountEndpoint);

    const result = await drupalkit.request<SuccessResponse>(
      url,
      {
        method: "POST",
        headers,
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Initialize password reset.
   *
   * The request MUST be authorized!
   *
   * This endpoint does not return useful data.
   * Only the status code is important.
   *
   * @param email - E-Mail address of the user.
   * @param requestOptions - Optional request options.
   */
  const resetPassword = async (
    email: string,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SuccessResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(initSetPasswordEndpoint);

    const result = await drupalkit.request<SuccessResponse>(
      url,
      {
        method: "POST",
        body: { email },
        headers,
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Update user password.
   *
   * This endpoint must either supply the current password or
   * be verified via the verification plugin!
   *
   * @param newPassword - The new password to set for the user.
   * @param currentPassword - The current password for the user.
   * @param requestOptions - Optional request options.
   */
  const updatePassword = async (
    newPassword: string,
    currentPassword?: string,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SuccessResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(setPasswordEndpoint);

    const payload: { newPassword: string; currentPassword?: string } = {
      newPassword,
    };
    if (currentPassword) {
      payload.currentPassword = currentPassword;
    }

    const result = await drupalkit.request<SuccessResponse>(
      url,
      {
        method: "POST",
        body: payload,
        headers,
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Trigger passwordless login.
   *
   * The request MUST be authorized!
   *
   * This endpoint does not return useful data.
   * Only the status code is important.
   *
   * @param email - E-Mail address of the user.
   * @param requestOptions - Optional request options.
   */
  const passwordlessLogin = async (
    email: string,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SuccessResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(passwordlessLoginEndpoint);

    const result = await drupalkit.request<SuccessResponse>(
      url,
      {
        method: "POST",
        body: { email },
        unauthenticated: true,
        headers,
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Verify new email change.
   *
   * The request MUST be authorized!
   *
   * This endpoint does not return useful data.
   * Only the status code is important.
   *
   * @param email - New E-Mail address of the user.
   * @param requestOptions - Optional request options.
   */
  const verifyEmail = async (
    email: string,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SuccessResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(initSetEmailEndpoint);

    const result = await drupalkit.request<SuccessResponse>(
      url,
      {
        method: "POST",
        body: { email },
        headers,
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Update user email.
   *
   * The request MUST be authorized!
   * This endpoint requires verification via the verification plugin!
   *
   * @param email - New E-Mail address of the user.
   * @param requestOptions - Optional request options.
   */
  const updateEmail = async (
    email: string,
    requestOptions?: OverrideableRequestOptions,
  ): Promise<Result<SuccessResponse, DrupalkitError>> => {
    const url = drupalkit.buildUrl(setEmailEndpoint);

    const result = await drupalkit.request<SuccessResponse>(
      url,
      {
        method: "POST",
        body: { email },
        headers,
      },
      requestOptions,
    );

    if (result.err) {
      return result;
    }

    return Result.Ok(result.val.data);
  };

  /**
   * Resend verification email.
   *
   * Resend the verification email for the given operation.
   *
   * @param email - E-Mail address to resend to.
   * @param operation - Operation of which to resend email.
   * @param requestOptions - Optional request options.
   */
  const resendVerificationEmail = async (
    email: string,
    operation: string,
    requestOptions?: OverrideableRequestOptions,
  ) => {
    const url = drupalkit.buildUrl(registerResendEmailEndpoint);

    const result = await drupalkit.request<{ status: "success" }>(
      url,
      {
        method: "POST",
        body: { email, operation },
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
   * Extend the Drupalkit instance.
   */
  return {
    userApi: {
      register,
      initAccountCancel,
      cancelAccount,
      resetPassword,
      updatePassword,
      passwordlessLogin,
      verifyEmail,
      updateEmail,
      resendVerificationEmail,
    },
  };
};
