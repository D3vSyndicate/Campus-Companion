// Using AI for your studies — a guide for first-years.
//
// Organised by task, not by brand. Two reasons: which tool is "best" changes every few months and
// this file would quietly go stale, and a student's real question is never "which AI is best", it
// is "I have this specific problem, what actually helps".
//
// The integrity section is not decoration. Using AI badly is one of the few things that can end a
// degree, and the rules differ per faculty — so this guide points students at their own rules
// rather than pretending there is one university-wide answer.

export interface AiUseCase {
  id: string;
  task: string;
  emoji: string;
  // The kind of tool that suits this, in plain language.
  suits: string;
  // A prompt pattern worth copying.
  howToAsk: string;
  // The specific way this goes wrong.
  watchOut: string;
}

export const USE_CASES: AiUseCase[] = [
  {
    id: 'understand',
    task: 'Something in a lecture is not clicking',
    emoji: '🧠',
    suits:
      'A general chat assistant — Claude, ChatGPT or Gemini. This is what they are genuinely good at: explaining one idea several different ways until one lands.',
    howToAsk:
      '"Explain [concept] to me like I have never seen it before. Then explain it again using an example from everyday life. Then ask me a question to check I actually understood."',
    watchOut:
      'A confident explanation is not a correct one. If it contradicts your lecturer or your textbook, your lecturer and textbook win — they are what you are marked against.',
  },
  {
    id: 'debug',
    task: 'Your code will not run',
    emoji: '🐞',
    suits:
      'Any of the chat assistants handle error messages well. Coding-focused tools — GitHub Copilot, Claude Code, Cursor — are better when the problem is spread across several files rather than one error.',
    howToAsk:
      'Paste the full error message, the code around it, and what you expected to happen. Then: "Do not fix it for me yet. Tell me what this error means and where to look."',
    watchOut:
      'Asking for the fix first teaches you nothing and you will meet the same bug in the test, without the tool. Ask what is wrong before you ask for the answer.',
  },
  {
    id: 'stuck-writing',
    task: 'You are staring at a blank page',
    emoji: '✍️',
    suits:
      'A chat assistant, used for structure rather than sentences. Getting an outline unstuck is legitimate; having it write the essay is usually not.',
    howToAsk:
      '"Here is my assignment brief and my rough argument. Ask me five questions that would make my argument stronger." Then write it yourself, from your own answers.',
    watchOut:
      'Text you did not write is the fastest route to a plagiarism hearing. See "Know your faculty rules" below — this is the one that ends degrees.',
  },
  {
    id: 'reading',
    task: 'You have 60 pages to read by tomorrow',
    emoji: '📚',
    suits:
      'Tools that let you upload the document itself, so the summary comes from your actual reading rather than the internet.',
    howToAsk:
      '"Summarise the argument of this chapter in ten bullet points, then list the three things most likely to be asked about in a test."',
    watchOut:
      'A summary gets you through a seminar, not an exam. If it is examinable, read the pages — use the summary to know which pages matter most.',
  },
  {
    id: 'research',
    task: 'You need sources for an assignment',
    emoji: '🔎',
    suits:
      'Something that searches the live web and shows you links — Perplexity, or the search mode inside Claude, ChatGPT or Gemini. Use the library databases too; they are what your lecturer expects.',
    howToAsk:
      '"Find peer-reviewed sources on [topic] from the last five years. Give me the link for each one."',
    watchOut:
      'AI tools invent citations that look completely real — correct-sounding author, plausible journal, a DOI that goes nowhere. Open every single link before you cite it. A fabricated reference in a bibliography is treated as dishonesty, not as a mistake.',
  },
  {
    id: 'practice',
    task: 'You want to test yourself before a test',
    emoji: '🎯',
    suits:
      'Any chat assistant. This is one of the highest-value and lowest-risk uses of AI in a degree, and almost nobody does it.',
    howToAsk:
      '"Here are my lecture notes. Ask me ten exam-style questions one at a time. Do not give me the answer until I have tried, then tell me what I missed."',
    watchOut:
      'It will invent questions your lecturer would never ask. Treat it as practice at recalling, not as a leaked paper.',
  },
  {
    id: 'admin',
    task: 'Email a lecturer, fix a CV, plan a week',
    emoji: '📬',
    suits:
      'Any chat assistant. Low stakes, quick wins — this is where AI saves real time without touching your marks.',
    howToAsk:
      '"Rewrite this email to my lecturer so it is polite and short. Keep my meaning. Do not make it sound corporate."',
    watchOut:
      'Read it before you send it. Nothing reads worse to a lecturer than an email that is obviously not yours.',
  },
];

export interface IntegrityRule {
  title: string;
  body: string;
}

export const INTEGRITY: IntegrityRule[] = [
  {
    title: 'Your faculty rules are the actual rules',
    body: 'There is no single university-wide answer. What one module allows, another treats as misconduct, and the module guide or your lecturer is the only authority that counts. Ask at the start of a module, not after you have submitted.',
  },
  {
    title: 'Declare it if you are asked to',
    body: 'Many modules now ask you to state how you used AI. Saying "I used it to check my structure and generate practice questions" costs you nothing. Being caught not declaring it costs a great deal.',
  },
  {
    title: 'It makes things up, fluently',
    body: 'These tools are built to produce text that sounds right, which is not the same as being right. They invent references, statistics and definitions with total confidence. Anything factual needs checking against something that is not an AI.',
  },
  {
    title: 'Do not paste things that are not yours to paste',
    body: 'Your student number, ID number, medical or financial details, someone else’s work, or anything under an NDA from a work placement. Assume anything you type may be stored.',
  },
  {
    title: 'The free version is usually enough',
    body: 'You do not need a subscription to do any of the above. Before you pay for anything as a student, check what the university already gives you access to.',
  },
];

// Named so students recognise what they are looking at, and grouped by what the tool is shaped for
// rather than ranked — a ranking here would be out of date before the semester ends.
export interface ToolNote {
  name: string;
  shapedFor: string;
}

export const TOOL_NOTES: ToolNote[] = [
  { name: 'Claude', shapedFor: 'Long documents, careful writing and reasoning, coding.' },
  { name: 'ChatGPT', shapedFor: 'General-purpose. The most widely used, with a large plugin ecosystem.' },
  { name: 'Gemini', shapedFor: 'General-purpose, tied into Google Docs, Drive and search.' },
  { name: 'Perplexity', shapedFor: 'Search-first answers that show their sources up front.' },
  { name: 'GitHub Copilot', shapedFor: 'Code completion inside your editor while you type.' },
  { name: 'Microsoft Copilot', shapedFor: 'Word, Excel and Outlook. Check what your student account includes.' },
];
