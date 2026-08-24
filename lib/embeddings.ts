import type { EmbeddingFunction } from "chromadb";

export const EMBEDDING_MODEL = "text-embedding-3-small";

type OpenAIEmbeddingConfig = {
  apiKey?: string;
  baseURL?: string;
  model?: string;
};

export class OpenAIEmbeddingFunction implements EmbeddingFunction {
  name = "openai";
  private readonly config: OpenAIEmbeddingConfig;

  constructor(config: OpenAIEmbeddingConfig = {}) {
    this.config = config;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const baseURL = ('https://ai-gateway.vercel.sh/v1').replace(/\/+$/, "");
    const model = 'openai/text-embedding-3-small';

    const vectors: number[][] = [];
    const batchSize = 64;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await fetch(`${baseURL}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer vck_2YppRLiSnCdID0o2jJQ4Za8PIMmC53KYNqmUwg4tciGSFtgv3Z1NPzbF`,
        },
        body: JSON.stringify({ model, input: batch }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Embedding request failed with ${response.status} ${response.statusText}: ${body}`,
        );
      }

      const data = await response.json() as { data: { embedding: number[]; index: number }[] };
      const batchVectors = new Array<number[]>(batch.length);
      for (const item of data.data) {
        batchVectors[item.index] = item.embedding;
      }
      vectors.push(...batchVectors);
    }

    return vectors;
  }

  defaultSpace(): "cosine" {
    return "cosine";
  }

  getConfig(): Record<string, unknown> {
    return {
      model_name: this.config.model ?? EMBEDDING_MODEL,
      base_url: this.config.baseURL ?? null,
    };
  }

  buildFromConfig(config: Record<string, unknown>): OpenAIEmbeddingFunction {
    return new OpenAIEmbeddingFunction({
      model: config.model_name as string | undefined,
      baseURL: config.base_url as string | undefined,
    });
  }
}
