// api/scripts/gemini-test.mjs
import { VertexAI } from '@google-cloud/vertexai';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

console.log('[gemini-test] Loading environment...');
const project = process.env.GCP_PROJECT_ID;
const location = process.env.VERTEX_LOCATION;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!project || !location || !credentialsPath) {
  console.error('❌ Missing GCP_PROJECT_ID, VERTEX_LOCATION, or GOOGLE_APPLICATION_CREDENTIALS in .env');
  process.exit(1);
}

console.log('[gemini-test] Project:', project);
console.log('[gemini-test] Location:', location);
console.log('[gemini-test] Credentials file:', credentialsPath);

try {
  const vertexAI = new VertexAI({ project, location });
  const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  console.log('[gemini-test] Sending prompt...');
  const prompt = "Hello Gemini! Say 'connected successfully 🚀'";
  const result = await model.generateContent(prompt);

  console.log('\n✅ [Gemini Response]:', result.response.candidates[0].content.parts[0].text);
} catch (err) {
  console.error('\n❌ [Gemini Error]:', err.message);
}
