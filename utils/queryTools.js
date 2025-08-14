import { z } from 'zod';
import { getDbSchema, executeDbQuery, getActiveDbType } from '../utils/dbHelpers.js';
import { callAiApi } from '../utils/aiHelpers.js';
import { generateQueryPrompt, generateResultSummaryPrompt } from '../utils/aiPrompts.js';
import { formatResultsSummary } from '../utils/dataFormatter.js';

export const responseSchema = z.object({
  content: z.array(
    z.object({
      type: z.literal("text"),
      text: z.string()
    })
  )
});

export const executeNaturalLanguageQueryTool = async (params, appConfig) => {
  const { nl_query, language = 'English', tone = 'neutral' } = params;

  const schema = await getDbSchema();
  const dbType = getActiveDbType();
  const schemaString = JSON.stringify(schema, null, 2);

  const prompt = generateQueryPrompt(schemaString, dbType, nl_query, { language, tone });
  const generatedQuery = await callAiApi(prompt, appConfig);
  const results = await executeDbQuery(generatedQuery);

  const summaryPrompt = generateResultSummaryPrompt(nl_query, results, { language, tone });
  const aiSummary = await callAiApi(summaryPrompt, appConfig);

  const summary = formatResultsSummary(results, {
    maskFields: appConfig.maskFields,
    role: appConfig.role || 'guest'
  });

  return responseSchema.parse({
    content: [
      { data: summary },
      { summary: aiSummary }
    ]
  });
};
