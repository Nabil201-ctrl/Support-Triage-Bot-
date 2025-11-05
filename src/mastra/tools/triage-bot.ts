// src/tools/support-tools.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const keywordDetectionTool = createTool({
  id: 'detect-keywords',
  description: 'Detect priority keywords in support messages',
  inputSchema: z.object({
    message: z.string().describe('The support message to analyze'),
  }),
  outputSchema: z.object({
    highPriorityKeywords: z.array(z.string()),
    mediumPriorityKeywords: z.array(z.string()),
    lowPriorityKeywords: z.array(z.string()),
    allKeywords: z.array(z.string()),
    keywordCount: z.number(),
    urgencyScore: z.number().min(0).max(10),
  }),
  execute: async ({ context }) => {
    const message = context.message.toLowerCase();

    const highPriority = ['broken', 'crash', 'emergency', 'urgent', 'not working', 'error', 'failed', 'down', 'critical', 'outage'];
    const mediumPriority = ['issue', 'problem', 'help', 'question', 'how to', 'stuck', 'trouble', 'not sure', 'confused', 'slow'];
    const lowPriority = ['thanks', 'thank you', 'feature', 'suggestion', 'idea', 'maybe', 'when', 'can you', 'would like'];

    const foundHigh = highPriority.filter(keyword => message.includes(keyword));
    const foundMedium = mediumPriority.filter(keyword => message.includes(keyword));
    const foundLow = lowPriority.filter(keyword => message.includes(keyword));
    const allFound = [...foundHigh, ...foundMedium, ...foundLow];

    // Calculate urgency score
    let urgencyScore = 0;
    if (foundHigh.length > 0) urgencyScore = 8 + (foundHigh.length * 0.5);
    else if (foundMedium.length > 0) urgencyScore = 4 + (foundMedium.length * 0.3);
    else if (foundLow.length > 0) urgencyScore = 1 + (foundLow.length * 0.1);

    urgencyScore = Math.min(10, urgencyScore);

    return {
      highPriorityKeywords: foundHigh,
      mediumPriorityKeywords: foundMedium,
      lowPriorityKeywords: foundLow,
      allKeywords: allFound,
      keywordCount: allFound.length,
      urgencyScore,
    };
  },
});

export const formatTriageResponseTool = createTool({
  id: 'format-triage-response',
  description: 'Format the triage response for Telex integration',
  inputSchema: z.object({
    needsUrgentTriage: z.boolean(),
    priorityLevel: z.enum(['low', 'medium', 'high']),
    suggestedActions: z.array(z.string()),
    reason: z.string(),
    keywordsFound: z.array(z.string()),
  }),
  outputSchema: z.object({
    formattedResponse: z.string(),
    telexActions: z.array(z.string()),
    visualIndicator: z.string(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { needsUrgentTriage, priorityLevel, suggestedActions, reason, keywordsFound } = context;

    const visualIndicator = needsUrgentTriage
      ? "🔴"
      : priorityLevel === "high"
        ? "🔴"
        : priorityLevel === "medium"
          ? "🟡"
          : "🟢";

    // Dynamic response message based on urgency
    let responseMessage = "";

    if (needsUrgentTriage || priorityLevel === "high") {
      responseMessage = `Your message has been received and marked as *high priority*. Our support team will work on it immediately to resolve the issue.`;
    } else if (priorityLevel === "medium") {
      responseMessage = `Your message has been received and will be attended to shortly. We’ve noted some issues that require attention, and our team will follow up soon.`;
    } else {
      responseMessage = `Your message has been received. It doesn't appear urgent, but we’ll review it and get back to you when possible.`;
    }

    const formattedResponse = `
${visualIndicator} ${responseMessage}

📝 *Summary*
---------------------------------------
• Priority Level: ${priorityLevel.toUpperCase()}
• Urgent Triage: ${needsUrgentTriage ? "Yes" : "No"}
• Reason: ${reason}
• Keywords Detected: ${keywordsFound.join(", ") || "None"}
• Suggested Actions: ${suggestedActions.join(", ")}
---------------------------------------
Timestamp: ${new Date().toISOString()}
Response ID: tri_${Date.now()}
`;

    const summary = `Priority: ${priorityLevel.toUpperCase()} | Keywords: ${keywordsFound.length} | Urgent: ${needsUrgentTriage ? "YES" : "NO"}`;

    return {
      formattedResponse,
      telexActions: suggestedActions,
      visualIndicator,
      summary,
    };
  }

});

export const supportTools = {
  keywordDetectionTool,
  formatTriageResponseTool,
};
