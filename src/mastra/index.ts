import { Mastra } from "@mastra/core/mastra";
import { supportTriageAgent } from "./agents/trage-agent";
import { analyzeSupportMessageToolWorkFlow, formatTriageResponseToolWorkFlow } from "./workflow/triageworkflow";
import { a2aAgentRoute } from "./routes/route";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from '@mastra/loggers';
export const mastra = new Mastra({
  workflows: {
    analyzeSupportMessageToolWorkFlow,
    formatTriageResponseToolWorkFlow
  },
  agents: { supportTriageAgent },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'debug',
  }),
  observability: {
    default: { enabled: true },
  },
  server: {
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
    apiRoutes: [
    a2aAgentRoute
    ]
  }
});
