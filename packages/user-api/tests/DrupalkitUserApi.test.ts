import test from "ava";
import { rest } from "msw";
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
    rest.post("*/user-api/register", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      const data = await req.json();

      t.deepEqual(data, payload);

      return res(ctx.json(UserResponse));
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
    rest.post("*/user-api/register", async (req, res, ctx) => {
      t.is(req.headers.get("X-Custom"), "1");

      return res(ctx.json(UserResponse));
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
    rest.post("*/custom/register", async (req, res, ctx) =>
      res(ctx.json(UserResponse)),
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
    rest.post("*/user-api/register", async (_req, res, ctx) =>
      res(ctx.status(400)),
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
    rest.post("*/user-api/register/resend-email", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { email, operation });

      return res(ctx.json(successResponse));
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
    rest.post("*/user-api/register/resend-email", async (req, res, ctx) => {
      t.is(req.headers.get("X-Custom"), "1");

      return res(ctx.json(successResponse));
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
    rest.post("*/custom/register/resend-email", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
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
    rest.post("*/custom/register/resend-email", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
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
    rest.post("*/user-api/register/resend-email", async (_req, res, ctx) =>
      res(ctx.status(400)),
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
    rest.post("*/user-api/cancel-account/init", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      return res(ctx.json(successResponse));
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
    rest.post("*/user-api/cancel-account/init", async (req, res, ctx) => {
      t.is(req.headers.get("X-Custom"), "1");

      return res(ctx.json(successResponse));
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
    rest.post("*/custom/cancel-account/init", async (req, res, ctx) =>
      res(ctx.json(successResponse)),
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
    rest.post("*/custom/cancel-account/init", async (req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.initAccountCancel();

  t.assert(result.ok);
});

test.serial("Handle error while init cancel account", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.post("*/user-api/cancel-account/init", async (req, res, ctx) =>
      res(ctx.status(400)),
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
    rest.post("*/user-api/cancel-account", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      return res(ctx.json(successResponse));
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
    rest.post("*/user-api/cancel-account", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      return res(ctx.json(successResponse));
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
    rest.post("*/custom/cancel-account", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.cancelAccount();

  t.assert(result.ok);
});

test.serial("Handle error while cancel account", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.post("*/user-api/cancel-account", async (_req, res, ctx) =>
      res(ctx.status(400)),
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
    rest.post("*/user-api/set-password/init", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { email });

      return res(ctx.json(successResponse));
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
    rest.post("*/user-api/set-password/init", async (req, res, ctx) => {
      t.is(req.headers.get("X-Custom"), "1");

      return res(ctx.json(successResponse));
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
    rest.post("*/custom/set-password/init", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
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
    rest.post("*/custom/set-password/init", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.resetPassword(email);

  t.assert(result.ok);
});

test.serial("Handle error while init set password", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/set-password/init", async (_req, res, ctx) =>
      res(ctx.status(400)),
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
    rest.post("*/user-api/set-password", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { newPassword });

      return res(ctx.json(successResponse));
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
    rest.post("*/user-api/set-password", async (req, res, ctx) => {
      t.is(req.headers.get("X-Custom"), "1");

      return res(ctx.json(successResponse));
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
    rest.post("*/custom/set-password", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
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
    rest.post("*/custom/set-password", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.updatePassword(newPassword);

  t.assert(result.ok);
});

test.serial("Handle error while set password", async (t) => {
  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    rest.post("*/user-api/set-password", async (_req, res, ctx) =>
      res(ctx.status(400)),
    ),
  );

  const result = await drupalkit.userApi.setPassword(newPassword);

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
    rest.post("*/user-api/passwordless-login", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { email });

      return res(ctx.json(successResponse));
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
    rest.post("*/user-api/passwordless-login", async (req, res, ctx) => {
      t.is(req.headers.get("X-Custom"), "1");

      return res(ctx.json(successResponse));
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
    rest.post("*/custom/passwordless-login", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.passwordlessLogin(email);

  t.assert(result.ok);
});

test.serial("Handle error while passwordless login", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/passwordless-login", async (_req, res, ctx) =>
      res(ctx.status(400)),
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
    rest.post("*/user-api/set-email/init", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { email });

      return res(ctx.json(successResponse));
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
    rest.post("*/user-api/set-email/init", async (req, res, ctx) => {
      t.is(req.headers.get("X-Custom"), "1");

      return res(ctx.json(successResponse));
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
    rest.post("*/custom/set-email/init", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
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
    rest.post("*/custom/set-email/init", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.verifyEmail(email);

  t.assert(result.ok);
});

test.serial("Handle error while init set email", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/set-email/init", async (_req, res, ctx) =>
      res(ctx.status(400)),
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
    rest.post("*/user-api/set-email", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { email });

      return res(ctx.json(successResponse));
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
    rest.post("*/user-api/set-email", async (req, res, ctx) => {
      t.is(req.headers.get("X-Custom"), "1");

      return res(ctx.json(successResponse));
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
    rest.post("*/custom/set-email", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
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
    rest.post("*/custom/set-email", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.updateEmail(email);

  t.assert(result.ok);
});

test.serial("Handle error while set email", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/set-email", async (_req, res, ctx) =>
      res(ctx.status(400)),
    ),
  );

  const result = await drupalkit.userApi.setEmail(email);

  t.assert(result.err);
});
