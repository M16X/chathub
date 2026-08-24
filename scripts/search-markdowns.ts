import { ChromaClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "../lib/embeddings.ts";

function parseArgs(argv: string[]): { query: string; collectionName: string } {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`Search markdown chunks previously indexed into Chroma.

Usage:
  node scripts/search-markdowns.ts "<query>" [--collection <name>]

Environment:
  OPENAI_API_KEY            Required. Query is embedded with text-embedding-3-small.
  CHROMA_HOST, CHROMA_PORT  Optional. Defaults to localhost:8000.`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  let query = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--collection") {
      i++;
    } else {
      query = args[i];
    }
  }

  return {
    query,
    collectionName: process.env.CHROMA_COLLECTION ?? "markdown-docs",
  };
}

async function main(): Promise<void> {
  const { query, collectionName } = parseArgs(process.argv);

  const chroma = new ChromaClient({
    host: process.env.CHROMA_HOST ?? "localhost",
    port: Number(process.env.CHROMA_PORT ?? 8000),
  });

  const collection = await chroma.getCollection({
    name: collectionName,
    embeddingFunction: new OpenAIEmbeddingFunction(),
  });

  const result = await collection.query({ queryTexts: [query], nResults: 5 });
  console.log(`Top matches for "${query}" in "${collectionName}":\n`);

  result.ids[0]?.forEach((_, rank) => {
    const metadata = result.metadatas[0]?.[rank];
    const distance = result.distances?.[0]?.[rank];
    const document = result.documents[0]?.[rank] ?? "";
    const snippet = document.length > 200 ? `${document.slice(0, 200)}...` : document;
    console.log(`${rank + 1}. [${metadata?.source} # ${metadata?.heading}] distance=${distance?.toFixed(3)}`);
    console.log(`   ${snippet.replaceAll("\n", " ")}\n`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
