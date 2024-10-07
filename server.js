import { serve } from "https://deno.land/std@0.181.0/http/server.ts"
import { serveDir } from "https://deno.land/std@0.181.0/http/file_server.ts"

serve((req) => {
  return serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  })
}, { port: 8000 })

console.log("File server running on http://localhost:8000")
