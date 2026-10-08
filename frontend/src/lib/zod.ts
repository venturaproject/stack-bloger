import { match } from "ts-pattern"
import { z } from "zod"

const _emptyStringToUndefined = z.literal("").transform(() => undefined)

export const asOptional = <T>(schema: z.ZodType<T>) =>
  schema.optional().or(_emptyStringToUndefined)

export const zodErrorMap: z.ZodErrorMap = (issue) => {
  const NAN: string = "nan"
  const NULL: string = "null"
  const UNDEFINED: string = "undefined"
  const REQUIRED_ERROR_MESSAGE: string = "This field is required."

  let message: string | undefined = match(issue)
    .with({ code: "invalid_enum_value" }, (i) => {
      if (!i.received) return REQUIRED_ERROR_MESSAGE
      return undefined
    })
    .with({ code: "invalid_string" }, (i) => {
      if (i.validation === "email") return "Please input a valid email address."
      if (i.validation === "url") return "Please input a valid URL."
      return undefined
    })
    .with({ code: "invalid_type" }, (i) => {
      const received = (i as { received?: string }).received
      if (received === NAN || received === NULL || received === UNDEFINED) {
        return REQUIRED_ERROR_MESSAGE
      }
      return undefined
    })
    .with({ code: "too_small" }, (_i) => {
      return undefined
    })
    .otherwise(() => undefined)

  const defaultMsg = issue.message ?? "Invalid value."
  message = message ?? defaultMsg
  message = message.endsWith(".") ? message : `${message}.`

  return { message }
}

export { z }
