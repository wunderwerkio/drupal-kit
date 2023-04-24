import { Relationship, ResourceObject } from "ts-json-api";

interface UserResource extends ResourceObject {
  type: "user--user";
  attributes: {
    created: string;
    changed: string;
  };
}

export interface NodeArticleResource extends ResourceObject {
  type: "node--article";
  attributes: {
    title: string;
  };
  relationships: {
    uid: Relationship<UserResource>;
  };
}

declare module "../src/resources.js" {
  interface JsonApiResources {
    "node--article": {
      resource: NodeArticleResource;
      operations: "readSingle" | "readMany" | "create" | "update" | "delete";
    };
    "node--readonly": {
      resource: NodeArticleResource;
      operations: "readSingle" | "readMany";
    };
  }
}
