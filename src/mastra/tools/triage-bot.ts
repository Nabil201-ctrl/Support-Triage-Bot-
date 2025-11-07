// src/tools/support-tools.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const analyzeSupportMessageTool = createTool({
  id: 'analyze-support-message',
  description: 'Analyze support message for priority using exact keyword detection',
  inputSchema: z.object({
    message: z.string().describe('The support message to analyze'),
  }),
  outputSchema: z.object({
    needs_urgent_triage: z.boolean(),
    priority_level: z.enum(['low', 'medium', 'high']),
    suggested_actions: z.array(z.string()),
    reason: z.string(),
    keywords_found: z.array(z.string()),
    no_keywords_message: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const message = context.message.toLowerCase();

    // Define keyword groups
    const highPriority = ['broken', 'crash', 'emergency', 'urgent', 'not working', 'error', 'failed', 'down', 'critical', 'outage'];
    const mediumPriority = ['issue', 'problem', 'help', 'question', 'how to', 'stuck', 'trouble', 'not sure', 'confused', 'slow'];
    const lowPriority = ['thanks', 'thank you', 'feature', 'suggestion', 'idea', 'maybe', 'when', 'can you', 'would like'];

    // Find keywords using exact matching
    const foundHigh = highPriority.filter(keyword => message.includes(keyword));
    const foundMedium = mediumPriority.filter(keyword => message.includes(keyword));
    const foundLow = lowPriority.filter(keyword => message.includes(keyword));
    const allFound = [...foundHigh, ...foundMedium, ...foundLow];

    // Determine priority level and urgency
    let priority_level: 'low' | 'medium' | 'high' = 'low';
    let needs_urgent_triage = false;
    let reason = 'No priority keywords detected';
    let no_keywords_message = '';

    if (foundHigh.length > 0) {
      priority_level = 'high';
      needs_urgent_triage = true;
      reason = `Found high priority keywords: ${foundHigh.join(', ')}`;
    } else if (foundMedium.length > 0) {
      priority_level = 'medium';
      reason = `Found medium priority keywords: ${foundMedium.join(', ')}`;
    } else if (foundLow.length > 0) {
      priority_level = 'low';
      reason = `Found low priority keywords: ${foundLow.join(', ')}`;
    }

    // If no keywords found, create instructional message
    if (allFound.length === 0) {
      no_keywords_message = `Your message doesn't match any known issue type. Please try rephrasing your request using one or more of the following keywords:\n\n🟥 High Priority: ${highPriority.join(', ')}\n🟨 Medium Priority: ${mediumPriority.join(', ')}\n🟩 Low Priority: ${lowPriority.join(', ')}`;
    }

    // Determine suggested actions based on priority
    let suggested_actions: string[] = [];
    if (priority_level === 'high') {
      suggested_actions = ['add_red_circle_reaction', 'post_urgent_thread_reply', 'notify_engineering_team'];
    } else if (priority_level === 'medium') {
      suggested_actions = ['add_yellow_circle_reaction', 'post_standard_thread_reply'];
    } else {
      suggested_actions = ['add_green_circle_reaction', 'post_follow_up_later'];
    }

    return {
      needs_urgent_triage,
      priority_level,
      suggested_actions,
      reason,
      keywords_found: allFound,
      no_keywords_message: no_keywords_message || undefined,
    };
  },
});

export const formatTriageResponseTool = createTool({
  id: 'format-triage-response',
  description: 'Format the triage response for Telex integration with visual indicators',
  inputSchema: z.object({
    needs_urgent_triage: z.boolean(),
    priority_level: z.enum(['low', 'medium', 'high']),
    suggested_actions: z.array(z.string()),
    reason: z.string(),
    keywords_found: z.array(z.string()),
    no_keywords_message: z.string().optional(),
  }),
  outputSchema: z.object({
    formattedResponse: z.string(),
    telexActions: z.array(z.string()),
    visualIndicator: z.string(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { needs_urgent_triage, priority_level, suggested_actions, reason, keywords_found, no_keywords_message } = context;

    // If no keywords were found, return the instructional message
    if (no_keywords_message) {
      return {
        formattedResponse: no_keywords_message,
        telexActions: ['add_grey_circle_reaction', 'post_instructional_reply'],
        visualIndicator: '⚪',
        summary: 'No keywords detected - Instructional response sent',
      };
    }

    const visualIndicator = needs_urgent_triage
      ? "🔴"
      : priority_level === "high"
        ? "🔴"
        : priority_level === "medium"
          ? "🟡"
          : "🟢";

    // Dynamic response message based on urgency
    let responseMessage = "";
    if (needs_urgent_triage || priority_level === "high") {
      responseMessage = `Your message has been received and marked as *high priority*. Our support team will work on it immediately to resolve the issue.`;
    } else if (priority_level === "medium") {
      responseMessage = `Your message has been received and will be attended to shortly. We've noted some issues that require attention, and our team will follow up soon.`;
    } else {
      responseMessage = `Your message has been received. It doesn't appear urgent, but we'll review it and get back to you when possible.`;
    }

    const formattedResponse = `${visualIndicator} ${responseMessage}

📝 Summary
---------------------------------------
• Priority Level: ${priority_level.toUpperCase()}
• Urgent Triage: ${needs_urgent_triage ? "Yes" : "No"}
• Reason: ${reason}
• Keywords Detected: ${keywords_found.join(", ")}
• Suggested Actions: ${suggested_actions.join(", ")}
---------------------------------------
Timestamp: ${new Date().toISOString()}
Response ID: tri_${Date.now()}
`;

    const summary = `Priority: ${priority_level.toUpperCase()} | Keywords: ${keywords_found.length} | Urgent: ${needs_urgent_triage ? "YES" : "NO"}`;

    return {
      formattedResponse,
      telexActions: suggested_actions,
      visualIndicator,
      summary,
    };
  }
});

