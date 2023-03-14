export type DrupalkitError = {
  name: string;
  status: number;
  errors?: Array<{
    resource: string;
    code: string;
    field: string;
    message?: string;
  }>;
};
