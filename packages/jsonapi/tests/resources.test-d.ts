import "./types.js";
import type { Result } from "@wunderwerk/ts-functional/results";
import { Drupalkit } from "@drupal-kit/core";

import { DrupalkitJsonApi, JsonApiResources } from "../src/index.js";
import { NodeArticleResource } from "./types.js";

const BASE_URL = "https://my-drupal.com";

const createDrupalkit = ({ baseUrl = BASE_URL }: { baseUrl?: string } = {}) => {
  const EnhancedDrupalkit = Drupalkit.plugin(DrupalkitJsonApi);

  return new EnhancedDrupalkit({
    baseUrl,
    locale: "de",
    defaultLocale: "de",
  });
};

function testModuleAugmentation() {
  const drupalkit = createDrupalkit();
  const uuid = "0c9b2d1b-1c6a-4e0a-9f7b-4b6b8d6b8f6d";

  expectType<keyof JsonApiResources>("node--article");
  expectType<keyof JsonApiResources>("node--readonly");

  // This should not generate type script errors if
  // the module augmentation in "./types" works.
  drupalkit.jsonApi.resource("node--article", "readSingle", {
    uuid,
  });

  // TypeScript should complain about invalid type.
  // @ts-expect-error
  drupalkit.jsonApi.resource("node--invalid", "readSingle", {
    uuid,
  });

  // TypeScript should complain about invalid operation.
  // @ts-expect-error
  drupalkit.jsonApi.resource("node--readonly", "delete", {
    uuid,
  });
}

async function testReturnTypeValues() {
  const drupalkit = createDrupalkit();
  const uuid = "0c9b2d1b-1c6a-4e0a-9f7b-4b6b8d6b8f6d";

  // Read Single.

  const readSingleData = (
    await drupalkit.jsonApi.resource("node--article", "readSingle", {
      uuid,
    })
  ).unwrap();

  expectType<NodeArticleResource>(readSingleData.data!);

  // Read Many.

  const readManyData = (
    await drupalkit.jsonApi.resource("node--article", "readMany", {})
  ).unwrap();

  expectType<NodeArticleResource[]>(readManyData.data!);

  // Create.

  const createData = (
    await drupalkit.jsonApi.resource("node--article", "create", {
      // @ts-ignore
      payload: {},
    })
  ).unwrap();

  expectType<NodeArticleResource>(createData.data!);

  // Update.

  const updateData = (
    await drupalkit.jsonApi.resource("node--article", "update", {
      uuid,
      // @ts-ignore
      payload: {},
    })
  ).unwrap();

  expectType<NodeArticleResource>(updateData.data!);

  // Delete.

  const deleteData = (
    await drupalkit.jsonApi.resource("node--article", "delete", {
      uuid,
    })
  ).unwrap();

  expectType<true>(deleteData);
}

async function testPayloadTypes() {
  const drupalkit = createDrupalkit();
  const uuid = "0c9b2d1b-1c6a-4e0a-9f7b-4b6b8d6b8f6d";

  // Create.

  // Do not allow empty payload.
  drupalkit.jsonApi.resource("node--article", "create", {
    uuid,
    // @ts-expect-error
    payload: undefined,
  });

  drupalkit.jsonApi.resource("node--article", "create", {
    uuid,
    payload: {
      id: uuid,
      attributes: {
        title: "Updated title",
      },
    },
  });

  // Update.

  // Do not allow empty payload.
  drupalkit.jsonApi.resource("node--article", "update", {
    uuid,
    // @ts-expect-error
    payload: undefined,
  });

  drupalkit.jsonApi.resource("node--article", "update", {
    uuid,
    payload: {},
  });
}

/**
 * Asserts that the type of `expression` is identical to type `T`.
 *
 * @param expression - Expression that should be identical to type `T`.
 */
export const expectType = <T>(expression: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};
