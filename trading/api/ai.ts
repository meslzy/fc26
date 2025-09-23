import OpenAI from "openai";

export const MODEL = "gpt-oss";

export const openai = new OpenAI({
	apiKey: "ollama",
	baseURL: "http://localhost:11434/v1",
});
