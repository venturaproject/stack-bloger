import { Node, mergeAttributes } from "@tiptap/core"

export interface VideoOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; controls?: boolean }) => ReturnType
    }
  }
}

export const Video = Node.create<VideoOptions>({
  name: "video",
  group: "block",
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      width: { default: "100%" },
    }
  },

  parseHTML() {
    return [{ tag: "video" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    }
  },
})
