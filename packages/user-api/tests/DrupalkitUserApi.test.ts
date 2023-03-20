import fetchMock, { enableFetchMocks } from "jest-fetch-mock";
import { Drupalkit, DrupalkitError, DrupalkitOptions } from "@drupal-kit/core";
import { mockNetworkError, mockResponse } from "@drupal-kit/core/test-utils";

import { DrupalkitUserApi } from "../src/index";
import UserResponse from "./fixtures/user_response.json";

enableFetchMocks();

describe("DrupalkitUserApi", () => {
  const BASE_URL = "https://my-drupal.com";

  const successResponse = {
    status: "success",
  };

  const createDrupalkit = (
    options: DrupalkitOptions = {
      baseUrl: BASE_URL,
    },
  ) => {
    const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitUserApi);

    return new EnhancedDrupalkit({
      locale: "de",
      defaultLocale: "de",
      ...options,
    });
  };

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  /**
   * Register.
   */

  it("should register", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/user-api/register",
      payloadFixture: UserResponse,
    });

    const payload = {
      name: { value: "john-doe-1" },
      mail: { value: "JzWZg@example.com" },
    };

    const result = await drupalkit.userApi.register(payload);

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(UserResponse);
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  it("should register with explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      userApiRegistrationEndpoint: "/custom/register",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/register",
      payloadFixture: UserResponse,
    });

    const payload = {
      name: { value: "john-doe-1" },
      mail: { value: "JzWZg@example.com" },
    };

    const result = await drupalkit.userApi.register(payload);

    expect(result.ok).toBeTruthy();
    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toContain("/custom/register");
  });

  it("should handle error while registering", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const payload = {
      name: { value: "john-doe-1" },
      mail: { value: "JzWZg@example.com" },
    };

    const result = await drupalkit.userApi.register(payload);

    expect(result.err).toBeTruthy();
  });

  /**
   * Init account cancel.
   */

  it("should init account cancel", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/user-api/init-account-cancel",
      payloadFixture: successResponse,
    });

    const result = await drupalkit.userApi.initAccountCancel();

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(successResponse);
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });
  });

  it("should init account cancel with explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      userApiInitAccountCancelEndpoint: "/custom/init-account-cancel",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/init-account-cancel",
      payloadFixture: successResponse,
    });

    const result = await drupalkit.userApi.initAccountCancel();

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toContain("/custom/init-account-cancel");
  });

  it("should handle error while initializing account cancel", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const result = await drupalkit.userApi.initAccountCancel();

    expect(result.err).toBeTruthy();
  });

  /**
   * Cancel account.
   */

  it("should cancel account", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/user-api/cancel-account",
      payloadFixture: successResponse,
    });

    const result = await drupalkit.userApi.cancelAccount();

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(successResponse);
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });
  });

  it("should cancel account with explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      userApiCancelAccountEndpoint: "/custom/cancel-account",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/cancel-account",
      payloadFixture: successResponse,
    });

    const result = await drupalkit.userApi.cancelAccount();

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toContain("/custom/cancel-account");
  });

  it("should handle error while cancelling account", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const result = await drupalkit.userApi.cancelAccount();

    expect(result.err).toBeTruthy();
  });

  /**
   * Reset password
   */

  it("should reset password", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/user-api/reset-password",
      payloadFixture: successResponse,
    });

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.resetPassword(email);

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(successResponse);
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  it("should reset password with explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      userApiResetPasswordEndpoint: "/custom/reset-password",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/reset-password",
      payloadFixture: successResponse,
    });

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.resetPassword(email);

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toContain("/custom/reset-password");
  });

  it("should handle error while resetting password", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.resetPassword(email);

    expect(result.err).toBeTruthy();
  });

  /**
   * Update password
   */

  it("should update password", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/user-api/update-password",
      payloadFixture: successResponse,
    });

    const newPassword = "new-password";
    let result = await drupalkit.userApi.updatePassword(newPassword);

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(successResponse);
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ newPassword }),
      headers: {
        "content-type": "application/json",
      },
    });

    // With current password.
    const currentPassword = "current-password";
    result = await drupalkit.userApi.updatePassword(
      newPassword,
      currentPassword,
    );

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      body: JSON.stringify({ newPassword, currentPassword }),
    });
  });

  it("should update password with explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      userApiUpdatePasswordEndpoint: "/custom/update-password",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/update-password",
      payloadFixture: successResponse,
    });

    const newPassword = "new-password";
    const result = await drupalkit.userApi.updatePassword(newPassword);

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toContain("/custom/update-password");
  });

  it("should handle error while updating password", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const newPassword = "new-password";
    const result = await drupalkit.userApi.updatePassword(newPassword);

    expect(result.err).toBeTruthy();
  });

  /**
   * Passwordless login.
   */

  it("should trigger passwordless login", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/user-api/passwordless-login",
      payloadFixture: successResponse,
    });

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.passwordlessLogin(email);

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(successResponse);
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  it("should trigger passwordless login with explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      userApiPasswordlessLoginEndpoint: "/custom/passwordless-login",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/passwordless-login",
      payloadFixture: successResponse,
    });

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.passwordlessLogin(email);

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toContain("/custom/passwordless-login");
  });

  it("should handle error while triggering passwordless login", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.passwordlessLogin(email);

    expect(result.err).toBeTruthy();
  });

  /**
   * Verify email.
   */

  it("should verify email", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/user-api/verify-email",
      payloadFixture: successResponse,
    });

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.verifyEmail(email);

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(successResponse);
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  it("should verify email with explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      userApiVerifyEmailEndpoint: "/custom/verify-email",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/verify-email",
      payloadFixture: successResponse,
    });

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.verifyEmail(email);

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toContain("/custom/verify-email");
  });

  it("should handle error while verifying email", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.verifyEmail(email);

    expect(result.err).toBeTruthy();
  });

  /**
   * Update email
   */

  it("should update email", async () => {
    const drupalkit = createDrupalkit();

    mockResponse(fetchMock, drupalkit, {
      url: "/user-api/update-email",
      payloadFixture: successResponse,
    });

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.updateEmail(email);

    expect(result.ok).toBeTruthy();

    if (result.ok) {
      expect(result.val).toEqual(successResponse);
    }

    // @ts-ignore
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  it("should update email with explicit endpoint", async () => {
    const drupalkit = createDrupalkit({
      baseUrl: BASE_URL,
      userApiUpdateEmailEndpoint: "/custom/update-email",
    });

    mockResponse(fetchMock, drupalkit, {
      url: "/custom/update-email",
      payloadFixture: successResponse,
    });

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.updateEmail(email);

    expect(result.ok).toBeTruthy();

    // @ts-ignore
    expect(fetchMock.mock.calls[0][0]).toContain("/custom/update-email");
  });

  it("should handle error while updating password", async () => {
    const drupalkit = createDrupalkit();

    mockNetworkError(fetchMock);

    const email = "JzWZg@example.com";
    const result = await drupalkit.userApi.updateEmail(email);

    expect(result.err).toBeTruthy();
  });
});
