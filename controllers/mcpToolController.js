import { z } from 'zod';
import {
  executeNaturalLanguageQueryTool
} from './dynamicToolHandler.js';

export const getToolDefinitions = () => ({
  tools: [
    {
      name: 'dynamicQuery',
      method: 'dynamicQuery',
      description: 'Ask any question in natural language to explore the database',
      parameters: z.object({
        nl_query: z.string(),
        language: z.string().optional(),
        tone: z.string().optional()
      }),
      response: z.object({
        data: z.array(z.record(z.any())),
        masked_summary: z.string(),
        ai_summary: z.string()
      })
    }
  ]
});

export const toolRegistry = {
  dynamicQuery: {
    handler: executeNaturalLanguageQueryTool,
    schema: z.object({
      nl_query: z.string(),
      language: z.string().optional(),
      tone: z.string().optional()
    })
  }
};
