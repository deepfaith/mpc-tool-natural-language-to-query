import { getDbSchema, executeDbQuery, getActiveDbType } from '../utils/dbHelpers.js';
import * as aiHelpers from '../utils/aiHelpers.js';
import { formatResultsSummary } from '../utils/dataFormatter.js';
import { generateQueryPrompt, generateResultSummaryPrompt } from '../utils/aiPrompts.js';

/**
 * Handles AI-powered natural language queries
 * Converts NL → DB Query → Result → Summary
 */
export const handleNaturalLanguageQuery = async (req, res) => {
  const { query } = req.body;
  const appConfig = req.appConfig;
  const role = req.user?.role || 'guest';
  const redactFields = appConfig.redactFieldsForRoles?.[role] || [];

  if (!query?.trim()) {
    return res.status(400).json({ error: { code: 400, message: 'Missing or empty "query" field.' } });
  }

  console.log(`[▶] NL Query: "${query}" from role: ${role}`);

  try {
    // Step 1: Get schema + generate AI database query
    const schema = await getDbSchema();
    const dbType = getActiveDbType();
    const prompt = generateQueryPrompt(JSON.stringify(schema, null, 2), dbType, query);

    const aiResponseRaw = await aiHelpers.callAiApi(prompt, appConfig);
    const cleanedQuery = aiHelpers.cleanMarkdownResponse(aiResponseRaw).replace(/[^\x20-\x7E\t\n\r]/g, '').trim();

    // For Supabase (PostgreSQL), we expect SQL queries
    const generatedDbQuery = cleanedQuery; // raw SQL
    const q = cleanedQuery.toLowerCase();
    const blockedWords = ['drop', 'alter', 'delete', 'insert', 'update', 'truncate'];
    if (!q.startsWith('select') || blockedWords.some(w => q.includes(w))) {
      throw new Error('SQL query is invalid or dangerous (non-SELECT or contains DML/DDL).');
    }

    // Step 2: Execute DB query
    const rawDbData = await executeDbQuery(generatedDbQuery);

    // Step 3: Let AI summarize results (or fallback)
    let aiSummary = "Summary not available.";
    try {
      aiSummary = await aiHelpers.callAiApi(
        generateResultSummaryPrompt(query, rawDbData),
        appConfig
      );
    } catch (e) {
      console.warn('[⚠️] AI Summary generation failed:', e.message);
    }

    // Step 4: Return both summary and masked data
    const summary = formatResultsSummary(rawDbData, {
      maskFields: redactFields,
      role
    });

    res.json({
      data: rawDbData,
      masked_summary: summary,
      ai_summary: aiSummary
    });

  } catch (err) {
    console.error('[❌] handleNaturalLanguageQuery Error:', err.message);
    res.status(500).json({
      error: { code: 500, message: `Could not process query: ${err.message}` }
    });
  }
};
