import axios from 'axios';

import { config as loadEnv } from 'dotenv';
loadEnv();

/**
 * Cleans a string that might contain markdown code blocks (e.g., ```json ... ```).
 * Extracts and returns the inside content. If no code block, tries to extract the first valid JSON object.
 * Returns original string if no JSON found.
 */
export const cleanMarkdownResponse = (text) => {
  // Try to extract from code block first
  const codeBlockRegex = /```(?:json)?[\r\n]+([\s\S]*?)```/i;
  const match = text.match(codeBlockRegex);
  let candidate = (match && match[1]) ? match[1].trim() : text.trim();

  // Try to extract the first valid JSON object
  const firstBrace = candidate.indexOf('{');
  if (firstBrace === -1) return candidate;
  let depth = 0, inString = false, escape = false, end = -1;
  for (let i = firstBrace; i < candidate.length; i++) {
    const char = candidate[i];
    if (inString) {
      if (escape) escape = false;
      else if (char === '\\') escape = true;
      else if (char === '"') inString = false;
    } else {
      if (char === '"') inString = true;
      else if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
  }
  if (end !== -1) {
    return candidate.slice(firstBrace, end);
  }
  return candidate;
};

/**
 * Calls the OpenAI API to generate responses.
 * Returns the AI-generated content as a string.
 */
export const callAiApi = async (prompt, config) => {
  // Use environment variable if available, fallback to config
  const openaiApiKey = process.env.OPENAI_API_KEY || config.openaiApiKey;

  const isValidApiKey = (key) =>
    key && typeof key === 'string' && key.trim() !== '' && !key.startsWith('YOUR_');

  // OpenAI
  if (isValidApiKey(openaiApiKey)) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          timeout: 8000,
        }
      );
      if (response.data?.choices?.[0]?.message?.content)
        return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error('OpenAI API call failed: ' + error.message);
    }
  }

  throw new Error('No valid OpenAI API key provided. Please set OPENAI_API_KEY environment variable or update config.json');
};
