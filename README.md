## Plugins

### JSON:API

This plugin integrates with the built-in `jsonapi` drupal core module.

**Features:**

- [x] JSON:API Index
- [x] `GET` single JSON:API resource
- [x] `GET` multiple JSON:API resources
- [x] `POST` JSON:API resource
- [x] `PATCH` JSON:API resource
- [x] `DELETE` JSON:API resource
- [x] Localization
- [x] Query Parameters

**Typescript:**

The JSON:API resources are strongly typed via the `JsonApiResources` interface.
This interface MUST be augmented in your code in order for TypeScript to infer the
correct types for the `Drupalkit.jsonapi.resource()` method.

### Simple OAuth

This plugin integrates with the [`simple_oauth`](https://www.drupal.org/project/simple_oauth) drupal module.

**Features:**

- [x] `/oauth/token` endpoint
- [x] `/oauth/userinfo` endpoint
- [ ] `/oauth/authorize` endpoint
- [ ] `/oauth/jwks` endpoint

### Simple OAuth Auth Code

This plugin integrates with the `simple_oauth_auth_code` drupal module.

**Features:**

- [x] `/simple-oauth/auth-code` endpoint

### Consumers

This plugin integrates with the [`consumers`](https://www.drupal.org/project/consumers) drupal module.

**Features:**

- [x] Set `X-Consumer-ID` header

### Verification

This plugin integrates with the `verification` drupal module.

It is meant to be used by endpoints which require verification.

**Features:**

- [x] Hash based verification
- [x] Magic-Code based verification (via the `magic_code` drupal module)

### User-Api

This plugin integrates with the `user_api` drupal module.

**Features:**

- [x] `/user-api/register` endpoint
- [x] `/user-api/init-account-cancel` endpoint
- [x] `/user-api/cancel-account` endpoint
- [x] `/user-api/reset-password` endpoint
- [x] `/user-api/update-password` endpoint
- [x] `/user-api/passwordless-login` endpoint
- [x] `/user-api/verify-email` endpoint
- [x] `/user-api/update-email` endpoint
