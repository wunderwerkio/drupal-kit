import { JsonApiResource } from "../dist/index.js";

interface UserResource extends JsonApiResource {
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
