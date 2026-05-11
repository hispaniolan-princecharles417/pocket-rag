"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! I'm your local PDF assistant. Upload a PDF and ask me anything!" }
  ]);
  const [status, setStatus] = useState("No PDF uploaded");
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemma4");

  const MODELS = [
    { id: "gemma4", label: "Gemma 4" },
    { id: "phi3:mini", label: "Phi-3 Mini" },
  ];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  async function checkStatus() {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatus(data.indexed ? "PDF Indexed ✅" : "No PDF uploaded ❌");
    } catch (err) {
      setStatus("Failed to check status");
    }
  }

  useEffect(() => {
    checkStatus();
  }, []);

  async function uploadPDF() {
    if (!file) {
      alert("Select a PDF first");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setMessages(prev => [...prev, { role: "bot", text: `❌ Upload failed: ${data.error}` }]);
        return;
      }

      setStatus("PDF Indexed ✅");
      setMessages(prev => [...prev, { role: "bot", text: `Successfully indexed ${data.fileName}! What would you like to know about it?` }]);
      setFile(null);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ Upload failed: ${err.message}` }]);
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteData() {
    if (!confirm("Are you sure you want to delete the current PDF from the database?")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch("/api/delete", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setStatus("No PDF uploaded");
      setMessages([{ role: "bot", text: "Database cleared! You can upload a new PDF now." }]);
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function ask(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!question.trim() || isAsking) return;
    
    const userQ = question;
    setQuestion("");
    setMessages(prev => [...prev, { role: "user", text: userQ }]);
    setIsAsking(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQ, model: selectedModel }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", text: data.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "bot", text: "Error: " + err.message }]);
    } finally {
      setIsAsking(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-sm p-4 flex flex-col md:flex-row items-center justify-between z-10 gap-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          PocketRAG
        </h1>
        
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="text-sm text-gray-600 font-medium min-w-[120px] text-center md:text-left bg-gray-50 px-3 py-1.5 rounded-lg border">{status}</span>
          
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-white border border-gray-300 px-3 py-1.5 rounded text-sm text-gray-700 focus:outline-none focus:border-blue-500 transition cursor-pointer"
            title="Select LLM Model"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>

          <button
            onClick={deleteData}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-600 border border-red-200 hover:bg-red-50 bg-white px-3 py-1.5 rounded text-sm transition disabled:opacity-50"
            title="Delete Database"
          >
            {isDeleting ? "Deleting..." : "Clear DB"}
          </button>
          
          <label className="cursor-pointer bg-white border px-3 py-1.5 rounded text-sm hover:bg-gray-100 transition">
            {file ? file.name : "Select PDF"}
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          
          <button
            onClick={uploadPDF}
            disabled={isUploading || !file}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50 hover:bg-blue-700 transition"
          >
            {isUploading ? "Indexing..." : "Upload"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                  msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-none whitespace-pre-wrap"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isAsking && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10">
        <form onSubmit={ask} className="max-w-4xl mx-auto flex gap-3 relative">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full py-3 px-6 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12 shadow-inner"
            placeholder="Ask a question about your document..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAsking}
          />
          <button
            type="submit"
            disabled={isAsking || !question.trim()}
            className="absolute right-2 top-1.5 bottom-1.5 aspect-square bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
