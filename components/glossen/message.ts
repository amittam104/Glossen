import type { UIMessage } from "ai"
import { z } from "zod"

export const passageSchema = z.object({
  title: z.string(),
  url: z.string(),
  text: z.string(),
  heading: z.string().optional(),
})

export const pageSchema = z.object({
  title: z.string(),
  url: z.string(),
})

export const sourceSchema = z.object({
  title: z.string(),
  url: z.string(),
})

export const glossenDataSchemas = {
  passage: passageSchema,
  page: pageSchema,
  sources: z.array(sourceSchema),
}

export const glossenMetadataSchema = z
  .object({
    finishReason: z.string().optional(),
  })
  .optional()

export type Passage = z.infer<typeof passageSchema>
export type PageContext = z.infer<typeof pageSchema>
export type Source = z.infer<typeof sourceSchema>

export type GlossenMetadata = z.infer<typeof glossenMetadataSchema>

export type GlossenDataParts = {
  passage: Passage
  page: PageContext
  sources: Source[]
}

export type GlossenUIMessage = UIMessage<GlossenMetadata, GlossenDataParts>

export function getMessageText(message: GlossenUIMessage) {
  return message.parts
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n")
}

export function getMessagePassages(message: GlossenUIMessage) {
  return message.parts.flatMap((part) =>
    part.type === "data-passage" ? [part.data] : []
  )
}

export function getMessagePage(message: GlossenUIMessage) {
  for (const part of message.parts) {
    if (part.type === "data-page") return part.data
  }
}

export function getMessageSources(message: GlossenUIMessage) {
  for (const part of message.parts) {
    if (part.type === "data-sources") return part.data
  }
  return []
}

export function createUserParts({
  text,
  passages,
  page,
}: {
  text: string
  passages: Passage[]
  page?: PageContext | null
}): GlossenUIMessage["parts"] {
  return [
    ...(page ? [{ type: "data-page" as const, data: page }] : []),
    ...passages.map((data) => ({ type: "data-passage" as const, data })),
    { type: "text" as const, text },
  ]
}
