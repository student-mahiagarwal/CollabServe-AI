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

If user asks for HTML → ALWAYS return index.html file.
`;
// ✅ Extract response text safely
function extractGeminiText(data) {
    return data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
        .trim();
}

// ✅ Clean markdown if AI adds it
function cleanJson(text) {
    return text
        ?.replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
}

//  Ensure valid JSON
function ensureJsonString(text) {
    const value = cleanJson(text);

    if (!value) {
        throw new Error('AI returned empty response');
    }

    try {
        JSON.parse(value);
        return value;
    } catch {
        console.error("INVALID JSON FROM AI:", value);

        // 🔥 Try to extract valid JSON
        const match = value.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                JSON.parse(match[0]);
                return match[0];
            } catch {}
        }

        throw new Error('AI returned invalid JSON');
    }
}

// ✅ Hide API key in errors
function safeGeminiError(error) {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
    const rawMessage = error?.message || '';

    // ✅ Show full error in terminal
    console.error("FULL GEMINI ERROR:", error);

    const redactedMessage = rawMessage
        .replaceAll(key, '[redacted]')
        .replace(/AIza[0-9A-Za-z_-]+/g, '[redacted]');

    // ✅ DO NOT override error blindly
    return redactedMessage || 'Gemini request failed.';
}

// ✅ MAIN FUNCTION
async function generateWithGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    console.log("API KEY LOADED:", !!apiKey); // ✅ add here


    if (!apiKey) {
        throw new Error('Set GEMINI_API_KEY in backend/.env');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: systemPrompt + "\n\n" + prompt
                        }
                    ]
                }
            ],
            config: {
                systemInstruction: {
                    role: "system",
                    parts: [{ text: systemPrompt }]
                },
                temperature: 0.2,
                maxOutputTokens: 8192,
            }
        });

        return ensureJsonString(extractGeminiText(response));

    } catch (error) {
        throw new Error(safeGeminiError(error));
    }
}

// ✅ Exported function
export const generateResult = async (prompt) => {
    if (!prompt?.trim()) {
        throw new Error('Prompt is required');
    }

    return generateWithGemini(prompt);
};