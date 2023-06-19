import { JsonApiResource } from "../dist/index.js";

export interface UserResource extends JsonApiResource {
  type: "user--user";
  attributes: {
    created: string;
    changed: string;
  };
}

export interface NodeArticleResource extends JsonApiResource {
  type: "node--article";
  attributes: {
    title: string;
  };
  relationships: {
    uid: UserResource;
  };
}

export interface NodeUnionRelResource extends JsonApiResource {
  type: "node--union-rel";
  attributes: {
    title: string;
  };
  relationships: {
    union: NodeArticleResource | UserResource;
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
    "node--union-rel": {
      resource: NodeUnionRelResource;
      operations: "readSingle" | "readMany";
    };
  }
}
