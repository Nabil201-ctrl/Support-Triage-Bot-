import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

/* 🧠 STEP 1: Keyword detection */
const keyword = createStep({
  id: "detect-keywords",
  description: "Detect priority keywords in support messages",
  inputSchema: z.object({
    message: z.string().describe("The support message to analyze"),
  }),
  outputSchema: z.object({
    highPriorityKeywords: z.array(z.string()),
    mediumPriorityKeywords: z.array(z.string()),
    lowPriorityKeywords: z.array(z.string()),
    allKeywords: z.array(z.string()),
    keywordCount: z.number(),
    urgencyScore: z.number().min(0).max(10),
    noMatchMessage: z.string().optional(),
  }),
  execute: async ({ context }) => {
    if (!context) throw new Error("Input data not found");
    const message = context.message.toLowerCase();

    // Define keyword groups
    const highPriority = [
      "broken",
      "crash",
      "emergency",
      "urgent",
      "not working",
      "error",
      "failed",
      "down",
      "critical",
      "outage",
    ];
    const mediumPriority = [
      "issue",
      "problem",
      "help",
      "question",
      "how to",
      "stuck",
      "trouble",
      "not sure",
      "confused",
      "slow",
    ];
    const lowPriority = [
      "thanks",
      "thank you",
      "feature",
      "suggestion",
      "idea",
      "maybe",
      "when",
      "can you",
      "would like",
    ];

    const foundHigh = highPriority.filter((k) => message.includes(k));
    const foundMedium = mediumPriority.filter((k) => message.includes(k));
    const foundLow = lowPriority.filter((k) => message.includes(k));
    const allFound = [...foundHigh, ...foundMedium, ...foundLow];

    // Calculate urgency
    let urgencyScore = 0;
    if (foundHigh.length > 0) urgencyScore = 8 + foundHigh.length * 0.5;
    else if (foundMedium.length > 0) urgencyScore = 4 + foundMedium.length * 0.3;
    else if (foundLow.length > 0) urgencyScore = 1 + foundLow.length * 0.1;
    urgencyScore = Math.min(10, urgencyScore);

    // If no keywords found — instruct user
    let noMatchMessage = "";
    if (allFound.length === 0) {
      noMatchMessage = `Your message doesn't match any known issue type. Please try rephrasing your request using one or more of the following keywords:\n\n🟥 *High Priority:* ${highPriority.join(
        ", "
      )}\n🟨 *Medium Priority:* ${mediumPriority.join(
        ", "
      )}\n🟩 *Low Priority:* ${lowPriority.join(", ")}.`;
    }

    return {
      highPriorityKeywords: foundHigh,
      mediumPriorityKeywords: foundMedium,
      lowPriorityKeywords: foundLow,
      allKeywords: allFound,
      keywordCount: allFound.length,
      urgencyScore,
      noMatchMessage,
    };
  },
});

/* 🧾 STEP 2: Response formatting */
const format = createStep({
  id: "format-triage-response",
  description: "Format the triage response for Telex integration",
  inputSchema: z.object({
    needsUrgentTriage: z.boolean(),
    priorityLevel: z.enum(["low", "medium", "high"]),
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
    if (!context) throw new Error("Input data not found");

    const {
      needsUrgentTriage,
      priorityLevel,
      suggestedActions,
      reason,
      keywordsFound,
    } = context;

    const visualIndicator = needsUrgentTriage
      ? "🔴"
      : priorityLevel === "high"
        ? "🔴"
        : priorityLevel === "medium"
          ? "🟡"
          : "🟢";

    // Dynamic human-like response
    let responseMessage = "";
    if (needsUrgentTriage || priorityLevel === "high") {
      responseMessage = `${visualIndicator} Your message has been received and marked as *high priority*. Our support team will work on it immediately to resolve the issue.`;
    } else if (priorityLevel === "medium") {
      responseMessage = `${visualIndicator} Your message has been received and will be attended to shortly. We’ve noted some issues that require attention, and our team will follow up soon.`;
    } else {
      responseMessage = `${visualIndicator} Your message has been received. It doesn't appear urgent, but we’ll review it and get back to you when possible.`;
    }

    const formattedResponse = `
${responseMessage}

📝 Summary
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

    const summary = `Priority: ${priorityLevel.toUpperCase()} | Keywords: ${keywordsFound.length
      } | Urgent: ${needsUrgentTriage ? "YES" : "NO"}`;

    return {
      formattedResponse,
      telexActions: suggestedActions,
      visualIndicator,
      summary,
    };
  },
});

/* 🚀 Workflows */
export const KeywordWorkflow = createWorkflow({
  id: "detect-keywords",
  inputSchema: z.object({
    message: z.string().describe("The support message to analyze"),
  }),
  outputSchema: z.object({
    highPriorityKeywords: z.array(z.string()),
    mediumPriorityKeywords: z.array(z.string()),
    lowPriorityKeywords: z.array(z.string()),
    allKeywords: z.array(z.string()),
    keywordCount: z.number(),
    urgencyScore: z.number().min(0).max(10),
    noMatchMessage: z.string().optional(),
  }),
})
  .then(keyword)
  .commit();

export const formatWorkflow = createWorkflow({
  id: "format-triage-response",
  inputSchema: z.object({
    needsUrgentTriage: z.boolean(),
    priorityLevel: z.enum(["low", "medium", "high"]),
    suggestedActions: z.array(z.string()),
    reason: z.string(),
    keywordsFound: z.array(z.string()),
  }),
  outputSchema: z.object({
    formattedResponse: z.string().optional(),
    telexActions: z.array(z.string()).optional(),
    visualIndicator: z.string().optional(),
    summary: z.string().optional(),
  }),
})
  .then(format)
  .commit();
