import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { badRequest } from '../lib/errors.js';

const systemPrompt = `
You are an expert AI developer inside a realtime MERN coding workspace.

IMPORTANT RULES:
- You MUST return ONLY valid JSON.
- DO NOT return plain text.
- DO NOT return explanation outside JSON.
- ALWAYS include fileTree with full file contents.

STRICT FORMAT:
{
  "text": "short explanation",
  "fileTree": {
    "index.html": {
      "file": {
        "contents": "<!DOCTYPE html>..."
      }
    }
  },
  "buildCommand": null,
  "startCommand": null
}

If the user asks for HTML, always return an index.html file.
`;

function extractGeminiText(data) {
    return data?.candidates?.[ 0 ]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
        .trim();
}

function cleanJson(text) {
    return text
        ?.replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
}

function ensureJsonString(text) {
    const value = cleanJson(text);

    if (!value) {
        throw badRequest('AI returned empty response');
    }

    try {
        JSON.parse(value);
        return value;
    } catch {
        const match = value.match(/\{[\s\S]*\}/);

        if (match) {
            try {
                JSON.parse(match[ 0 ]);
                return match[ 0 ];
            } catch {
                // Fall through to invalid JSON error.
            }
        }

        throw badRequest('AI returned invalid JSON');
    }
}

function safeGeminiError(error) {
    const key = env.geminiApiKey || '';
    const rawMessage = error?.message || '';

    console.error('Gemini request failed:', rawMessage);

    if (/api key was reported as leaked/i.test(rawMessage)) {
        return 'Gemini API key was blocked because Google reported it as leaked. Create a new key, update GEMINI_API_KEY in backend/.env, and restart the backend.';
    }

    if (/permission_denied|api key/i.test(rawMessage)) {
        return 'Gemini API key is invalid or does not have permission. Update GEMINI_API_KEY in backend/.env and restart the backend.';
    }

    const redactedMessage = rawMessage
        .replaceAll(key, '[redacted]')
        .replace(/AIza[0-9A-Za-z_-]+/g, '[redacted]');

    return redactedMessage || 'Gemini request failed.';
}

async function generateWithGemini(prompt) {
    const apiKey = env.geminiApiKey;

    if (!apiKey) {
        throw badRequest('Set GEMINI_API_KEY in backend/.env');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: env.geminiModel,
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `${systemPrompt}\n\n${prompt}`,
                        },
                    ],
                },
            ],
            config: {
                systemInstruction: {
                    role: 'system',
                    parts: [ { text: systemPrompt } ],
                },
                temperature: 0.2,
                maxOutputTokens: 8192,
            },
        });

        return ensureJsonString(extractGeminiText(response));
    } catch (error) {
        if (error.isOperational) {
            throw error;
        }

        throw badRequest(safeGeminiError(error));
    }
}

export async function generateResult(prompt) {
    if (!prompt?.trim()) {
        throw badRequest('Prompt is required');
    }

    return generateWithGemini(prompt.trim());
}
