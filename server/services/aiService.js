const { GoogleGenAI } = require('@google/genai');

/**
 * Fallback parser in case GEMINI_API_KEY is not configured.
 * Uses regex and string matching to parse group, amount, and description.
 */
function fallbackParse(transcript, userGroups) {
    const text = transcript.toLowerCase();

    // 1. Match Group Name
    let matchedGroup = userGroups.find(g => text.includes(g.name.toLowerCase()));
    if (!matchedGroup) {
        // Partial word match fallback
        matchedGroup = userGroups.find(g => {
            const words = g.name.toLowerCase().split(' ');
            return words.some(w => w.length > 3 && text.includes(w));
        });
    }

    // 2. Match Amount (matches numbers like 1000, 500.50, $200, 1,500)
    const amountMatch = text.match(/(?:rupees|rs\.?|\$|amount of)?\s*(\d+(?:\.\d{1,2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // 3. Match Split Scheme
    let splitType = 'EQUAL';
    if (text.includes('exact')) splitType = 'EXACT';
    if (text.includes('percent') || text.includes('%')) splitType = 'PERCENT';

    // 4. Extract Description
    let description = transcript;
    const forMatch = transcript.match(/for\s+([^in|for|group|split]+)/i);
    if (forMatch && forMatch[1]) {
        description = forMatch[1].trim();
    } else if (matchedGroup) {
        description = `Expense in ${matchedGroup.name}`;
    }

    return {
        matchedGroupId: matchedGroup ? matchedGroup._id : (userGroups[0]?._id || null),
        matchedGroupName: matchedGroup ? matchedGroup.name : (userGroups[0]?.name || 'Group'),
        description: description.charAt(0).toUpperCase() + description.slice(1),
        amount,
        splitType
    };
}

/**
 * Parses a natural language voice transcript into structured expense fields.
 * Uses Google Gemini API if GEMINI_API_KEY is set, otherwise falls back to fallbackParse.
 */
async function parseVoiceExpenseIntent(transcript, userGroups) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.log('[AI Service] GEMINI_API_KEY not set. Using smart fallback parser.');
        return fallbackParse(transcript, userGroups);
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const groupsSummary = userGroups.map(g => `ID: ${g._id}, Name: "${g.name}"`).join('\n');

        const prompt = `
You are an AI assistant for an expense-splitting web app.
Parse the following spoken text into structured JSON:

Spoken Text: "${transcript}"

Available Groups:
${groupsSummary}

Instructions:
1. Find the best matching group from the list of Available Groups based on the spoken text. Return its ID as "matchedGroupId" and Name as "matchedGroupName". If no clear match is found, pick the first group ID.
2. Extract the total numeric amount as a number (e.g. 1000). Return as "amount".
3. Extract a short, clean description of the expense (e.g. "Dinner", "Goa Taxi", "Hotel Villa"). Return as "description".
4. Determine the split scheme: "EQUAL", "EXACT", or "PERCENT". Default to "EQUAL" if unspecified. Return as "splitType".

Return ONLY valid JSON matching this schema:
{
  "matchedGroupId": "string",
  "matchedGroupName": "string",
  "description": "string",
  "amount": number,
  "splitType": "EQUAL" | "EXACT" | "PERCENT"
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        return {
            matchedGroupId: parsed.matchedGroupId || userGroups[0]?._id,
            matchedGroupName: parsed.matchedGroupName || userGroups[0]?.name,
            description: parsed.description || 'Voice Expense',
            amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
            splitType: ['EQUAL', 'EXACT', 'PERCENT'].includes(parsed.splitType) ? parsed.splitType : 'EQUAL'
        };
    } catch (err) {
        console.error('[AI Service] Gemini parsing error:', err.message);
        return fallbackParse(transcript, userGroups);
    }
}
/**
 * Takes recorded microphone audio (base64) and parses it using Gemini 2.5 Flash multimodal audio input.
 */
async function parseAudioExpenseIntent(base64Audio, mimeType = 'audio/webm', userGroups = []) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const groupsSummary = userGroups.map(g => `ID: ${g._id}, Name: "${g.name}"`).join('\n');

    const promptText = `
You are an AI assistant for an expense-splitting web app.
Listen to this recorded audio clip carefully and extract the speech transcript and structured expense fields into JSON.

Available Groups:
${groupsSummary}

Instructions:
1. Transcribe the audio exact words into "transcript".
2. Match the best group from Available Groups. Return its ID as "matchedGroupId" and Name as "matchedGroupName".
3. Extract total numeric amount as a number (e.g. 1000). Return as "amount".
4. Extract a short clean description (e.g. "Dinner", "Taxi"). Return as "description".
5. Split scheme: "EQUAL", "EXACT", or "PERCENT". Default to "EQUAL". Return as "splitType".

Return ONLY valid JSON matching this schema:
{
  "transcript": "string",
  "matchedGroupId": "string",
  "matchedGroupName": "string",
  "description": "string",
  "amount": number,
  "splitType": "EQUAL" | "EXACT" | "PERCENT"
}
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                }
            },
            { text: promptText }
        ],
        config: {
            responseMimeType: 'application/json',
        }
    });

    const parsed = JSON.parse(response.text.trim());
    return {
        transcript: parsed.transcript || 'Voice Recording',
        matchedGroupId: parsed.matchedGroupId || userGroups[0]?._id,
        matchedGroupName: parsed.matchedGroupName || userGroups[0]?.name,
        description: parsed.description || 'Voice Expense',
        amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
        splitType: ['EQUAL', 'EXACT', 'PERCENT'].includes(parsed.splitType) ? parsed.splitType : 'EQUAL'
    };
}

/**
 * Takes a base64 encoded receipt image and parses it using Gemini 2.5 Flash multimodal vision input.
 */
async function parseReceiptImage(base64Image, mimeType = 'image/jpeg') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('[AI Service] GEMINI_API_KEY not set.');
        return {
            description: 'Receipt Expense',
            amount: 0,
            splitType: 'EQUAL'
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = `
You are an AI assistant for an expense-splitting web app.
Analyze this receipt image carefully and extract structured expense fields into JSON.

Instructions:
1. Extract the store/vendor name and item summary into a clean "description" (e.g. "D-Mart Groceries", "Starbucks Coffee", "Taxi Ride").
2. Extract the final total numeric amount paid as a number (e.g. 1450.50). Return as "amount".
3. Determine the split scheme: "EQUAL", "EXACT", or "PERCENT". Default to "EQUAL". Return as "splitType".

Return ONLY valid JSON matching this schema:
{
  "description": "string",
  "amount": number,
  "splitType": "EQUAL" | "EXACT" | "PERCENT"
}
`;

        // Safely extract base64 string regardless of prefix
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

        // Ensure valid mimeType format
        let safeMime = mimeType || 'image/jpeg';
        if (safeMime === 'image/jpg') safeMime = 'image/jpeg';

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: safeMime,
                        data: cleanBase64
                    }
                },
                { text: promptText }
            ],
            config: {
                responseMimeType: 'application/json',
            }
        });

        let jsonText = (response.text || '').trim();
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

        const parsed = JSON.parse(jsonText);
        return {
            description: parsed.description || 'Receipt Expense',
            amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
            splitType: ['EQUAL', 'EXACT', 'PERCENT'].includes(parsed.splitType) ? parsed.splitType : 'EQUAL'
        };
    } catch (err) {
        console.error('[AI Service] parseReceiptImage Error:', err.message);
        return {
            description: 'Receipt Expense',
            amount: 0,
            splitType: 'EQUAL'
        };
    }
}

module.exports = {
    parseVoiceExpenseIntent,
    parseAudioExpenseIntent,
    parseReceiptImage
};
