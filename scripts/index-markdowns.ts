import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ChromaClient, type Collection, type Metadata } from "chromadb";
import { OpenAIEmbeddingFunction } from "../lib/embeddings.ts";

const CHUNK_MAX_CHARS = 1200;
const UPSERT_BATCH_SIZE = 64;

type MarkdownChunk = {
  id: string;
  text: string;
  metadata: Metadata;
};

type IndexOptions = {
  docsDir: string;
  collectionName: string;
  reset: boolean;
  query: string | undefined;
};

function parseArgs(argv: string[]): IndexOptions {
  const args = argv.slice(2);
  const positional: string[] = [];
  let query: string | undefined;
  let collectionName = process.env.CHROMA_COLLECTION ?? "markdown-docs";
  let reset = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--query") {
      query = args[++i];
      if (!query) throw new Error("--query requires a value, e.g. --query \"how do I deploy?\"");
    } else if (arg === "--collection") {
      collectionName = args[++i];
      if (!collectionName) throw new Error("--collection requires a name");
    } else if (arg === "--reset") {
      reset = true;
    } else if (arg === "--help" || arg === "-h") {
      printUsageAndExit();
    } else {
      positional.push(arg);
    }
  }

  return {
    docsDir: positional[0] ?? "docs",
    collectionName,
    reset,
    query,
  };
}

function printUsageAndExit(): never {
  console.log(`Index markdown files into a local Chroma DB.

Usage:
  node scripts/index-markdowns.ts [docsDir] [options]

Arguments:
  docsDir                 Directory to scan for .md files (default: "docs")

Options:
  --query <text>          Run a demo search against the collection after indexing
  --collection <name>     Collection name (default: $CHROMA_COLLECTION or "markdown-docs")
  --reset                 Delete the collection first so indexing starts clean

Environment:
  OPENAI_API_KEY          Required. Used for text-embedding-3-small embeddings.
  OPENAI_BASE_URL         Optional. Defaults to https://api.openai.com/v1.
  CHROMA_HOST, CHROMA_PORT  Optional. Defaults to localhost:8000.`);
  process.exit(0);
}

async function findMarkdownFiles(dir: string, baseDir = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(fullPath, baseDir)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  return files.sort();
}

function splitOversizedSection(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const pieces: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) pieces.push(current.trim());
    current = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > CHUNK_MAX_CHARS) {
      flush();
      for (let i = 0; i < paragraph.length; i += CHUNK_MAX_CHARS) {
        pieces.push(paragraph.slice(i, i + CHUNK_MAX_CHARS).trim());
      }
      continue;
    }
    if (current.length + paragraph.length > CHUNK_MAX_CHARS) flush();
    current += (current ? "\n\n" : "") + paragraph;
  }
  flush();

  return pieces;
}

function chunkMarkdown(content: string): { heading: string; text: string }[] {
  const lines = content.split("\n");
  const sections: { heading: string; body: string[] }[] = [
    { heading: "", body: [] },
  ];

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (match && sections.at(-1)?.body.some((l) => l.trim())) {
      sections.push({ heading: match[2].trim(), body: [] });
    }
    sections.at(-1)?.body.push(line);
  }

  return sections.flatMap((section) => {
    const raw = section.body.join("\n").trim();
    if (!raw) return [];
    const pieces = raw.length <= CHUNK_MAX_CHARS ? [raw] : splitOversizedSection(raw);
    return pieces.map((text) => ({ heading: section.heading, text }));
  });
}

async function buildChunks(docsDir: string): Promise<MarkdownChunk[]> {
  const files = await findMarkdownFiles(docsDir);
  if (files.length === 0) {
    throw new Error(`No .md files found under "${docsDir}".`);
  }
  console.log(`Found ${files.length} markdown file(s) in ${docsDir}`);

  const chunks: MarkdownChunk[] = [];
  for (const relativePath of files) {
    const content = await readFile(path.join(docsDir, relativePath), "utf8");
    const fileChunks = chunkMarkdown(content);
    console.log(`  ${relativePath}: ${fileChunks.length} chunk(s)`);
    fileChunks.forEach((chunk, index) => {
      chunks.push({
        id: `${relativePath}::${index}`,
        text: chunk.text,
        metadata: {
          source: relativePath,
          heading: chunk.heading || "(top)",
          chunk_index: index,
        },
      });
    });
  }
  return chunks;
}

async function upsertChunks(collection: Collection, chunks: MarkdownChunk[]): Promise<void> {
  for (let i = 0; i < chunks.length; i += UPSERT_BATCH_SIZE) {
    const batch = chunks.slice(i, i + UPSERT_BATCH_SIZE);
    await collection.upsert({
      ids: batch.map((chunk) => chunk.id),
      documents: batch.map((chunk) => chunk.text),
      metadatas: batch.map((chunk) => chunk.metadata),
    });
    console.log(`Upserted ${Math.min(i + batch.length, chunks.length)}/${chunks.length}`);
  }
}

async function runDemoQuery(collection: Collection, query: string): Promise<void> {
  const result = await collection.query({
    queryTexts: [query],
    nResults: 5,
  });

  console.log(`\nTop matches for "${query}":`);
  const ids = result.ids[0] ?? [];
  ids.forEach((_, rank) => {
    const distance = result.distances?.[0]?.[rank];
    const metadata = result.metadatas[0]?.[rank];
    const document = result.documents[0]?.[rank] ?? "";
    const snippet = document.length > 160 ? `${document.slice(0, 160)}...` : document;
    console.log(`${rank + 1}. [${metadata?.source}${metadata?.heading ? ` # ${metadata.heading}` : ""}] (${distance?.toFixed(3)})`);
    console.log(`   ${snippet.replaceAll("\n", " ")}`);
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const chunks = await buildChunks(options.docsDir);

  const chroma = new ChromaClient({
    host: process.env.CHROMA_HOST ?? "localhost",
    port: Number(process.env.CHROMA_PORT ?? 8000),
  });

  if (options.reset) {
    await chroma.deleteCollection({ name: options.collectionName }).catch(() => {});
    console.log(`Deleted existing collection "${options.collectionName}" (if any)`);
  }

  const embeddingFunction = new OpenAIEmbeddingFunction();
  const collection = await chroma.getOrCreateCollection({
    name: options.collectionName,
    embeddingFunction,
  });

  await upsertChunks(collection, chunks);
  console.log(`\nDone. Collection "${options.collectionName}" now holds ${await collection.count()} chunks.`);

  if (options.query) {
    await runDemoQuery(collection, options.query);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
