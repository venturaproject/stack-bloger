import axiosRequest from "axios"
import { axios } from "@/lib/axios"
import { assetUrl } from "@/lib/urls"

type ImageUploaderOptions = {
  unique?: boolean
  bucketId?: "uploads/images" | "logo"
  onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
}

type PresignedUrlResponse = {
  path: string
  url: string
  headers?: Record<string, string>
}

function createImageUploader({
  unique = true,
  bucketId = "uploads/images",
  onUploadProgress,
}: ImageUploaderOptions = {}) {
  return async (file: File): Promise<string> => {
    const response = await axios.request<PresignedUrlResponse>({
      method: "POST",
      url: "/admin/generate-presigned-url",
      data: {
        unique,
        bucketId,
        filename: file.name,
        mimeType: file.type,
        contentLength: file.size,
      },
    })
    const { path, url, headers } = response.data

    await axiosRequest.request({
      method: "PUT",
      url,
      data: file,
      onUploadProgress,
      headers: {
        "Content-Type": file.type,
        "Content-Disposition": `inline; filename="${file.name}"`,
        ...headers,
      },
    })

    return assetUrl(path)
  }
}

export { createImageUploader }
