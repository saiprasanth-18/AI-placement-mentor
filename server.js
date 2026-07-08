import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/generative-ai';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');
const app = express();
app.use(cors());
app.use(express.json());
// Helper to read database
function readDb() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db.json, returning empty template:', error);
    return { stats: {}, dsaProblems: [], aptitudeQuizzes: {} };
  }
}
// Helper to write database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to db.json:', error);
    return false;
  }
}
// Helper to get Gemini Client
function getGeminiClient(req) {
  // Check request headers or environment variables
  const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  // Initialize SDK
  return new GoogleGenAI({ apiKey });
}
// Check API Key Status
app.get('/api/status', (req, res) => {
  const envKeyExists = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'online',
    envKeyExists,
    localTime: new Date().toISOString()
  });
});
// Load DB
app.get('/api/db', (req, res) => {
  res.json(readDb());
});
// Save Stats
app.post('/api/stats', (req, res) => {
  const db = readDb();
  db.stats = { ...db.stats, ...req.body };
  writeDb(db);
  res.json({ success: true, stats: db.stats });
});
// DSA Hint Endpoint using Gemini API
app.post('/api/dsa/hint', async (req, res) => {
  const { problemTitle, problemDescription, constraints, currentCode, language, hintNumber } = req.body;
  const ai = getGeminiClient(req);
  if (!ai) {
    // Return mock hints if no API Key provided
    return res.json({
      hint: `[MOCK MODE - API Key not set] Hint #${hintNumber || 1} for "${problemTitle}":\n` +
            `• Review the constraints: is an O(N^2) solution acceptable, or do we need O(N) or O(N log N)?\n` +
            `• Check if there is an off-by-one index error in your loop initialization.\n` +
            `• Try to use a HashMap / Dictionary to store elements for O(1) lookup speed.\n\n` +
            `*Tip: Go to Settings to enter your Gemini API Key for real-time AI mentoring!*`
    });
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are an expert DSA Coach preparing a student for placement interviews.
The student is working on the problem: "${problemTitle}".
Description:
${problemDescription}
Constraints:
${constraints}
The student is writing in: ${language}.
Their current draft code is:
\`\`\`${language}
${currentCode}
\`\`\`
Request: The student wants Hint #${hintNumber || 1}.
Give a short, helpful, conversational hint (max 120 words).
Do NOT write the code solution. Give a logical clue, algorithmic suggestion, or help debug their current code structure.
Keep it encouraging and mentor-like.
`;
    const result = await model.generateContent(prompt);
    res.json({ hint: result.response.text });
  } catch (error) {
    console.error('Gemini API Error (dsa/hint):', error);
    res.status(500).json({ error: 'Failed to generate hint from AI', details: error.message });
  }
});
// Mock/HR Interview Chat Endpoint
app.post('/api/interview/chat', async (req, res) => {
  const { messages, role, type } = req.body;
  const ai = getGeminiClient(req);
  if (!ai) {
    // Generate a simple mock follow-up question
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    let responseText = '';
    
    if (messages.length === 1) {
      responseText = type === 'HR' 
        ? `Hello! Thank you for joining today. Let's start with a classic: Tell me about yourself, your background, and why you are interested in a ${role} position.`
        : `Welcome. Let's begin the technical screening for the ${role} position. Can you describe a challenging technical project you worked on recently, particularly focusing on the architecture and any trade-offs you made?`;
    } else {
      responseText = `[MOCK MODE - API Key not set] Interesting answer! You mentioned: "${lastUserMessage.slice(0, 50)}...". Can you expand on how you handled communication and collaboration during that project, and how you measured its success?`;
    }
    
    return res.json({ message: responseText });
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const systemPrompt = `
You are an expert ${type === 'HR' ? 'HR Manager' : 'Technical Lead'} conducting a placement interview for a candidate seeking a "${role}" position.
Your goal is to conduct a professional, interactive interview.
Guidelines:
- Ask exactly ONE question at a time.
- Adapt to the candidate's previous response. Be conversational but formal.
- If it's the Technical interview, ask questions about coding practices, data structures, system design, or engineering scenarios relevant to a ${role}.
- If it's the HR interview, focus on behavioral questions, team dynamics, handling conflict, leadership, and STAR format responses.
- Keep responses relatively brief (max 100 words per turn) to keep the chat interactive.
`;
    // Map message history into standard prompt
    const formattedHistory = messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nHere is the conversation so far:\n${formattedHistory}\n\nProvide the next single response or question as the Interviewer.`;
    const result = await model.generateContent(prompt);
    res.json({ message: result.response.text });
  } catch (error) {
    console.error('Gemini API Error (interview/chat):', error);
    res.status(500).json({ error: 'Failed to generate interview response', details: error.message });
  }
});
// Interview Evaluation Endpoint
app.post('/api/interview/evaluate', async (req, res) => {
  const { messages, role, type } = req.body;
  const ai = getGeminiClient(req);
  if (!ai) {
    // Return mock evaluation
    return res.json({
      score: 78,
      strengths: [
        "Structured explanations of engineering choices.",
        "Good professional tone and technical vocabulary."
      ],
      weaknesses: [
        "Could provide more quantitative metrics for project impact.",
        "For HR questions, make sure to explicitly cover the Result part of the STAR method."
      ],
      improvementTips: "Practice using the STAR framework (Situation, Task, Action, Result) for behavioral questions. Focus on expressing what *you* specifically did and what the numeric outcome was.",
      detailedSummary: "Overall a good attempt. The candidate demonstrates strong foundational knowledge but needs to refine communication to highlight personal achievements and handle code efficiency queries better."
    });
  }
  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const prompt = `
Analyze the following interview transcript between a Candidate and an Interviewer.
The target role was: "${role}".
Interview Type: "${type}".
Transcript:
${messages.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n')}
Evaluate the candidate's performance and respond with a JSON object containing:
- "score": An integer from 0 to 100.
- "strengths": An array of strings representing candidate's strengths in this interview.
- "weaknesses": An array of strings representing candidate's weaknesses/gaps.
- "improvementTips": A single string summarizing actionable tips for improvement.
- "detailedSummary": A detailed paragraph evaluating their communication, technical depth, and placement readiness.
Provide ONLY the valid JSON object. No markdown wrapper tags.
`;
    const result = await model.generateContent(prompt);
    let jsonText = result.response.text.trim();
    
    // Clean up code block ticks if Gemini adds them despite formatting requests
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    
    res.json(JSON.parse(jsonText));
  } catch (error) {
    console.error('Gemini API Error (interview/evaluate):', error);
    res.status(500).json({ error: 'Failed to analyze interview', details: error.message });
  }
});
// Resume Checker Endpoint
app.post('/api/resume/check', async (req, res) => {
  const { resumeText, targetRole } = req.body;
  const ai = getGeminiClient(req);
  if (!ai) {
    // Return mock resume score
    return res.json({
      score: 72,
      matchingKeywords: ["React", "JavaScript", "REST APIs", "Node.js"],
      missingKeywords: ["TypeScript", "CI/CD", "AWS", "Docker", "Unit Testing"],
      formattingFeedback: [
        "Ensure contact information is clear and at the very top.",
        "Your project descriptions are slightly wordy. Use bullet points."
      ],
      bulletImprovements: [
        {
          original: "Responsible for writing backend routes in Express.",
          improved: "Architected 15+ backend REST APIs using Node.js and Express, reducing server response times by 20% through query optimizations."
        },
        {
          original: "Helped fix bugs on the frontend website.",
          improved: "Resolved 40+ critical frontend rendering bugs in React, enhancing overall page loading speed by 15% and boosting User Experience scores."
        }
      ],
      generalSummary: "The resume contains solid core technical skills but is missing key cloud and DevOps keywords required for modern developer roles. Use action verbs and include metrics to show the impact of your work."
    });
  }
  try {
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const prompt = `
You are an expert recruiter and Resume ATS (Applicant Tracking System) optimizer.
Review the candidate's resume for the target job role: "${targetRole}".
Resume content:
${resumeText}
Analyze this resume and respond with a JSON object containing:
- "score": An integer from 0 to 100 representing how well the resume matches standard job requirements for the role.
- "matchingKeywords": Array of positive keywords/skills found in the resume.
- "missingKeywords": Array of standard skills or industry terms for a "${targetRole}" role that are missing.
- "formattingFeedback": Array of formatting or design suggestions.
- "bulletImprovements": Array of objects, each with "original" (a weak bullet point from the resume) and "improved" (a rewritten version of that bullet point using action verbs and strong, measurable impact). Max 3 items.
- "generalSummary": A comprehensive, constructive summary of recommendations.
Provide ONLY the valid JSON object. No markdown wrappers.
`;
    const result = await model.generateContent(prompt);
    let jsonText = result.response.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    res.json(JSON.parse(jsonText));
  } catch (error) {
    console.error('Gemini API Error (resume/check):', error);
    res.status(500).json({ error: 'Failed to analyze resume', details: error.message });
  }
});
// Aptitude Solution Explainer
app.post('/api/aptitude/explain', async (req, res) => {
  const { question, options, correctAnswerIndex, explanation } = req.body;
  const ai = getGeminiClient(req);
  if (!ai) {
    return res.json({
      detailedExplanation: `[MOCK MODE] Detailed step-by-step logic:\n\n` +
        `1. Read the question carefully: "${question}"\n` +
        `2. The options are: ${options.join(', ')}.\n` +
        `3. The correct option is "${options[correctAnswerIndex]}".\n` +
        `4. Quick logic: ${explanation}\n\n` +
        `*To unlock detailed AI explanations, add your Gemini API Key in Settings.*`
    });
  }
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
Explain the solution for the following aptitude quiz question:
Question: "${question}"
Options: ${options.map((o, idx) => `${idx + 1}. ${o}`).join(', ')}
Correct Answer: Option #${correctAnswerIndex + 1} (${options[correctAnswerIndex]})
Basic Formula/Explanation: ${explanation}
Provide a detailed, step-by-step, clean educational breakdown (max 150 words). Break down the formulas used, step-by-step derivation, and explain why the other options are incorrect. Keep it clear, logical, and formatting-friendly (use bullet points or numbers).
`;
    const result = await model.generateContent(prompt);
    res.json({ detailedExplanation: result.response.text });
  } catch (error) {
    console.error('Gemini API Error (aptitude/explain):', error);
    res.status(500).json({ error: 'Failed to explain solution', details: error.message });
  }
});
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
