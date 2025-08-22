import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "./env";

type GoogleGenAiConfig = NonNullable<
  Parameters<GoogleGenAI["models"]["generateContent"]>["0"]["config"]
>;

type AgentConfig = Omit<
  GoogleGenAiConfig,
  "responseMimeType" | "responseJsonSchema" | "systemInstruction"
>;

type ModelName = "gemini-2.0-flash" | "gemini-1.5-pro" | "gemini-1.5-flash";

export class Agent {
  preamble: string;
  ai: GoogleGenAI;
  model: ModelName;
  config: AgentConfig = {};
  responseJsonSchema: any;
  knowledges: string[] = [];

  constructor(options: {
    preamble: string;
    model?: ModelName;
    config?: AgentConfig;
  }) {
    this.preamble = options.preamble;
    this.model = options.model || "gemini-2.0-flash";
    this.config = options.config || {};
    this.ai = new GoogleGenAI({
      apiKey: env.GOOGLE_API_KEY,
    });
  }

  private safeParseWithZod<T>(data: any, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn("Zod validation failed:", error.issues);
        throw new Error(
          `Validation failed: ${error.issues.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  }

  async prompt(input: string, schema?: z.ZodSchema): Promise<any> {
    const contents = this.parsePrompt(input);
    const res = await this.ai.models.generateContent({
      model: this.model,
      contents,
      config: this.getConfig(),
    });

    if (this.responseJsonSchema) {
      const jsonText = res.candidates?.[0].content?.parts
        ?.map((part) => part.text)
        .join("");
      if (!jsonText) {
        return {};
      }
      const json = JSON.parse(jsonText);

      if (schema) {
        return this.safeParseWithZod(json, schema);
      }

      return json;
    }

    return res.candidates?.[0].content;
  }

  setResponseJsonSchema(schema: any): void {
    this.responseJsonSchema = schema;
  }

  addKnowledge(knowledge: string): void {
    this.knowledges.push(knowledge);
  }

  clearKnowledge(): void {
    this.knowledges = [];
  }

  setConfig(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setPreamble(preamble: string): void {
    this.preamble = preamble;
  }

  private getConfig(): GoogleGenAiConfig {
    let config: GoogleGenAiConfig = {
      ...this.config,
      systemInstruction: this.preamble,
    };

    if (this.responseJsonSchema) {
      config.responseMimeType = "application/json";
      config.responseJsonSchema = this.responseJsonSchema;
    }

    return config;
  }

  private parsePrompt(input: string): string {
    const contents: string[] = [];
    for (const knowledge of this.knowledges) {
      contents.push("Knowledge:\n" + knowledge);
    }
    contents.push("User:\n" + input);
    return contents.join("\n\n");
  }

  async extractLawyerLabels(lawyerData: {
    name: string;
    bio: string;
    expertise: string;
    jurisdictions: string[];
    consultationFee: number;
  }): Promise<string[]> {
    const labelAgent = new Agent({
      preamble: `You are an expert legal categorization system. Based on lawyer information, extract relevant labels that categorize their practice areas, skills, and specializations.
      
      Generate 3-7 relevant labels that would help clients find this lawyer. Focus on:
      - Practice areas (e.g., "Corporate Law", "Criminal Defense", "Family Law")
      - Specializations (e.g., "Contract Disputes", "Immigration", "Personal Injury")
      - Client types (e.g., "Startups", "Individuals", "Small Business")
      - Notable skills or certifications mentioned
      
      Return only the most relevant and specific labels. Avoid generic terms like "Lawyer" or "Legal".`,
      model: "gemini-2.0-flash",
    });

    labelAgent.setResponseJsonSchema({
      type: "object",
      properties: {
        labels: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 7,
        },
      },
      required: ["labels"],
    });

    const lawyerInfo = `
Name: ${lawyerData.name}
Bio: ${lawyerData.bio}
Expertise: ${lawyerData.expertise}
Jurisdictions: ${lawyerData.jurisdictions.join(", ")}
Consultation Fee: $${lawyerData.consultationFee}
    `.trim();

    const result = await labelAgent.prompt(lawyerInfo);
    return result.labels || [];
  }
}
