import { loadPDF } from "@/lib/rag";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();

  const file = formData.get("file") as File;

  if (!file) {
    return Response.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  const filePath = path.join(
    process.cwd(),
    "uploads",
    file.name
  );

  await writeFile(filePath, buffer);

  const result = await loadPDF(filePath);

  return Response.json({
    success: true,
    fileName: file.name,
    indexed: true,
    ...result,
  });
}