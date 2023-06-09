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

test.serial("Register with explicit endpoint", async (t) => {
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

test.serial("Init account cancel", async (t) => {
  t.plan(2);

  const drupalkit = createDrupalkit();

  server.use(
    rest.post("*/user-api/init-account-cancel", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      return res(ctx.json(successResponse));
    }),
  );

  const result = await drupalkit.userApi.initAccountCancel();

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Init account cancel with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiInitAccountCancelEndpoint: "/custom/init-account-cancel",
  });

  server.use(
    rest.post("*/custom/init-account-cancel", async (req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.initAccountCancel();

  t.assert(result.ok);
});

test.serial("Handle error while init account cancel", async (t) => {
  const drupalkit = createDrupalkit();

  server.use(
    rest.post("*/user-api/init-account-cancel", async (req, res, ctx) =>
      res(ctx.status(400)),
    ),
  );

  const result = await drupalkit.userApi.initAccountCancel();

  t.assert(result.err);
});

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
 * Reset password
 */

test.serial("Reset password", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/reset-password", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { email });

      return res(ctx.json(successResponse));
    }),
  );

  const result = await drupalkit.userApi.resetPassword(email);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Reset password with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiResetPasswordEndpoint: "/custom/reset-password",
  });
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/custom/reset-password", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.resetPassword(email);

  t.assert(result.ok);
});

test.serial("Handle error while resetting password", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/reset-password", async (_req, res, ctx) =>
      res(ctx.status(400)),
    ),
  );

  const result = await drupalkit.userApi.resetPassword(email);

  t.assert(result.err);
});

/**
 * Update password
 */

test.serial("Update password", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    rest.post("*/user-api/update-password", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { newPassword });

      return res(ctx.json(successResponse));
    }),
  );

  const result = await drupalkit.userApi.updatePassword(newPassword);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Update password with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiUpdatePasswordEndpoint: "/custom/update-password",
  });
  const newPassword = "new-password";

  server.use(
    rest.post("*/custom/update-password", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.updatePassword(newPassword);

  t.assert(result.ok);
});

test.serial("Handle error while updating password", async (t) => {
  const drupalkit = createDrupalkit();
  const newPassword = "new-password";

  server.use(
    rest.post("*/user-api/update-password", async (_req, res, ctx) =>
      res(ctx.status(400)),
    ),
  );

  const result = await drupalkit.userApi.updatePassword(newPassword);

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
 * Verify email
 */

test.serial("Verify email", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/verify-email", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { email });

      return res(ctx.json(successResponse));
    }),
  );

  const result = await drupalkit.userApi.verifyEmail(email);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Verify email with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiVerifyEmailEndpoint: "/custom/verify-email",
  });
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/custom/verify-email", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.verifyEmail(email);

  t.assert(result.ok);
});

test.serial("Handle error while verifying email", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/verify-email", async (_req, res, ctx) =>
      res(ctx.status(400)),
    ),
  );

  const result = await drupalkit.userApi.verifyEmail(email);

  t.assert(result.err);
});

/**
 * Update email
 */

test.serial("Update email", async (t) => {
  t.plan(3);

  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/update-email", async (req, res, ctx) => {
      t.is(req.headers.get("content-type"), "application/json");

      t.deepEqual(await req.json(), { email });

      return res(ctx.json(successResponse));
    }),
  );

  const result = await drupalkit.userApi.updateEmail(email);

  const res = result.unwrap();

  t.deepEqual(res, successResponse);
});

test.serial("Update email with custom endpoint", async (t) => {
  const drupalkit = createDrupalkit({
    baseUrl: BASE_URL,
    userApiUpdateEmailEndpoint: "/custom/update-email",
  });
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/custom/update-email", async (_req, res, ctx) =>
      res(ctx.json(successResponse)),
    ),
  );

  const result = await drupalkit.userApi.updateEmail(email);

  t.assert(result.ok);
});

test.serial("Handle error while updating email", async (t) => {
  const drupalkit = createDrupalkit();
  const email = "JzWZg@example.com";

  server.use(
    rest.post("*/user-api/update-email", async (_req, res, ctx) =>
      res(ctx.status(400)),
    ),
  );

  const result = await drupalkit.userApi.updateEmail(email);

  t.assert(result.err);
});
