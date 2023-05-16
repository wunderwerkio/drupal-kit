import "./types.js";
import { Response, Relationship, ResourceObject } from "ts-json-api";
import { Drupalkit } from "@drupal-kit/core";

import {
  DrupalkitJsonApi,
  JsonApiResources,
  SimplifiedResourceObject,
} from "../src/index.js";
import { NodeArticleResource, SimplifiedNodeArticleResource } from "./types.js";

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

async function testSimplifiedResourceObject() {
  interface EmbeddedResourceOne extends ResourceObject {
    type: "embedded--one";
    attributes: {
      embedded: boolean;
    };
  }
  type SimplifiedEmbeddedResourceOne = SimplifiedResourceObject<
    EmbeddedResourceOne,
    {}
  >;

  interface EmbeddedResourceTwo extends ResourceObject {
    type: "embedded--two";
    attributes: {
      first: string;
      second: number;
    };
    relationships: {
      field_embedded: Relationship<EmbeddedResourceOne>;
    };
  }
  type SimplifiedEmbeddedResourceTwo = SimplifiedResourceObject<
    EmbeddedResourceTwo,
    {
      field_embedded: SimplifiedEmbeddedResourceOne;
    }
  >;

  interface DemoResource extends ResourceObject {
    type: "demo--demo";
    attributes: {
      attrOne: string;
      attrTwo: boolean;
    };
    relationships: {
      field_content: Relationship<
        (EmbeddedResourceOne | EmbeddedResourceTwo)[]
      >;
      field_direct: Relationship<EmbeddedResourceTwo>;
    };
    links: {
      self: string;
      other: string;
    };
    meta: {
      metaOne: string;
      metaTwo: boolean;
    };
  }
  type SimplifiedDemoResource = SimplifiedResourceObject<
    DemoResource,
    {
      field_content: (
        | SimplifiedEmbeddedResourceOne
        | SimplifiedEmbeddedResourceTwo
      )[];
      field_direct: SimplifiedEmbeddedResourceTwo;
    }
  >;

  // Check that the object for included data is not empty,
  // if relations are defined for the resource object.
  type CheckIncludedTypeExistence = SimplifiedResourceObject<
    EmbeddedResourceTwo,
    // @ts-expect-error
    {}
  >;

  // Check that the object for included data has the correct type
  // if relations are defined for the resource object.
  type CheckIncludedType = SimplifiedResourceObject<
    EmbeddedResourceTwo,
    // @ts-expect-error
    {
      field_embedded: string;
    }
  >;

  // @ts-expect-error
  const test: SimplifiedDemoResource = {};

  // Attributes must be at top of hierarchy.
  test.attrOne;
  test.attrTwo;

  // Links must must be in links property.
  test.links.self;
  test.links.other;

  // Meta must be in resourceIdObjMeta property.
  test.resourceIdObjMeta.metaOne;
  test.resourceIdObjMeta.metaTwo;

  // Check base fields.
  test.id;
  test.type;

  // Test included data.
  test.field_direct.type;

  // field_direct > EmbeddedResourceTwo > field_embedded > EmbeddedResourceOne > id.
  test.field_direct.field_embedded.id;

  // Check multiple references.
  test.field_content.forEach((item) => {
    // Check for embedded--one resource.
    if (item.type === "embedded--one") {
      item.embedded;
    }

    if (item.type === "embedded--two") {
      item.first;
      item.field_embedded.embedded;
    }
  });

  // Test method.
  const drupalkit = createDrupalkit();
  const uuid = "0c9b2d1b-1c6a-4e0a-9f7b-4b6b8d6b8f6d";

  const res = (await drupalkit.jsonApi.resource("node--article", "readSingle", {
    uuid,
  })).unwrap() as Response<NodeArticleResource>;

  const simplifiedRes = drupalkit.jsonApi.simplifyResourceResponse("node--article", res);

  expectType<SimplifiedNodeArticleResource>(simplifiedRes);

  // Test read many.
  const resMany = (await drupalkit.jsonApi.resource("node--article", "readMany", {})).unwrap() as Response<NodeArticleResource[]>;

  const simplifiedResMany = drupalkit.jsonApi.simplifyResourceResponse("node--article", resMany);

  expectType<SimplifiedNodeArticleResource[]>(simplifiedResMany);
}

/**
 * Asserts that the type of `expression` is identical to type `T`.
 *
 * @param expression - Expression that should be identical to type `T`.
 */
export const expectType = <T>(expression: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};
