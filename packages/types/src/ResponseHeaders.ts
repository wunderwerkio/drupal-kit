/**
 * Define common response headers.
 */
export type ResponseHeaders = {
  "cache-control"?: string;
  "content-length"?: number;
  "content-type"?: string;
  date?: string;
  etag?: string;
  "last-modified"?: string;
  location?: string;
  server?: string;
  vary?: string;
  "x-drupal-cache"?: string;
  "x-drupal-cache-contexts"?: string;
  "x-drupal-cache-max-age"?: number;
  "x-drupal-cache-tags"?: string;
  "x-drupal-dynamic-cache"?: string;

  [header: string]: string | number | undefined;
};
