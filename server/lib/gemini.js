import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DOMAINS = [
  "Healthcare", "Legal", "Robotics", "Finance", "STEM",
  "Linguistics", "Philosophy", "Creative Writing", "Psychology", "Ethics"
];

export async function generateDailyTask(domain) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are generating an RLHF annotation task for Perle Labs contributors.

Domain: ${domain}

Generate a realistic user prompt in this domain, then generate two AI responses:
- Response A and Response B
- One should be clearly better (more accurate, safer, more helpful, better reasoned)
- One should be subtly or clearly flawed (wrong info, unsafe, unhelpful, poor reasoning)
- Randomize which one (A or B) is the correct answer

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "domain": "${domain}",
  "prompt": "the user question here",
  "responseA": "first AI response here",
  "responseB": "second AI response here",
  "correct": "A or B",
  "explanation": "brief explanation of why the correct response is better"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON robustly (Gemini thinking model may wrap output)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Gemini response");

  let cleaned = jsonMatch[0].replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(cleaned);
}

export function getTodayDomain() {
  const domains = DOMAINS;
  const dayIndex = Math.floor(Date.now() / 86400000) % domains.length;
  return domains[dayIndex];
}
