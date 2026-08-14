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

module.exports = {
    parseVoiceExpenseIntent
};
