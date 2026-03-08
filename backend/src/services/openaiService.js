const OpenAI = require('openai');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const logger = require('../config/logger');

// Groq uses OpenAI-compatible SDK - just swap the baseURL and API key
let groqClient = null;

const getClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      logger.warn('GROQ_API_KEY not set - AI features will be disabled');
      return null;
    }
    // Groq is fully compatible with the OpenAI SDK
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return groqClient;
};

/**
 * Transcribe audio using Groq Whisper API (whisper-large-v3)
 * Groq offers free Whisper transcription — much faster than OpenAI
 * @param {string} filePath - Path to audio file
 * @param {string} language - Language hint (optional)
 * @returns {Object} - Transcription result
 */
const transcribeAudio = async (filePath, language = null) => {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY not set. Get a free key at https://console.groq.com');

  const startTime = Date.now();

  try {
    logger.info(`Starting Groq Whisper transcription for: ${filePath}`);

    const params = {
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3',   // Best free Whisper model on Groq
      response_format: 'verbose_json',
      temperature: 0,
    };
    if (language) params.language = language;

    const response = await client.audio.transcriptions.create(params);
    const processingTime = Date.now() - startTime;

    logger.info(`Groq transcription completed in ${processingTime}ms`);

    return {
      text: response.text,
      language: response.language || language || 'en',
      segments: (response.segments || []).map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text,
        confidence: s.avg_logprob ? Math.exp(s.avg_logprob) : 0.95,
      })),
      processingTime,
    };
  } catch (error) {
    logger.error('Groq Whisper transcription failed:', error.message);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

/**
 * Generate structured medical summary using Groq LLaMA 3 (free)
 * Uses llama-3.3-70b-versatile — very capable for medical summarization
 * @param {string} transcript - Full transcription text
 * @param {string} template - Summary template (SOAP, APSO, etc.)
 * @param {Object} sessionMeta - Session metadata
 * @returns {Object} - Structured medical summary
 */
const generateMedicalSummary = async (transcript, template = 'SOAP', sessionMeta = {}) => {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY not set. Get a free key at https://console.groq.com');

  const systemPrompt = `You are an expert medical scribe AI trained in clinical documentation.
Your task is to analyze a doctor-patient consultation transcript and generate a structured ${template} medical note.

IMPORTANT RULES:
1. Extract ONLY information explicitly mentioned in the transcript
2. Use proper medical terminology
3. Be concise but comprehensive
4. If information is not mentioned, write "Not discussed" or "Not applicable"
5. For prescriptions, include: drug name, dose, frequency, duration
6. Suggest appropriate ICD-10 and CPT codes based on the content

You MUST respond ONLY with valid JSON — no extra text, no markdown, no explanation.
Use exactly this JSON structure:
{
  "chiefComplaint": "...",
  "historyOfPresentIllness": "...",
  "pastMedicalHistory": "...",
  "medications": "...",
  "allergies": "...",
  "assessment": "...",
  "plan": "...",
  "prescription": "...",
  "followUp": "...",
  "icdCodes": [{"code": "Z00.00", "description": "Encounter for general adult medical examination", "confidence": 0.9}],
  "cptCodes": [{"code": "99213", "description": "Office visit, established patient, moderate complexity", "confidence": 0.85}],
  "confidenceScore": 85
}`;

  const userPrompt = `Patient consultation transcript:
Session Type: ${sessionMeta.sessionType || 'consultation'}
Doctor: ${sessionMeta.doctorName || 'Unknown'}

TRANSCRIPT:
${transcript}

Generate a ${template} medical note from this transcript. Return ONLY valid JSON.`;

  try {
    logger.info(`Generating ${template} summary with Groq LLaMA for session ${sessionMeta.sessionId}`);

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',   
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    // Strip any accidental markdown fences
    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    logger.info('Groq summary generated successfully');
    return { ...parsed, model: 'llama-3.3-70b-versatile' };
  } catch (error) {
    logger.error('Groq summary generation failed:', error.message);
    throw new Error(`Summary generation failed: ${error.message}`);
  }
};

/**
 * Suggest ICD-10 and CPT codes using Groq LLaMA (free)
 * @param {string} clinicalText - Assessment or plan text
 * @returns {Object} - Suggested codes
 */
const suggestMedicalCodes = async (clinicalText) => {
  const client = getClient();
  if (!client) return { icdCodes: [], cptCodes: [] };

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a medical coding expert. Suggest ICD-10-CM and CPT codes from clinical text.
Return ONLY valid JSON, no extra text:
{"icdCodes":[{"code":"...","description":"...","confidence":0.9}],"cptCodes":[{"code":"...","description":"...","confidence":0.8}]}`,
        },
        { role: 'user', content: `Clinical text: ${clinicalText}` },
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{"icdCodes":[],"cptCodes":[]}';
    return JSON.parse(content.replace(/```json|```/g, '').trim());
  } catch (error) {
    logger.error('Groq code suggestion failed:', error.message);
    return { icdCodes: [], cptCodes: [] };
  }
};

module.exports = { transcribeAudio, generateMedicalSummary, suggestMedicalCodes, getClient };
