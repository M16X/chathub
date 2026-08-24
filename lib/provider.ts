export const openCodeProviderConfig = {
  name: "openai-compatible",
  baseURL: "https://api.kilo.ai/api/gateway",
  apiKey: "public",
} as const;

export type ProviderModel = {
  id: string;
  owned_by?: string;
  created?: number;
};

export type ModelsResponse = {
  object: "list";
  data: ProviderModel[];
};
