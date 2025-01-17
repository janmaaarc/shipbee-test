import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Attachment } from '@/types/database'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function uploadFile(file: File, messageId: string): Promise<Attachment | null> {
    setError(null)
    setProgress(0)

    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit')
      return null
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not supported')
      return null
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${messageId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      setProgress(50)

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName)

      const { data: attachment, error: dbError } = await supabase
        .from('attachments')
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setProgress(100)
      return attachment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }

  async function uploadFiles(files: File[], messageId: string): Promise<Attachment[]> {
    const results: Attachment[] = []
    for (const file of files) {
      const attachment = await uploadFile(file, messageId)
      if (attachment) results.push(attachment)
    }
    return results
  }

  return { uploadFile, uploadFiles, uploading, progress, error }
}
