import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  SOLO_ARCHETYPE_IMAGE_PROMPTS,
  buildSoloArchetypeImagePrompt,
} from '../src/team-dna/data/teamDnaArchetypeImagePrompts.js';

const ROOT = process.cwd();
const tmpDir = join(ROOT, 'tmp/imagegen');
const outDir = join(ROOT, 'src/team-dna/assets/archetype-images');
const jsonlPath = join(tmpDir, 'team-dna-solo-archetypes.jsonl');
const manifestPath = join(outDir, 'manifest.json');
const promptDocPath = join(ROOT, 'src/team-dna/TEAM_DNA_IMAGE_PROMPTS.txt');

await mkdir(tmpDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const jobs = SOLO_ARCHETYPE_IMAGE_PROMPTS.map((role) => ({
  model: 'gpt-image-2',
  prompt: buildSoloArchetypeImagePrompt(role),
  use_case: 'stylized-concept',
  composition:
    'one abstract non-identifiable human-like figure inside a minimal brand-world scene; 4:3-ish landscape card art',
  constraints:
    'no text, no logos, no face, no identifiable traits, no photoreal person, no office scene',
  quality: 'low',
  size: '1536x1024',
  output_format: 'png',
  out: `${role.slug}.png`,
}));

await writeFile(jsonlPath, `${jobs.map((job) => JSON.stringify(job)).join('\n')}\n`);

await writeFile(
  manifestPath,
  `${JSON.stringify(
    jobs.map((job, index) => ({
      slug: SOLO_ARCHETYPE_IMAGE_PROMPTS[index].slug,
      title: SOLO_ARCHETYPE_IMAGE_PROMPTS[index].title,
      file: job.out,
      prompt: job.prompt,
    })),
    null,
    2
  )}\n`
);

const promptDoc = [
  'Team DNA Solo Archetype Image Prompts',
  '',
  'Purpose',
  'These are placeholder prompts for the 40 deterministic solo fallback role images. The goal is not a chart. The goal is a small abstract story: a non-identifiable human-like presence doing the thing the role does for a team.',
  '',
  'Global Style',
  'Abstract BetterUp-adjacent macro imagery; grainy gradients; luminous color fields; tactile material texture; spacious, minimal, calm, premium composition. Every image must include one abstract faceless human-like presence with no identifiable traits. No text, logos, UI, charts, office scenes, realistic anatomy, or corporate clip art.',
  '',
  'Generation Settings For This Placeholder Pass',
  '- Model: gpt-image-2',
  '- Quality: low',
  '- Size: 1536x1024',
  '- Output: png',
  '',
  ...jobs.flatMap((job, index) => {
    const role = SOLO_ARCHETYPE_IMAGE_PROMPTS[index];
    return [
      `${index + 1}. ${role.title}`,
      `File: ${job.out}`,
      'Prompt:',
      job.prompt,
      '',
    ];
  }),
].join('\n');

await writeFile(promptDocPath, promptDoc);

console.log(`Wrote ${jobs.length} image jobs to ${jsonlPath}`);
console.log(`Wrote manifest to ${manifestPath}`);
console.log(`Wrote prompt doc to ${promptDocPath}`);
