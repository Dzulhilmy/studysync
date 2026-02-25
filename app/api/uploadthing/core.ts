import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const f = createUploadthing()

export const ourFileRouter = {
  /**
   * Handles all file uploads for StudySync:
   * announcements, project attachments, materials
   */
  studysyncUploader: f({
    pdf:   { maxFileSize: '16MB', maxFileCount: 1 },
    image: { maxFileSize: '8MB',  maxFileCount: 1 },
    // Word docs, ODT, RTF, TXT fall under "blob"
    blob:  { maxFileSize: '16MB', maxFileCount: 1 },
    text:  { maxFileSize: '4MB',  maxFileCount: 1 },
  })
    .middleware(async () => {
      // Only allow authenticated users to upload
      const session = await getServerSession(authOptions)
      if (!session) throw new Error('Unauthorized')
      return { userId: (session.user as any).id, role: (session.user as any).role }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Return the file URL — this is sent back to the client's onClientUploadComplete
      return { url: file.url, name: file.name, userId: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter