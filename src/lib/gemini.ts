import { GoogleGenerativeAI } from '@google/generative-ai';

// We initialize safely: if no key is provided, the UI should ask for one or show a fallback.
const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

export interface AiBudgetRequest {
  age: number;
  monthlyEarnings: number;
  fieldOfWork: string;
  expectedIncrementPct: number;
  ambition: string;
}

export interface AiBudgetResponse {
  savingsBreakdown: {
    ambition: number;
    emergencyFund: number;
    miscellaneous: number;
    totalSavingsRequired: number;
  };
  stressMeter: {
    score: number;
    label: string;
    explanation: string;
  };
  timeAnalysis: {
    estimatedYears: number;
    achievable: boolean;
  };
  portfolioSplit: {
    equity: number;
    debt: number;
    gold: number;
    other: number;
  };
  portfolioAmounts: {
    equity: number;
    debt: number;
    gold: number;
    other: number;
  };
  wealthProjection: {
    age: number;
    wealth: number;
  }[];
  roadmap: {
    year: number;
    milestone: string;
    actionableAdvice: string;
  }[];
}

export const generateBudgetRoadmap = async (data: AiBudgetRequest): Promise<AiBudgetResponse> => {
  const genAI = getGenAI();
  if (!genAI) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment variables.");
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
    You are an expert, realistic financial advisor. 
    Analyze the following user profile and financial ambition:
    
    Age: ${data.age}
    Monthly Earnings: ₹${data.monthlyEarnings}
    Field of Work: ${data.fieldOfWork}
    Expected Annual Salary Increment: ${data.expectedIncrementPct}%
    Ultimate Ambition: "${data.ambition}"

    Provide a highly detailed, realistic financial plan to achieve this ambition. 
    Calculate compounding interest assuming an average 10-12% market return for equity.
    Take inflation into account. If the ambition is wildly unrealistic (like buying the Burj Khalifa on a 50k salary), 
    be honest, set the stress score high, and tell them exactly how long it would mathematically take.

    Output the response STRICTLY as a valid JSON object matching this exact typescript interface format (no markdown formatting, no code blocks, JUST the raw JSON string):
    {
      "savingsBreakdown": {
        "ambition": number (monthly amount in ₹),
        "emergencyFund": number (monthly amount in ₹),
        "miscellaneous": number (monthly amount in ₹ to enjoy life),
        "totalSavingsRequired": number (sum of the above)
      },
      "stressMeter": {
        "score": number 1 to 10 (10 being nearly impossible),
        "label": string ("Low", "Medium", "High", "Extreme"),
        "explanation": string (1-2 sentences explaining why this is hard/easy)
      },
      "timeAnalysis": {
        "estimatedYears": number,
        "achievable": boolean (true if achievable within their lifetime)
      },
      "portfolioSplit": {
        "equity": number (percentage 0-100),
        "debt": number (percentage 0-100),
        "gold": number (percentage 0-100),
        "other": number (percentage 0-100)
      },
      "portfolioAmounts": {
        "equity": number (monthly ₹ amount to invest in stocks/equity),
        "debt": number (monthly ₹ amount in bonds/FDs),
        "gold": number (monthly ₹ amount in gold/SGBs),
        "other": number (monthly ₹ amount in cash/liquid funds)
      },
      "wealthProjection": [
        {
          "age": number (the user's age at that point, starting from current age, one entry per year until goal achieved or age 70, whichever comes first),
          "wealth": number (estimated total accumulated wealth in ₹ at that age assuming compound growth)
        }
      ],
      "roadmap": [
        {
          "year": number (e.g. 1, 3, 5, 10),
          "milestone": string (e.g. "Hit ₹10 Lakhs Portfolio"),
          "actionableAdvice": string (What they should do in this phase)
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean the output in case the LLM wrapped it in markdown code blocks like \`\`\`json
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
    
    return JSON.parse(cleanText) as AiBudgetResponse;
  } catch (error: any) {
    console.error("Error generating AI Roadmap:", error);
    throw new Error(`Failed to generate AI Roadmap: ${error?.message || "Unknown error"}. Please check your connection and try again.`);
  }
};
