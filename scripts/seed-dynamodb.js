const path = require('path');
const MB = path.join(__dirname, '../src/backend/node_modules');
const { DynamoDBClient, PutItemCommand, ScanCommand } = require(
  path.join(MB, '@aws-sdk/client-dynamodb')
);

const args = process.argv.slice(2);
const envIdx = args.indexOf('--env');
const ENV = envIdx !== -1 ? args[envIdx + 1] : 'dev';
const REGION = 'ap-northeast-1';
const TABLE = 'it-english-scenarios-' + ENV;
const NOW = new Date().toISOString();

console.log('Table :', TABLE);
console.log('Region:', REGION);
console.log('');

const scenarios = [
  {
    scenarioId: 'SCN-001',
    title: 'Tech Interview Practice',
    description: 'IT engineer English technical interview practice. Practice answering about algorithms, system design, and experience.',
    category: 'interview',
    difficulty: 'advanced',
    systemPrompt: 'You are an experienced technical interviewer at a top tech company. Conduct a realistic technical interview in English. Ask about algorithms, system design, and past experience. Correct grammar politely. Start with: Hello! Could you tell me about yourself and your experience as a software engineer?'
  },
  {
    scenarioId: 'SCN-002',
    title: 'Daily Standup Meeting',
    description: 'Practice English daily standup meetings with progress reports and blocker discussions.',
    category: 'meeting',
    difficulty: 'beginner',
    systemPrompt: 'You are a Scrum Master facilitating a daily standup in English. Ask the three standup questions: What did you do yesterday? What will you do today? Any blockers? Use agile terminology and gently correct grammar mistakes.'
  },
  {
    scenarioId: 'SCN-003',
    title: 'Code Review Discussion',
    description: 'Practice giving and receiving code review feedback in English with constructive language.',
    category: 'technical',
    difficulty: 'intermediate',
    systemPrompt: 'You are a senior engineer conducting a code review discussion in English. Discuss code quality, best practices, and improvements. Use constructive feedback language. Correct grammar politely after the user finishes speaking.'
  },
  {
    scenarioId: 'SCN-004',
    title: 'Client Requirements Meeting',
    description: 'Practice requirements gathering meetings with English-speaking clients.',
    category: 'meeting',
    difficulty: 'intermediate',
    systemPrompt: 'You are a client with software requirements. Conduct a requirements gathering meeting in English. Ask clarifying questions about the project. Use business and technical terminology. Correct grammar politely.'
  },
  {
    scenarioId: 'SCN-005',
    title: 'Incident Response Call',
    description: 'Practice production incident response communication in English using SRE terminology.',
    category: 'technical',
    difficulty: 'advanced',
    systemPrompt: 'You are an incident commander during a production outage. Conduct the incident response call in English. Ask for status updates, root cause analysis, and action items. Use ITIL/SRE terminology. Correct grammar politely.'
  }
];

async function main() {
  const client = new DynamoDBClient({ region: REGION });
  let ok = 0;

  for (const s of scenarios) {
    console.log('Inserting', s.scenarioId, '-', s.title, '...');
    try {
      await client.send(new PutItemCommand({
        TableName: TABLE,
        Item: {
          scenarioId:   { S: s.scenarioId },
          title:        { S: s.title },
          description:  { S: s.description },
          category:     { S: s.category },
          difficulty:   { S: s.difficulty },
          isActive:     { BOOL: true },
          systemPrompt: { S: s.systemPrompt },
          createdAt:    { S: NOW },
          updatedAt:    { S: NOW }
        }
      }));
      console.log('  OK:', s.scenarioId);
      ok++;
    } catch (e) {
      console.error('  FAILED:', s.scenarioId, '-', e.message);
    }
  }

  console.log('');
  console.log('Result: ' + ok + '/' + scenarios.length + ' inserted');

  try {
    const r = await client.send(new ScanCommand({ TableName: TABLE, Select: 'COUNT' }));
    console.log('Count in table:', r.Count);
  } catch (e) {
    console.error('Verify failed:', e.message);
  }
}

main();
