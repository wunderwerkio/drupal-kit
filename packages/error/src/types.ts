import * as DrupalkitTypes from "@drupal-kit/types";

export type RequestErrorOptions = {
  response?: DrupalkitTypes.DrupalkitResponse<unknown>;
  request: DrupalkitTypes.RequestRequestOptions;
};
