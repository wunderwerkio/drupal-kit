import * as DrupalkitTypes from "@drupalkit/types";

export type RequestErrorOptions = {
  response?: DrupalkitTypes.DrupalkitResponse<unknown>;
  request: DrupalkitTypes.RequestOptions;
};
