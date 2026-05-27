import { expect, test } from "vitest";

import { isJsonApiRequest, sanitizeFilename } from "../src/utils.js";

test("Check if JSON:API request", () => {
  expect(
    isJsonApiRequest({
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    }),
  ).toBeFalsy();

  expect(
    isJsonApiRequest({
      method: "GET",
      headers: {
        "Content-type": "application/vnd.api+json",
      },
    }),
  ).toBeTruthy();
});

test("sanitizeFilename - passes normal filename through", () => {
  expect(sanitizeFilename("test.jpg")).toBe("test.jpg");
  expect(sanitizeFilename("my-file.pdf")).toBe("my-file.pdf");
  expect(sanitizeFilename("document_v2.docx")).toBe("document_v2.docx");
});

test("sanitizeFilename - transliterates German umlauts", () => {
  expect(sanitizeFilename("über.jpg")).toBe("ueber.jpg");
  expect(sanitizeFilename("Müller.pdf")).toBe("Mueller.pdf");
  expect(sanitizeFilename("größe.txt")).toBe("groesse.txt");
  expect(sanitizeFilename("Äpfel.png")).toBe("Aepfel.png");
});

test("sanitizeFilename - removes diacritics", () => {
  expect(sanitizeFilename("café.jpg")).toBe("cafe.jpg");
  expect(sanitizeFilename("naïve.pdf")).toBe("naive.pdf");
  expect(sanitizeFilename("résumé.docx")).toBe("resume.docx");
});

test("sanitizeFilename - removes illegal characters", () => {
  expect(sanitizeFilename("file?.jpg")).toBe("file.jpg");
  expect(sanitizeFilename("file<name>.pdf")).toBe("filename.pdf");
  expect(sanitizeFilename('file"name.txt')).toBe("filename.txt");
  expect(sanitizeFilename("file:name.png")).toBe("filename.png");
  expect(sanitizeFilename("file|name.jpg")).toBe("filename.jpg");
  expect(sanitizeFilename("file*name.pdf")).toBe("filename.pdf");
});

test("sanitizeFilename - handles Windows reserved names", () => {
  expect(sanitizeFilename("con.txt")).toBe("file.txt");
  expect(sanitizeFilename("PRN.pdf")).toBe("file.pdf");
  expect(sanitizeFilename("aux.jpg")).toBe("file.jpg");
  expect(sanitizeFilename("NUL.png")).toBe("file.png");
  expect(sanitizeFilename("COM1.txt")).toBe("file.txt");
  expect(sanitizeFilename("lpt2.pdf")).toBe("file.pdf");
});

test("sanitizeFilename - handles edge cases", () => {
  expect(sanitizeFilename("..")).toBe("file");
  expect(sanitizeFilename("...")).toBe("file");
  expect(sanitizeFilename("file.")).toBe("file");
  expect(sanitizeFilename("")).toBe("file");
});

test("sanitizeFilename - preserves extension", () => {
  expect(sanitizeFilename("über-größe.jpeg")).toBe("ueber-groesse.jpeg");
  expect(sanitizeFilename("my.file.name.pdf")).toBe("my.file.name.pdf");
});
