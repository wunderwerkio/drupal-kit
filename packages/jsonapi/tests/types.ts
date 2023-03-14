import { Relationship, ResourceObject } from "ts-json-api";

interface UserResource extends ResourceObject {
  type: "user--user";
  attributes: {
    created: string;
    changed: string;
  };
}

interface NodeArticleResource extends ResourceObject {
  type: "node--article";
  attributes: {
    langcode: string;
    status: boolean;
    title: string;
  };
  relationshipts: {
    uid: Relationship<UserResource>;
  };
}

declare module "../src/index" {
  interface JsonApiResources {
    "node--article": {
      resource: NodeArticleResource;
      operations: "readSingle" | "readMany" | "create" | "update" | "delete";
    };
  }
}
