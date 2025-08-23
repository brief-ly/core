import { Hono } from "hono";
import { respond } from "@/api/lib/utils/respond";
import { uploadFile } from "@/api/lib/utils/pinata";

const upload = new Hono()
.post(
    "/",
    async (ctx) => {
      const body = await ctx.req.parseBody();
      console.log("Upload body", body);

      if (!body.file || typeof body.file !== "object") {
        return respond.err(ctx, "File is required", 400);
      }

      // Ensure the file has a name
      const file = body.file as File;
      console.log("File details:", {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      
      if (file.size > maxSize) {
        return respond.err(ctx, "File size exceeds 5MB limit", 400);
      }

      if (!file.name) {
        console.log("File has no name, creating new file with name");
        const newFile = new File([file], 'uploaded-file', { type: file.type });
        const result = await uploadFile(newFile);
        return respond.ok(
          ctx,
          result,
          "Successfully uploaded file",
          200
        );
      }

      const result = await uploadFile(file);
      return respond.ok(
        ctx,
        result,
        "Successfully uploaded file",
        200
      );
    }
  )

export default upload;
export type UploadType = typeof upload;