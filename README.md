## Plugins

### JSON:API

This plugin integrates with the built-in `jsonapi` drupal core module.

**Features:**
  - [X] JSON:API Index
  - [X] `GET` single JSON:API resource
  - [X] `GET` multiple JSON:API resources
  - [X] `POST` JSON:API resource
  - [X] `PATCH` JSON:API resource
  - [X] `DELETE` JSON:API resource
  - [X] Localization
  - [X] Query Parameters

**Typescript:**

The JSON:API resources are strongly typed via the `JsonApiResources` interface.
This interface MUST be augmented in your code in order for TypeScript to infer the
correct types for the `Drupalkit.jsonapi.resource()` method.

### Simple OAuth

This plugin integrates with the [`simple_oauth`](https://www.drupal.org/project/simple_oauth) drupal module.

**Features:**
  - [X] `/oauth/token` endpoint
  - [X] `/oauth/userinfo` endpoint
  - [ ] `/oauth/authorize` endpoint
  - [ ] `/oauth/jwks` endpoint
