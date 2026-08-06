import { router } from "./implementation";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"

const generator = new OpenAPIGenerator({
  schemaConverters: [
    new ZodToJsonSchemaConverter()
  ],
});

export const openApiDocument = await generator.generate(router, {
  info: {
    title: "PreSonus StudioLive MIDI Integration",
    version: "1.0.0",
    description: "API documentation for the PreSonus StudioLive MIDI server",
  },
});
