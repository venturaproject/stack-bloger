import * as React from "react"
import type { Editor } from "@tiptap/react"
import type { toggleVariants } from "@/components/ui/toggle"
import type { VariantProps } from "class-variance-authority"
import { ToolbarButton } from "../toolbar-button"

const AlignLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
    <line x1="21" x2="3" y1="6" y2="6" /><line x1="15" x2="3" y1="12" y2="12" /><line x1="17" x2="3" y1="18" y2="18" />
  </svg>
)
const AlignCenterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
    <line x1="21" x2="3" y1="6" y2="6" /><line x1="17" x2="7" y1="12" y2="12" /><line x1="19" x2="5" y1="18" y2="18" />
  </svg>
)
const AlignRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
    <line x1="21" x2="3" y1="6" y2="6" /><line x1="21" x2="9" y1="12" y2="12" /><line x1="21" x2="7" y1="18" y2="18" />
  </svg>
)
const AlignJustifyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
    <line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" />
  </svg>
)

interface SectionSixProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
}

export const SectionSix: React.FC<SectionSixProps> = ({ editor, size, variant }) => {
  return (
    <>
      <ToolbarButton
        tooltip="Align left"
        aria-label="Align left"
        isActive={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        disabled={!editor.can().setTextAlign("left")}
        size={size}
        variant={variant}
      >
        <AlignLeftIcon />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Align center"
        aria-label="Align center"
        isActive={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        disabled={!editor.can().setTextAlign("center")}
        size={size}
        variant={variant}
      >
        <AlignCenterIcon />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Align right"
        aria-label="Align right"
        isActive={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        disabled={!editor.can().setTextAlign("right")}
        size={size}
        variant={variant}
      >
        <AlignRightIcon />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Justify"
        aria-label="Justify"
        isActive={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        disabled={!editor.can().setTextAlign("justify")}
        size={size}
        variant={variant}
      >
        <AlignJustifyIcon />
      </ToolbarButton>
    </>
  )
}

SectionSix.displayName = "SectionSix"

export default SectionSix
