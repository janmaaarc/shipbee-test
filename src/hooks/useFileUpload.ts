import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { generateId } from '../lib/utils'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface UploadedFile {
  file_name: string
  file_url: string
  file_type: string
  file_size: number
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  function validateFile(file: File): string | null {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOC_TYPES]

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload images, videos, or documents.'
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 10MB.'
    }

    return null
  }

  function getFileCategory(type: string): 'image' | 'video' | 'document' {
    if (ALLOWED_IMAGE_TYPES.includes(type)) return 'image'
    if (ALLOWED_VIDEO_TYPES.includes(type)) return 'video'
    return 'document'
  }

  async function uploadFile(file: File): Promise<{ data: UploadedFile | null; error: string | null }> {
    const validationError = validateFile(file)
    if (validationError) {
      return { data: null, error: validationError }
    }

    setUploading(true)
    setProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: 'Not authenticated' }
      }

      // Create unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${generateId()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return { data: null, error: uploadError.message }
      }

      // Get signed URL (valid for 1 hour)
      const { data: signedUrlData } = await supabase.storage
        .from('attachments')
        .createSignedUrl(fileName, 3600)

      if (!signedUrlData?.signedUrl) {
        return { data: null, error: 'Failed to generate file URL' }
      }

      setProgress(100)

      return {
        data: {
          file_name: file.name,
          file_url: signedUrlData.signedUrl,
          file_type: file.type,
          file_size: file.size,
        },
        error: null,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      return { data: null, error: message }
    } finally {
      setUploading(false)
    }
  }

  async function uploadMultiple(files: File[]): Promise<{ data: UploadedFile[]; errors: string[] }> {
    const results: UploadedFile[] = []
    const errors: string[] = []

    for (const file of files) {
      const { data, error } = await uploadFile(file)
      if (data) {
        results.push(data)
      }
      if (error) {
        errors.push(`${file.name}: ${error}`)
      }
    }

    return { data: results, errors }
  }

  return {
    uploadFile,
    uploadMultiple,
    uploading,
    progress,
    validateFile,
    getFileCategory,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    ALLOWED_DOC_TYPES,
    MAX_FILE_SIZE,
  }
}
