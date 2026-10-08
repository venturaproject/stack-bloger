import type { Content, UseEditorOptions } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { useEditor } from "@tiptap/react"
import { Typography } from "@tiptap/extension-typography"
import { TextStyle } from "@tiptap/extension-text-style"
import { Placeholder, Selection } from "@tiptap/extensions"
import { TextAlign } from "@tiptap/extension-text-align"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { TableKit } from "@tiptap/extension-table"
import { Youtube } from "@tiptap/extension-youtube"
import {
  Image,
  HorizontalRule,
  CodeBlockLowlight,
  Color,
  UnsetAllMarks,
  ResetMarksOnEnter,
  FileHandler,
  Video,
} from "../extensions"
import { cn } from "@/lib/utils"
import { fileToBase64, getOutput, randomId } from "../utils"
import { useThrottle } from "./use-throttle"
import { toast } from "sonner"

export interface UseMinimalTiptapEditorProps extends UseEditorOptions {
  value?: Content
  output?: "html" | "json" | "text"
  placeholder?: string
  editorClassName?: string
  throttleDelay?: number
  onUpdate?: (content: Content) => void
  onBlur?: (content: Content) => void
  uploader?: (file: File) => Promise<string>
}

async function fakeuploader(file: File): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 3000))
  return fileToBase64(file)
}

const createExtensions = ({
  placeholder,
  uploader,
}: {
  placeholder: string
  uploader?: (file: File) => Promise<string>
}) => [
  StarterKit.configure({
    blockquote: { HTMLAttributes: { class: "block-node" } },
    bulletList: { HTMLAttributes: { class: "list-node" } },
    code: { HTMLAttributes: { class: "inline", spellcheck: "false" } },
    codeBlock: false,
    dropcursor: { width: 2, class: "ProseMirror-dropcursor border" },
    heading: { HTMLAttributes: { class: "heading-node" } },
    horizontalRule: false,
    link: {
      openOnClick: false,
      HTMLAttributes: { class: "link" },
    },
    orderedList: { HTMLAttributes: { class: "list-node" } },
    paragraph: { HTMLAttributes: { class: "text-node" } },
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Highlight.configure({ multicolor: true }),
  Subscript,
  Superscript,
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit,
  Youtube.configure({ controls: true, nocookie: true }),
  Video,
  Image.configure({
    allowedMimeTypes: ["image/*"],
    maxFileSize: 5 * 1024 * 1024,
    allowBase64: true,
    uploadFn: async (file) => (uploader ? uploader(file) : fakeuploader(file)),
    onToggle(editor, files, pos) {
      editor.commands.insertContentAt(
        pos,
        files.map((image) => ({
          type: "image",
          attrs: {
            id: randomId(),
            src: URL.createObjectURL(image),
            alt: image.name,
            title: image.name,
            fileName: image.name,
          },
        }))
      )
    },
    onImageRemoved() {},
    onValidationError(errors) {
      errors.forEach((e) => toast.error("Image validation error", { position: "bottom-right", description: e.reason }))
    },
    onActionSuccess({ action }) {
      const mapping = { copyImage: "Copy Image", copyLink: "Copy Link", download: "Download" }
      toast.success(mapping[action], { position: "bottom-right", description: "Image action success" })
    },
    onActionError(error, { action }) {
      const mapping = { copyImage: "Copy Image", copyLink: "Copy Link", download: "Download" }
      toast.error(`Failed to ${mapping[action]}`, { position: "bottom-right", description: error.message })
    },
  }),
  FileHandler.configure({
    allowBase64: true,
    allowedMimeTypes: ["image/*"],
    maxFileSize: 5 * 1024 * 1024,
    onDrop: (editor, files, pos) => {
      files.forEach(async (file) => {
        const src = await fileToBase64(file)
        editor.commands.insertContentAt(pos, { type: "image", attrs: { src } })
      })
    },
    onPaste: (editor, files) => {
      files.forEach(async (file) => {
        const src = await fileToBase64(file)
        editor.commands.insertContent({ type: "image", attrs: { src } })
      })
    },
    onValidationError: (errors) => {
      errors.forEach((e) => toast.error("Image validation error", { position: "bottom-right", description: e.reason }))
    },
  }),
  Color,
  TextStyle,
  Selection,
  Typography,
  UnsetAllMarks,
  HorizontalRule,
  ResetMarksOnEnter,
  CodeBlockLowlight,
  Placeholder.configure({ placeholder: () => placeholder }),
]

export const useMinimalTiptapEditor = ({
  value,
  output = "html",
  placeholder = "",
  editorClassName,
  throttleDelay = 0,
  onUpdate,
  onBlur,
  uploader,
  ...props
}: UseMinimalTiptapEditorProps) => {
  const throttledSetValue = useThrottle(
    (v: Content) => onUpdate?.(v),
    throttleDelay
  )

  const editor = useEditor({
    extensions: createExtensions({ placeholder, uploader }),
    content: value,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: cn("focus:outline-hidden", editorClassName),
      },
    },
    onUpdate: ({ editor }) => throttledSetValue(getOutput(editor, output)),
    onBlur: ({ editor }) => onBlur?.(getOutput(editor, output)),
    ...props,
  })

  return editor
}

export default useMinimalTiptapEditor
