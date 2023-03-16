import { Ok } from "ts-results";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { RegisterPayload, RegisterResponse } from "./types";

declare module "@drupal-kit/core" {
  interface DrupalkitOptions {
    userApiRegistrationEndpoint?: string;
    userApiCancelAccountEndpoint?: string;
    userApiInitAccountCancelEndpoint?: string;
    userApiResetPasswordEndpoint?: string;
    userApiUpdatePasswordEndpoint?: string;
    userApiPasswordlessLoginEndpoint?: string;
    userApiUpdateEmailEndpoint?: string;
    userApiVerifyEmailEndpoint?: string;
  }
}

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
  const registrationEndpoint =
    drupalkitOptions.userApiRegistrationEndpoint ?? "/user-api/register";
  const cancelAccountEndpoint =
    drupalkitOptions.userApiCancelAccountEndpoint ?? "/user-api/cancel-account";
  const initAccountCancelEndpoint =
    drupalkitOptions.userApiInitAccountCancelEndpoint ??
    "/user-api/init-account-cancel";
  const resetPasswordEndpoint =
    drupalkitOptions.userApiResetPasswordEndpoint ?? "/user-api/reset-password";
  const updatePasswordEndpoint =
    drupalkitOptions.userApiUpdatePasswordEndpoint ??
    "/user-api/update-password";
  const passwordlessLoginEndpoint =
    drupalkitOptions.userApiPasswordlessLoginEndpoint ??
    "/user-api/passwordless-login";
  const updateEmailEndpoint =
    drupalkitOptions.userApiUpdateEmailEndpoint ?? "/user-api/update-email";
  const verifyEmailEndpoint =
    drupalkitOptions.userApiVerifyEmailEndpoint ?? "/user-api/verify-email";

  /**
   * Register a new user.
   *
   * The payload is largely depending on how your drupal instance
   * is configured. Do not forget to augment the Payload and Response
   * interfaces to suit your needs!
   *
   * @param payload - The registration payload.
   */
  const register = async (payload: RegisterPayload) => {
    const url = drupalkit.buildUrl(registrationEndpoint);

    const result = await drupalkit.request<RegisterResponse>(url, {
      method: "POST",
      body: payload,
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
  };

  /**
   * Initialize account cancellation.
   *
   * The request MUST be authorized!
   *
   * This endpoint does not return useful data.
   * Only the status code is important.
   */
  const initAccountCancel = async () => {
    const url = drupalkit.buildUrl(initAccountCancelEndpoint);

    const result = await drupalkit.request<{ status: "success" }>(url, {
      method: "POST",
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
  };

  /**
   * Cancel account.
   *
   * The request MUST be authorized!
   * This endpoint requires verification via the verification plugin!
   *
   * This endpoint does not return useful data.
   * Only the status code is important.
   */
  const cancelAccount = async () => {
    const url = drupalkit.buildUrl(cancelAccountEndpoint);

    const result = await drupalkit.request<{ status: "success" }>(url, {
      method: "POST",
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
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
   */
  const resetPassword = async (email: string) => {
    const url = drupalkit.buildUrl(resetPasswordEndpoint);

    const result = await drupalkit.request<{ status: "success" }>(url, {
      method: "POST",
      body: { email },
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
  };

  /**
   * Update user password.
   *
   * This endpoint must either supply the current password or
   * be verified via the verification plugin!
   *
   * @param newPassword - The new password to set for the user.
   * @param currentPassword - The current password for the user.
   */
  const updatePassword = async (
    newPassword: string,
    currentPassword?: string,
  ) => {
    const url = drupalkit.buildUrl(updatePasswordEndpoint);

    const payload: { newPassword: string; currentPassword?: string } = {
      newPassword,
    };
    if (currentPassword) {
      payload.currentPassword = currentPassword;
    }

    const result = await drupalkit.request<{ status: "success" }>(url, {
      method: "POST",
      body: payload,
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
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
   */
  const passwordlessLogin = async (email: string) => {
    const url = drupalkit.buildUrl(passwordlessLoginEndpoint);

    const result = await drupalkit.request<{ status: "success" }>(url, {
      method: "POST",
      body: { email },
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
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
   */
  const verifyEmail = async (email: string) => {
    const url = drupalkit.buildUrl(verifyEmailEndpoint);

    const result = await drupalkit.request<{ status: "success" }>(url, {
      method: "POST",
      body: { email },
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
  };

  /**
   * Update user email.
   *
   * The request MUST be authorized!
   * This endpoint requires verification via the verification plugin!
   *
   * @param email - New E-Mail address of the user.
   */
  const updateEmail = async (email: string) => {
    const url = drupalkit.buildUrl(updateEmailEndpoint);

    const result = await drupalkit.request<{ status: "success" }>(url, {
      method: "POST",
      body: { email },
    });

    if (result.err) {
      return result;
    }

    return Ok(result.val.data);
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
    },
  };
};
