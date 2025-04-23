import { Drupalkit } from "@drupal-kit/core";

const BASE_URL = "https://my-drupal.com";

/**
 * Test with no error type.
 */
async function testNoErrorTypeArgument() {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request<{ success: boolean }>(
    "/demo-endpoint",
    {
      method: "GET",
    },
  );

  const err = result.expectErr("must be error");

  // @ts-expect-error firstError MUST NOT be definitively defined.
  console.log(err.firstError.code);

  // @ts-expect-error Code is `never`, due to no type argument.
  err.getErrorByCode("some_code");

  // Would never match in runtime.
  if (err.isJsonApiError()) {
    // @ts-expect-error firstError is of type never!
    console.log(err.firstError.code);
  }

  const jsonApiError = err.toJsonApiError();

  // Only the generic error is definitively defined.
  if (jsonApiError.code === "drupalkit_error") {
  }

  // @ts-expect-error Ensure code is not just a `string`.
  if (jsonApiError.code === "access_denied") {
  }
}

/**
 * Test with incompatible error type.
 *
 * Should behave as if no error type was provided, due to
 * no properties are in common with the JSON:API error type.
 */
async function testNonCompatibleErrorType() {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request<
    { success: boolean },
    {
      wrong_prop_one: "error-code";
      wrong_title: "some title";
    }
  >("/demo-endpoint", {
    method: "GET",
  });

  const err = result.expectErr("must be error");

  // @ts-expect-error firstError MUST NOT be definitively defined.
  console.log(err.firstError.code);

  // @ts-expect-error Code is `never`, due to no type argument.
  err.getErrorByCode("some_code");

  // Would never match in runtime.
  if (err.isJsonApiError()) {
    // @ts-expect-error firstError is of type never!
    console.log(err.firstError.code);
  }

  const jsonApiError = err.toJsonApiError();

  // Only the generic error is definitively defined.
  if (jsonApiError.code === "drupalkit_error") {
  }

  // @ts-expect-error Ensure code is not just a `string`.
  if (jsonApiError.code === "access_denied") {
  }
}

/**
 * Test with semi-incompatible error type.
 *
 * Only the code is in common with the JSON:API error type,
 * other properties are stripped.
 */
async function testSemiCompatibleErrorType() {
  const drupalkit = new Drupalkit({
    baseUrl: BASE_URL,
  });

  const result = await drupalkit.request<
    { success: boolean },
    {
      code: "error-code";
      wrong_title: "some title";
    }
  >("/demo-endpoint", {
    method: "GET",
  });

  const err = result.expectErr("must be error");

  // Error can be retrieved by code.
  const errorByCode = err.getErrorByCode("error-code");
  // The non compliant property is still accessible here.
  console.log(errorByCode!.wrong_title);

  // Incompatible properties are only stripped for the
  // jsonapi related methods.

  // Would never match in runtime.
  if (err.isJsonApiError()) {
    // firstError is defined here.
    console.log(err.firstError.code);

    // @todo - this should be an error, but type narrowing
    // with the type guard in isJsonApiError is only creating
    // a intersection type, not a narrowed type.
    console.log(err.firstError.wrong_title);
  }

  const jsonApiError = err.toJsonApiError();

  // Generic error is defined.
  if (jsonApiError.code === "drupalkit_error") {
  }

  // Error code is defined.
  if (jsonApiError.code === "error-code") {
    // @ts-expect-error wrong_title is stripped.
    console.log(jsonApiError.wrong_title);
  }
}
