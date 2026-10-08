import * as React from "react"
import type { Editor } from "@tiptap/react"
import type { toggleVariants } from "@/components/ui/toggle"
import type { VariantProps } from "class-variance-authority"
import { ToolbarButton } from "../toolbar-button"

const TableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
    <path d="M12 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18" /><path d="M3 15h18" />
  </svg>
)

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
)

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </svg>
)

const isYoutubeUrl = (url: string) =>
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(url)

const isVimeoUrl = (url: string) =>
  /vimeo\.com\/(\d+)/.test(url)

const getVimeoId = (url: string) => {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : null
}

interface SectionSevenProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
}

export const SectionSeven: React.FC<SectionSevenProps> = ({ editor, size, variant }) => {
  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertVideo = () => {
    const url = window.prompt("Introduce la URL del vídeo (YouTube, Vimeo o MP4 directo):")
    if (!url?.trim()) return

    if (isYoutubeUrl(url)) {
      editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run()
      return
    }

    if (isVimeoUrl(url)) {
      const id = getVimeoId(url)
      if (id) {
        editor.chain().focus().insertContent({
          type: "youtube",
          attrs: {
            src: `https://player.vimeo.com/video/${id}`,
            width: 640,
            height: 360,
          },
        }).run()
      }
      return
    }

    // Direct video file (MP4, WebM, etc.)
    editor.chain().focus().setVideo({ src: url, controls: true }).run()
  }

  return (
    <>
      <ToolbarButton
        tooltip="Insertar tabla"
        aria-label="Insertar tabla"
        onClick={insertTable}
        size={size}
        variant={variant}
      >
        <TableIcon />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Insertar vídeo (YouTube, Vimeo o MP4)"
        aria-label="Insertar vídeo"
        onClick={insertVideo}
        size={size}
        variant={variant}
      >
        <VideoIcon />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Insertar vídeo de YouTube"
        aria-label="Insertar YouTube"
        onClick={() => {
          const url = window.prompt("URL de YouTube:")
          if (url?.trim()) {
            editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run()
          }
        }}
        size={size}
        variant={variant}
      >
        <YoutubeIcon />
      </ToolbarButton>
    </>
  )
}

SectionSeven.displayName = "SectionSeven"

export default SectionSeven
