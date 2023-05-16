import { Relationship, ResourceObject } from "ts-json-api";

import { SimplifiedResourceObject } from "../src/index.js";

interface UserResource extends ResourceObject {
  type: "user--user";
  attributes: {
    created: string;
    changed: string;
  };
}
type SimplifiedUserResource = SimplifiedResourceObject<UserResource, {}>;

export interface NodeArticleResource extends ResourceObject {
  type: "node--article";
  attributes: {
    title: string;
  };
  relationships: {
    uid: Relationship<UserResource>;
  };
}
export type SimplifiedNodeArticleResource = SimplifiedResourceObject<
  NodeArticleResource,
  {
    uid: SimplifiedUserResource;
  }
>;

declare module "../src/resources.js" {
  interface JsonApiResources {
    "node--article": {
      resource: NodeArticleResource;
      simplifiedResource: SimplifiedNodeArticleResource;
      operations: "readSingle" | "readMany" | "create" | "update" | "delete";
    };
    "node--readonly": {
      resource: NodeArticleResource;
      simplifiedResource: SimplifiedNodeArticleResource;
      operations: "readSingle" | "readMany";
    };
  }
}
