# Drupal Kit

A modular and strictly typed Drupal SDK for Node.JS and the browser with an extensive plugin and hook system.

## Main Goal

The main goal of this project is to provide you with the building blocks (or a "kit" of tools) to build your very own specialized Drupal API client. Hence the name "Drupal Kit".

Drupal Kit consists of a `core` package that implements the bare minimum.  
Plugin packages then implement specific functionality.

This concept makes Drupal Kit suitable for any project that needs to access the Drupal API, wheter 
it is a Drupal site itself that is progressively decoupling or a full fledged decoupled drupal site.

## Installation

Install the core package:

```sh
npm install @drupal-kit/core
```

Install additional plugins depending on your use-case.
[See plugins here](#plugins)

## Hooks

A core feature of Drupal Kit is it's hook system, thanks to [before-after-hook](https://github.com/gr2m/before-after-hook).
This hook system makes it possible to register custom hooks before and after the target function is executed.

### `request` hook

The `request` hook is used to register custom hooks before and after the `request` function is executed.

```typescript

const drupalkit = createDrupalKitSomehow().

// Add custom header to each request. 
drupalkit.hook.before('request', async (requestOptions) => {
  requestOptions.headers['X-Custom-Header'] = 'Value';
});

// Log successful response status codes.
drupalkit.hook.after('request', async (response, requestOptions) => {
  console.log("Successful response: " + response.status);
});

// Alternative way to register custom hooks.
drupalkit.hook.wrap('request', async (requestFunc, requestOptions) => {
  requestOptions.headers['X-Custom-Header'] = 'Value';

  const result = await requestFunc(requestOptions);

  console.log("Successful response: " + response.status);

  return result;
});

// Wrap enables us to re-run the request.
drupalkit.hook.wrap('request', async (requestFunc, requestOptions) => {
  try {
    return await requestFunc(requestOptions);
  } catch (error) {
    // Do something to alter request, e.g. renew access token.

    // Re-run the request here.
    return await requestFunc(requestOptions);
  }
});

// When the request errors.
drupalkit.hook.error('request', async (error) => {
  // Throw custom error here.

  throw error;
})
```

## Plugins

The Drupal Kit class can be extended by plugins.

```typescript
import { Drupalkit } from "@drupal-kit/core"
import { DrupalkitJsonApi } from "@drupal-kit/jsonapi";
import { DrupalkitUserApi } from "@drupal-kit/user-api";

// Create your very own Drupal Kit class that is
// extended by all of the registered plugins.
const EnhancedDrupalkit = Drupalkit.plugin(
  DrupalkitJsonApi,
  DrupalkitUserApi,
);

// Create a Drupal Kit instance.
const drupalkit = new EnhancedDrupalkit();
```

A plugin is just a function that takes the core `Drupalkit` and the `DrupalkitOptions` as arguments.
It may return an object that is than merged with the core `Drupalkit` class to extend it.

**Drupal Kit is meant to be extended by you!**

List of built-in plugins:

- [`@drupal-kit/jsonapi`](#json:api)
- [`@drupal-kit/simple-oauth`](#simple-oauth)
- [`@drupal-kit/simple-oauth-auth-code`](#simple-oauth-auth-code)
- [`@drupal-kit/consumers`](#consumers)
- [`@drupal-kit/verification`](#verification)
- [`@drupal-kit/user-api`](#user-api)

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
