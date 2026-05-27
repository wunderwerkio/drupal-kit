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

export type JsonApiError = {
  code?: string;
  title?: string;
  status?: string;
  detail?: string;
  source?: {
    pointer?: string;
  };
  meta?: Record<string, unknown>;
};
