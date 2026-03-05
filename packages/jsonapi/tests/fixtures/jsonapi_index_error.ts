const JsonApiIndexError = {
  jsonapi: {
    version: "1.0",
    meta: {
      links: {
        self: {
          href: "http://jsonapi.org/format/1.0/",
        },
      },
    },
  },
  errros: [
    {
      title: "Error",
      status: "500",
    },
  ],
} as const;

export default JsonApiIndexError;
