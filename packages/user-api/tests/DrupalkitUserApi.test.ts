import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitUserApi } from "../src/index.js";
import UserResponse from "./fixtures/user_response.js";

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

const server = setupServer();

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

test("Register", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      const data = await request.json();

      expect(data).toEqual(payload);

      return HttpResponse.json(UserResponse);
    }),
  );

  const result = await drupalkit.userApi.register(payload);

  const res = result.unwrap();

  expect(res).toEqual(UserResponse);
});

test("Register with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(UserResponse);
    }),
  );

  await drupalkit.userApi.register(payload, undefined, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Register with email notification disabled", async () => {
  expect.assertions(1);

  const drupalkit = createDrupalkit();

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async ({ request }) => {
      expect(request.headers.get("X-Disable-Email-Notification")).toBe("1");

      return HttpResponse.json(UserResponse);
    }),
  );

  await drupalkit.userApi.register(payload, {
    disableEmailNotification: true,
  });
});

test("Register with account activation disabled", async () => {
  expect.assertions(1);

  const drupalkit = createDrupalkit();

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async ({ request }) => {
      expect(request.headers.get("X-Disable-Account-Activation")).toBe("1");

      return HttpResponse.json(UserResponse);
    }),
  );

  await drupalkit.userApi.register(payload, {
    disableEmailNotification: false,
    disableAccountActivation: true,
  });
});

test("Register with all options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async ({ request }) => {
      expect(request.headers.get("X-Disable-Email-Notification")).toBe("1");
      expect(request.headers.get("X-Disable-Account-Activation")).toBe("1");

      return HttpResponse.json(UserResponse);
    }),
  );

  await drupalkit.userApi.register(payload, {
    disableEmailNotification: true,
    disableAccountActivation: true,
  });
});

test("Register with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiRegistrationEndpoint: "/custom/register",
  });

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/custom/register", async ({ request }) =>
      HttpResponse.json(UserResponse),
    ),
  );

  const result = await drupalkit.userApi.register(payload);

  expect(result.ok).toBeTruthy();
});

test("Handle register error", async () => {
  const drupalkit = createDrupalkit();

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.register(payload);

  expect(result.err).toBeTruthy();
});

/**
 * Resend register email.
 */

test("Resend register email", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";
  const operation = "register";

  server.use(
    http.post("*/user-api/register/resend-email", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({ email, operation });

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.resendRegisterEmail(email, operation);

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Resend register email with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";
  const operation = "register";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/register/resend-email", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.resendRegisterEmail(email, operation, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Resend register email with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiRegisterResendEmailEndpoint: "/custom/register/resend-email",
  });
  const email = "JzWZg@example.com";
  const operation = "register";

  server.use(
    http.post("*/custom/register/resend-email", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.resendRegisterEmail(email, operation);

  expect(result.ok).toBeTruthy();
});

test("Resend register email - deprecated version", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiResendMailEndpoint: "/custom/register/resend-email",
  });
  const email = "JzWZg@example.com";
  const operation = "register";

  server.use(
    http.post("*/custom/register/resend-email", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.resendVerificationEmail(
    email,
    operation,
  );

  expect(result.ok).toBeTruthy();
});

test("Handle error while resend register email", async () => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";
  const operation = "register";

  server.use(
    http.post("*/user-api/register/resend-email", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.resendRegisterEmail(email, operation);

  expect(result.err).toBeTruthy();
});

/**
 * initCancelAccount().
 */

test("Init cancel account", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/cancel-account/init", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.initCancelAccount();

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Init cancel account with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/cancel-account/init", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.initCancelAccount({
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Init cancel account with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitCancelAccountEndpoint: "/custom/cancel-account/init",
  });

  server.use(
    http.post("*/custom/cancel-account/init", async ({ request }) =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.initCancelAccount();

  expect(result.ok).toBeTruthy();
});

test("Init cancel account - deprecated version", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitAccountCancelEndpoint: "/custom/cancel-account/init",
  });

  server.use(
    http.post("*/custom/cancel-account/init", async ({ request }) =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.initAccountCancel();

  expect(result.ok).toBeTruthy();
});

test("Handle error while init cancel account", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/cancel-account/init", async ({ request }) =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.initCancelAccount();

  expect(result.err).toBeTruthy();
});

/**
 * cancelAccount().
 */

test("Cancel account", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/cancel-account", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.cancelAccount();

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Cancel account with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/cancel-account", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.cancelAccount({
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Cancel account with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiCancelAccountEndpoint: "/custom/cancel-account",
  });

  server.use(
    http.post("*/custom/cancel-account", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.cancelAccount();

  expect(result.ok).toBeTruthy();
});

test("Handle error while cancel account", async () => {
  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/cancel-account", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.cancelAccount();

  expect(result.err).toBeTruthy();
});

/**
 * Init set password
 */

test("Init set password", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-password/init", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({ email });

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.initSetPassword(email);

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Init set password with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/set-password/init", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.initSetPassword(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Init set password with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitSetPasswordEndpoint: "/custom/set-password/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-password/init", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.initSetPassword(email);

  expect(result.ok).toBeTruthy();
});

test("Init set password - deprecated version", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiResetPasswordEndpoint: "/custom/set-password/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-password/init", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.resetPassword(email);

  expect(result.ok).toBeTruthy();
});

test("Handle error while init set password", async () => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-password/init", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.initSetPassword(email);

  expect(result.err).toBeTruthy();
});

/**
 * Set password
 */

test("Set password", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    http.post("*/user-api/set-password", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({ newPassword });

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.setPassword(newPassword);

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Set password with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/set-password", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.setPassword(newPassword, undefined, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Set password with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiSetPasswordEndpoint: "/custom/set-password",
  });
  const newPassword = "new-password";

  server.use(
    http.post("*/custom/set-password", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.setPassword(newPassword);

  expect(result.ok).toBeTruthy();
});

test("Set password - deprecated version", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiUpdatePasswordEndpoint: "/custom/set-password",
  });
  const newPassword = "new-password";

  server.use(
    http.post("*/custom/set-password", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.updatePassword(newPassword);

  expect(result.ok).toBeTruthy();
});

test("Handle error while set password", async () => {
  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    http.post("*/user-api/set-password", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.setPassword(newPassword);

  expect(result.err).toBeTruthy();
});

/**
 * Init unset password
 */

test("Init unset password", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/unset-password/init", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({ email });

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.initUnsetPassword(email);

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Init unset password with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/unset-password/init", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.initUnsetPassword(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Init unset password with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitUnsetPasswordEndpoint: "/custom/unset-password/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/unset-password/init", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.initUnsetPassword(email);

  expect(result.ok).toBeTruthy();
});

test("Handle error while init unset password", async () => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/unset-password/init", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.initUnsetPassword(email);

  expect(result.err).toBeTruthy();
});

/**
 * Unset password
 */

test("Unset password with verification", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/unset-password", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({});

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.unsetPassword();

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Unset password with currentPassword", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const currentPassword = "abc123";

  server.use(
    http.post("*/user-api/unset-password", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({ currentPassword });

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.unsetPassword(currentPassword);

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Unset password with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/unset-password", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.unsetPassword(undefined, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Unset password with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiUnsetPasswordEndpoint: "/custom/unset-password",
  });

  server.use(
    http.post("*/custom/unset-password", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.unsetPassword();

  expect(result.ok).toBeTruthy();
});

test("Handle error while unset password", async () => {
  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    http.post("*/user-api/unset-password", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.unsetPassword(newPassword);

  expect(result.err).toBeTruthy();
});

/**
 * Passwordless login
 */

test("Passwordless login", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/passwordless-login", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({ email });

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.passwordlessLogin(email);

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Passwordless login with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/passwordless-login", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.passwordlessLogin(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Passwordless login with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiPasswordlessLoginEndpoint: "/custom/passwordless-login",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/passwordless-login", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.passwordlessLogin(email);

  expect(result.ok).toBeTruthy();
});

test("Handle error while passwordless login", async () => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/passwordless-login", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.passwordlessLogin(email);

  expect(result.err).toBeTruthy();
});

/**
 * Init set email
 */

test("Init set email", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-email/init", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({ email });

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.initSetEmail(email);

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Init set email with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/set-email/init", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.initSetEmail(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Init set email with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitSetEmailEndpoint: "/custom/set-email/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-email/init", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.initSetEmail(email);

  expect(result.ok).toBeTruthy();
});

test("Init set email - deprecated version", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiVerifyEmailEndpoint: "/custom/set-email/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-email/init", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.verifyEmail(email);

  expect(result.ok).toBeTruthy();
});

test("Handle error while init set email", async () => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-email/init", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.initSetEmail(email);

  expect(result.err).toBeTruthy();
});

/**
 * Set email
 */

test("Set email", async () => {
  expect.assertions(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-email", async ({ request }) => {
      expect(request.headers.get("content-type")).toBe("application/json");

      expect(await request.json()).toEqual({ email });

      return HttpResponse.json(successResponse);
    }),
  );

  const result = await drupalkit.userApi.setEmail(email);

  const res = result.unwrap();

  expect(res).toEqual(successResponse);
});

test("Set email with custom request options", async () => {
  expect.assertions(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    expect(options.cache).toBe("no-cache");
  });

  server.use(
    http.post("*/user-api/set-email", async ({ request }) => {
      expect(request.headers.get("X-Custom")).toBe("1");

      return HttpResponse.json(successResponse);
    }),
  );

  await drupalkit.userApi.setEmail(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test("Set email with custom endpoint", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiSetEmailEndpoint: "/custom/set-email",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-email", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.setEmail(email);

  expect(result.ok).toBeTruthy();
});

test("Set email - deprecated version", async () => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiUpdateEmailEndpoint: "/custom/set-email",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-email", async () =>
      HttpResponse.json(successResponse),
    ),
  );

  const result = await drupalkit.userApi.updateEmail(email);

  expect(result.ok).toBeTruthy();
});

test("Handle error while set email", async () => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-email", async () =>
      HttpResponse.text(null, { status: 400 }),
    ),
  );

  const result = await drupalkit.userApi.setEmail(email);

  expect(result.err).toBeTruthy();
});
