import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from './core'

// Creates GET and POST handlers for UploadThing
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})