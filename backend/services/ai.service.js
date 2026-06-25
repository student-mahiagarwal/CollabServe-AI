import { GoogleGenAI } from '@google/genai';

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
        throw new Error('AI returned empty response');
    }

    try {
        JSON.parse(value);
        return value;
    } catch {
        console.error('Invalid JSON returned by AI:', value);

        const match = value.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                JSON.parse(match[ 0 ]);
                return match[ 0 ];
            } catch {
                // Fall through to the consistent invalid JSON error below.
            }
        }

        throw new Error('AI returned invalid JSON');
    }
}

function safeGeminiError(error) {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
    const rawMessage = error?.message || '';

    console.error('Gemini request failed:', error);

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
    console.log("main upar hu" +process.env.GEMINI_API_KEY);
    // console.log("second log " +  JSON.stringify(process.env)); 
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(apiKey +  "main idhar hu bhencho"); 
    if (!apiKey) {
        throw new Error('Set GEMINI_API_KEY in backend/.env');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
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
        throw new Error(safeGeminiError(error));
    }
}

export const generateResult = async prompt => {
    if (!prompt?.trim()) {
        throw new Error('Prompt is required');
    }

    return generateWithGemini(prompt.trim());
};
