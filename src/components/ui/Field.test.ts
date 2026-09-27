import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Field } from "./Field";

it("associates a hint with its input", () => {
  const html = renderToStaticMarkup(Field({ label: "Email", htmlFor: "email", hint: "A valid address", children: createElement("input", { id: "email" }) }));
  expect(html).toContain('aria-describedby="email-hint"');
  expect(html).toContain('id="email-hint"');
});

it("associates and announces an error, even with another child element", () => {
  const html = renderToStaticMarkup(Field({
    label: "Storage", htmlFor: "storage", error: "Storage is required.",
    children: [createElement("input", { id: "storage", key: "input" }), createElement("datalist", { id: "options", key: "list" })],
  }));
  expect(html).toContain('aria-describedby="storage-error"');
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('id="storage-error"');
  expect(html).toContain('role="alert"');
});
