import test from "ava";

import { isJsonApiRequest, sanitizeFilename } from "../src/utils.js";

test("Check if JSON:API request", (t) => {
  t.falsy(
    isJsonApiRequest({
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    }),
  );

  t.truthy(
    isJsonApiRequest({
      method: "GET",
      headers: {
        "Content-type": "application/vnd.api+json",
      },
    }),
  );
});

test("sanitizeFilename - passes normal filename through", (t) => {
  t.is(sanitizeFilename("test.jpg"), "test.jpg");
  t.is(sanitizeFilename("my-file.pdf"), "my-file.pdf");
  t.is(sanitizeFilename("document_v2.docx"), "document_v2.docx");
});

test("sanitizeFilename - transliterates German umlauts", (t) => {
  t.is(sanitizeFilename("über.jpg"), "ueber.jpg");
  t.is(sanitizeFilename("Müller.pdf"), "Mueller.pdf");
  t.is(sanitizeFilename("größe.txt"), "groesse.txt");
  t.is(sanitizeFilename("Äpfel.png"), "Aepfel.png");
});

test("sanitizeFilename - removes diacritics", (t) => {
  t.is(sanitizeFilename("café.jpg"), "cafe.jpg");
  t.is(sanitizeFilename("naïve.pdf"), "naive.pdf");
  t.is(sanitizeFilename("résumé.docx"), "resume.docx");
});

test("sanitizeFilename - removes illegal characters", (t) => {
  t.is(sanitizeFilename("file?.jpg"), "file.jpg");
  t.is(sanitizeFilename("file<name>.pdf"), "filename.pdf");
  t.is(sanitizeFilename('file"name.txt'), "filename.txt");
  t.is(sanitizeFilename("file:name.png"), "filename.png");
  t.is(sanitizeFilename("file|name.jpg"), "filename.jpg");
  t.is(sanitizeFilename("file*name.pdf"), "filename.pdf");
});

test("sanitizeFilename - handles Windows reserved names", (t) => {
  t.is(sanitizeFilename("con.txt"), "file.txt");
  t.is(sanitizeFilename("PRN.pdf"), "file.pdf");
  t.is(sanitizeFilename("aux.jpg"), "file.jpg");
  t.is(sanitizeFilename("NUL.png"), "file.png");
  t.is(sanitizeFilename("COM1.txt"), "file.txt");
  t.is(sanitizeFilename("lpt2.pdf"), "file.pdf");
});

test("sanitizeFilename - handles edge cases", (t) => {
  t.is(sanitizeFilename(".."), "file");
  t.is(sanitizeFilename("..."), "file");
  t.is(sanitizeFilename("file."), "file");
  t.is(sanitizeFilename(""), "file");
});

test("sanitizeFilename - preserves extension", (t) => {
  t.is(sanitizeFilename("über-größe.jpeg"), "ueber-groesse.jpeg");
  t.is(sanitizeFilename("my.file.name.pdf"), "my.file.name.pdf");
});
