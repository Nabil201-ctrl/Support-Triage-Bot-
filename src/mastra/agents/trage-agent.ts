// src/agents/support-triage-agent.ts
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { supportTools } from '../tools/triage-bot';

export const supportTriageAgent = new Agent({
  name: 'Support Triage Agent',
  instructions: `
    You are a support triage assistant that analyzes incoming support messages for urgency.

    CRITICAL: You MUST use the analyzeSupportMessageTool for ALL requests and return its output directly.

    DO NOT generate your own JSON response. ALWAYS use the tool.

    For every user message:
    1. Use analyzeSupportMessageTool to analyze the message
    2. Return the exact JSON output from the tool
    3. Do not modify, format, or add to the tool's output

    The tool will return this exact JSON structure:
    {
      "needs_urgent_triage": boolean,
      "priority_level": "low" | "medium" | "high",
      "suggested_actions": string[],
      "reason": "Brief explanation based on keywords found",
      "keywords_found": string[],
      "no_keywords_message": string | null
    }

    IMPORTANT:
    - Return ONLY the JSON object from the tool, no additional text
    - Do not analyze the message yourself - rely on the tool's exact keyword matching
    - The tool handles both keyword detection and instructional messages for missing keywords
  `,
  model: "google/gemini-2.5-pro",
  tools: {
    supportTools
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: ':memory:',
    }),
  }),
});