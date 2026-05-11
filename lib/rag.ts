
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import weaviate from "weaviate-client";
import { WeaviateStore } from "@langchain/weaviate";
import { OllamaEmbeddings, Ollama } from "@langchain/ollama";



const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});

export async function loadPDF(pdfPath: string) {
  const loader = new PDFLoader(pdfPath);
  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 350,
    chunkOverlap: 50,
  });

  const docs = await splitter.splitDocuments(rawDocs);

  docs.forEach((doc) => {
    const pageNum = doc.metadata?.loc?.pageNumber || "Unknown";
    doc.pageContent = `search_document: Page ${pageNum}:\n${doc.pageContent}`;
  });



  try {
    const client = await weaviate.connectToLocal();
    await WeaviateStore.fromDocuments(
      docs,
      embeddings,
      {
        client,
        indexName: "PdfDocs",
      }
    );

    console.log("Inserted successfully into Weaviate");
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