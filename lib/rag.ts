
import fs from "fs";
import path from "path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import weaviate from "weaviate-client";
import { WeaviateStore } from "@langchain/weaviate";
import { OllamaEmbeddings, Ollama } from "@langchain/ollama";
import settings from "./settings";



const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});

export async function loadPDF(pdfPath: string) {
  // Use pdfjs-dist directly — compatible with Node.js 24 (pdf-parse@1.1.1 is not)
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerPath = path.resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

  const fileBuffer = fs.readFileSync(pdfPath);
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;

  const rawDocs: Document[] = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(" ");
    rawDocs.push(new Document({ pageContent: text, metadata: { loc: { pageNumber: i } } }));
  }

  // Detect scanned (image-only) PDFs — no text extractable
  const totalText = rawDocs.map(d => d.pageContent.trim()).join("");
  if (totalText.length < 50) {
    throw new Error(
      "This PDF appears to be a scanned image PDF. " +
      "This app currently only supports text-based PDFs. " +
      "Please upload a PDF where text can be selected and copied."
    );
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 350,
    chunkOverlap: 50,
  });

  const docs = await splitter.splitDocuments(rawDocs);

  docs.forEach((doc) => {
    const pageNum = doc.metadata?.loc?.pageNumber || "Unknown";
    doc.pageContent = `search_document: Page ${pageNum}:\n${doc.pageContent}`;
  });

  if (settings.LOCAL_DEBUGGING) {
    const debugDir = path.join(process.cwd(), "_local_debug");
    fs.mkdirSync(debugDir, { recursive: true });
    const lines = docs.map((d, i) => `--- Chunk ${i + 1} ---\n${d.pageContent}\n`);
    fs.writeFileSync(
      path.join(debugDir, "debug_uploaded_file_chunks.txt"),
      `Total chunks: ${docs.length}\n\n` + lines.join("\n"),
      "utf8"
    );
  }

  try {
    const client = await weaviate.connectToLocal();

    // Always recreate the collection to ensure text property has indexSearchable=true
    // Without this, Weaviate's BM25 hybrid search fails with "No indexed properties"
    const exists = await client.collections.exists("PdfDocs");
    if (exists) {
      await client.collections.delete("PdfDocs");
    }

    await client.collections.create({
      name: "PdfDocs",
      properties: [
        {
          name: "text",
          dataType: "text" as any,
          indexSearchable: true,
        },
      ],
    });

    await WeaviateStore.fromDocuments(docs, embeddings, {
      client,
      indexName: "PdfDocs",
    });

    console.log(`Inserted ${docs.length} chunks into Weaviate`);
  } catch (err) {
    console.error(err);
  }

  return {
    totalChunks: docs.length,
    message: "PDF indexed successfully",
  };
}


export async function askQuestion(question: string, model: string = "gemma4") {
  const client = await weaviate.connectToLocal();
  const vectorStore = new WeaviateStore(embeddings, {
    client,
    indexName: "PdfDocs",
  });

  // Native Weaviate Hybrid Search (0.5 = 50% dense vectors, 50% BM25 sparse vectors)
  let docs = await vectorStore.hybridSearch(question, { 
    alpha: 0.5,
    limit: 5 
  });

  const context = docs
    .map((d) => d.pageContent)
    .join("\n\n");

  const llm = new Ollama({
    model,
    baseUrl: "http://localhost:11434",
  });

  const response = await llm.invoke(`
Answer ONLY using the context below.

Context:
${context}

Question:
${question}
`);

  if (settings.LOCAL_DEBUGGING) {
    const debugDir = path.join(process.cwd(), "_local_debug");
    fs.mkdirSync(debugDir, { recursive: true });
    const entry = [
      `=== ${new Date().toISOString()} ===$`,
      `QUESTION: ${question}`,
      `CONTEXT:\n${context || "(empty)"}`,
      `ANSWER: ${response}`,
      "",
    ].join("\n");
    fs.appendFileSync(path.join(debugDir, "debug_qna.txt"), entry + "\n", "utf8");
  }

  return {
    answer: response,
    context,
  };
}

export async function deletePDFData() {
  try {
    const client = await weaviate.connectToLocal();
    const exists = await client.collections.exists("PdfDocs");
    if (exists) {
      await client.collections.delete("PdfDocs");

    }
    return { success: true, message: "Deleted from database" };
  } catch (err: any) {

    throw err;
  }
}