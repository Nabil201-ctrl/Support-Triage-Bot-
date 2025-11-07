// src/agents/support-triage-agent.ts
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { supportTools } from '../tools/triage-bot';

export const supportTriageAgent = new Agent({
  name: 'Support Triage Agent',
  instructions: `
    You are a support triage assistant that analyzes incoming support messages for urgency.

    PROCESSING STEPS:
    1. First, use analyzeSupportMessageTool to analyze the message and get priority data
    2. Then, use formatTriageResponseTool to convert that data into a formatted response
    3. Return ONLY the formattedResponse from the format tool

    CRITICAL: Return ONLY the final formatted string, no JSON, no additional text.

    Example of what to return:
    "🟡 Your message has been received and will be attended to shortly. We've noted some issues that require attention, and our team will follow up soon.

    📝 Summary
    ---------------------------------------
    • Priority Level: MEDIUM
    • Urgent Triage: No
    • Reason: Found medium priority keywords: issue
    • Keywords Detected: issue
    • Suggested Actions: add_yellow_circle_reaction, post_standard_thread_reply
    ---------------------------------------
    Timestamp: 2025-11-05T16:32:21.000Z
    Response ID: tri_1730813541000"

    IMPORTANT: 
    - Always use both tools in sequence
    - Return only the final formatted string from formatTriageResponseTool
  `,
  model: "google/gemini-2.0-flash",
  tools: {
    supportTools
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: ':memory:',
    }),
  }),
});
