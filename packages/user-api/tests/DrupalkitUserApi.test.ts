import test from "ava";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { Drupalkit, DrupalkitOptions } from "@drupal-kit/core";

import { DrupalkitUserApi } from "../src/index.js";
import UserResponse from "./fixtures/user_response.json" assert { type: "json" };

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

test.before(() => {
  server.listen();
});

test.afterEach(() => {
  server.resetHandlers();
});

test.after(() => {
  server.close();
});

test.serial("Register", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      const data = await request.json();

      t.deepEqual(data, payload);

      return HttpResponse.json(UserResponse)
    }),
  );

  const result = await drupalkit.userApi.register(payload);

  const res = result.unwrap();

  t.deepEqual(res, UserResponse);
});

test.serial("Register with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(UserResponse)
    }),
  );

  await drupalkit.userApi.register(payload, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Register with custom endpoint", async (t) => {
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
      HttpResponse.json(UserResponse)
    ),
  );

  const result = await drupalkit.userApi.register(payload);

  t.assert(result.ok);
});

test.serial("Handle register error", async (t) => {
  const drupalkit = createDrupalkit();

  const payload = {
    name: { value: "john-doe-1" },
    mail: { value: "JzWZg@example.com" },
  };

  server.use(
    http.post("*/user-api/register", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.register(payload);

  t.assert(result.err);
});

/**
 * Resend register email.
 */

test.serial("Resend register email", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";
  const operation = "register";

  server.use(
    http.post("*/user-api/register/resend-email", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), { email, operation });

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.resendRegisterEmail(email, operation);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Resend register email with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";
  const operation = "register";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/register/resend-email", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.resendRegisterEmail(email, operation, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Resend register email with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiRegisterResendEmailEndpoint: "/custom/register/resend-email",
  });
  const email = "JzWZg@example.com";
  const operation = "register";

  server.use(
    http.post("*/custom/register/resend-email", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.resendRegisterEmail(email, operation);

  t.assert(result.ok);
});

test.serial("Resend register email - deprecated version", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiResendMailEndpoint: "/custom/register/resend-email",
  });
  const email = "JzWZg@example.com";
  const operation = "register";

  server.use(
    http.post("*/custom/register/resend-email", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.resendVerificationEmail(
    email,
    operation,
  );

  t.assert(result.ok);
});

test.serial("Handle error while resend register email", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";
  const operation = "register";

  server.use(
    http.post("*/user-api/register/resend-email", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.resendRegisterEmail(email, operation);

  t.assert(result.err);
});

/**
 * initCancelAccount().
 */

test.serial("Init cancel account", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/cancel-account/init", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.initCancelAccount();

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Init cancel account with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/cancel-account/init", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.initCancelAccount({
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Init cancel account with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitCancelAccountEndpoint: "/custom/cancel-account/init",
  });

  server.use(
    http.post("*/custom/cancel-account/init", async ({ request }) =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.initCancelAccount();

  t.assert(result.ok);
});

test.serial("Init cancel account - deprecated version", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitAccountCancelEndpoint: "/custom/cancel-account/init",
  });

  server.use(
    http.post("*/custom/cancel-account/init", async ({ request }) =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.initAccountCancel();

  t.assert(result.ok);
});

test.serial("Handle error while init cancel account", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/cancel-account/init", async ({ request }) =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.initCancelAccount();

  t.assert(result.err);
});

/**
 * cancelAccount().
 */

test.serial("Cancel account", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/cancel-account", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.cancelAccount();

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Cancel account with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/cancel-account", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.cancelAccount({
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Cancel account with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiCancelAccountEndpoint: "/custom/cancel-account",
  });

  server.use(
    http.post("*/custom/cancel-account", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.cancelAccount();

  t.assert(result.ok);
});

test.serial("Handle error while cancel account", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/cancel-account", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.cancelAccount();

  t.assert(result.err);
});

/**
 * Init set password
 */

test.serial("Init set password", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-password/init", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), { email });

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.initSetPassword(email);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Init set password with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/set-password/init", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.initSetPassword(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Init set password with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitSetPasswordEndpoint: "/custom/set-password/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-password/init", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.initSetPassword(email);

  t.assert(result.ok);
});

test.serial("Init set password - deprecated version", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiResetPasswordEndpoint: "/custom/set-password/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-password/init", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.resetPassword(email);

  t.assert(result.ok);
});

test.serial("Handle error while init set password", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-password/init", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.initSetPassword(email);

  t.assert(result.err);
});

/**
 * Set password
 */

test.serial("Set password", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    http.post("*/user-api/set-password", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), { newPassword });

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.setPassword(newPassword);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Set password with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/set-password", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.setPassword(newPassword, undefined, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Set password with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiSetPasswordEndpoint: "/custom/set-password",
  });
  const newPassword = "new-password";

  server.use(
    http.post("*/custom/set-password", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.setPassword(newPassword);

  t.assert(result.ok);
});

test.serial("Set password - deprecated version", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiUpdatePasswordEndpoint: "/custom/set-password",
  });
  const newPassword = "new-password";

  server.use(
    http.post("*/custom/set-password", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.updatePassword(newPassword);

  t.assert(result.ok);
});

test.serial("Handle error while set password", async (t) => {
  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    http.post("*/user-api/set-password", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.setPassword(newPassword);

  t.assert(result.err);
});

/**
 * Init unset password
 */

test.serial("Init unset password", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/unset-password/init", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), { email });

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.initUnsetPassword(email);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Init unset password with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/unset-password/init", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.initUnsetPassword(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Init unset password with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitUnsetPasswordEndpoint: "/custom/unset-password/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/unset-password/init", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.initUnsetPassword(email);

  t.assert(result.ok);
});

test.serial("Handle error while init unset password", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/unset-password/init", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.initUnsetPassword(email);

  t.assert(result.err);
});

/**
 * Unset password
 */

test.serial("Unset password with verification", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();

  server.use(
    http.post("*/user-api/unset-password", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), {});

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.unsetPassword();

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Unset password with currentPassword", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const currentPassword = "abc123";

  server.use(
    http.post("*/user-api/unset-password", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), { currentPassword });

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.unsetPassword(currentPassword);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Unset password with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/unset-password", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.unsetPassword(undefined, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Unset password with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiUnsetPasswordEndpoint: "/custom/unset-password",
  });

  server.use(
    http.post("*/custom/unset-password", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.unsetPassword();

  t.assert(result.ok);
});

test.serial("Handle error while unset password", async (t) => {
  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    http.post("*/user-api/unset-password", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.unsetPassword(newPassword);

  t.assert(result.err);
});

/**
 * Passwordless login
 */

test.serial("Passwordless login", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/passwordless-login", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), { email });

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.passwordlessLogin(email);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Passwordless login with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/passwordless-login", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.passwordlessLogin(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Passwordless login with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiPasswordlessLoginEndpoint: "/custom/passwordless-login",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/passwordless-login", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.passwordlessLogin(email);

  t.assert(result.ok);
});

test.serial("Handle error while passwordless login", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/passwordless-login", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.passwordlessLogin(email);

  t.assert(result.err);
});

/**
 * Init set email
 */

test.serial("Init set email", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-email/init", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), { email });

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.initSetEmail(email);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Init set email with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/set-email/init", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.initSetEmail(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Init set email with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitSetEmailEndpoint: "/custom/set-email/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-email/init", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.initSetEmail(email);

  t.assert(result.ok);
});

test.serial("Init set email - deprecated version", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiVerifyEmailEndpoint: "/custom/set-email/init",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-email/init", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.verifyEmail(email);

  t.assert(result.ok);
});

test.serial("Handle error while init set email", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-email/init", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.initSetEmail(email);

  t.assert(result.err);
});

/**
 * Set email
 */

test.serial("Set email", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-email", async ({ request }) => {
      t.is(request.headers.get("content-type"), "application/json");

      t.deepEqual(await request.json(), { email });

      return HttpResponse.json(successResponse)
    }),
  );

  const result = await drupalkit.userApi.setEmail(email);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Set email with custom request options", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  drupalkit.hook.before("request", (options) => {
    t.is(options.cache, "no-cache");
  });

  server.use(
    http.post("*/user-api/set-email", async ({ request }) => {
      t.is(request.headers.get("X-Custom"), "1");

      return HttpResponse.json(successResponse)
    }),
  );

  await drupalkit.userApi.setEmail(email, {
    cache: "no-cache",
    headers: {
      "X-Custom": "1",
    },
  });
});

test.serial("Set email with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiSetEmailEndpoint: "/custom/set-email",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-email", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.setEmail(email);

  t.assert(result.ok);
});

test.serial("Set email - deprecated version", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiUpdateEmailEndpoint: "/custom/set-email",
  });
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/custom/set-email", async () =>
      HttpResponse.json(successResponse)
    ),
  );

  const result = await drupalkit.userApi.updateEmail(email);

  t.assert(result.ok);
});

test.serial("Handle error while set email", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    http.post("*/user-api/set-email", async () =>
      HttpResponse.text(null, { status: 400 })
    ),
  );

  const result = await drupalkit.userApi.setEmail(email);

  t.assert(result.err);
});
