import weaviate from "weaviate-client";

export async function GET() {
  try {
    const client = await weaviate.connectToLocal();
    const exists = await client.collections.exists("PdfDocs");

    return Response.json({ indexed: exists });
  } catch (err) {
    return Response.json({ indexed: false });
  }
}