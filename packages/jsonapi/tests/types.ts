import { JsonApiResource } from "../dist/index.js";

export interface UserResource extends JsonApiResource {
  type: "user--user";
  attributes: {
    created: string;
    changed: string;
  };
}

export interface FileResource extends JsonApiResource {
  type: "file--file";
  attributes: {
    drupal_internal__fid: number;
    langcode: string;
    filename: string;
    uri: {
      value: string;
      url: string;
    };
    filemime: string;
    filesize: number;
    status: boolean;
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

export interface NodeWithFileResource extends JsonApiResource {
  type: "node--with-file";
  attributes: {
    title: string;
  };
  relationships: {
    uid: UserResource;
    field_image: FileResource;
    field_attachments: FileResource[];
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
    "node--with-file": {
      resource: NodeWithFileResource;
      operations: "readSingle" | "readMany" | "create" | "update" | "delete";
    };
    "file--file": {
      resource: FileResource;
      operations: "readSingle" | "readMany";
    };
  }
}
