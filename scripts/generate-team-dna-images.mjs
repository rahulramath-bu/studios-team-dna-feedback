import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const inputPath =
  process.argv[2] ?? 'tmp/imagegen/team-dna-solo-archetypes.jsonl';
const outDir = process.argv[3] ?? 'src/team-dna/assets/archetype-images';
const concurrency = Number(process.argv[4] ?? 3);
const delayMs = Number(process.argv[5] ?? 13000);
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required.');
}

const raw = await readFile(inputPath, 'utf8');
const jobs = raw
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => JSON.parse(line));

await mkdir(outDir, { recursive: true });

async function generate(job, index) {
  const outName = basename(job.out);
  const outPath = join(outDir, outName);

  try {
    await access(outPath);
    console.log(`${index + 1}/${jobs.length} ${outName} skipped`);
    return;
  } catch {
    // File does not exist yet. Generate it.
  }

  const payload = {
    model: job.model ?? 'gpt-image-2',
    prompt: [
      job.prompt,
      job.use_case ? `Use case: ${job.use_case}.` : '',
      job.composition ? `Composition: ${job.composition}.` : '',
      job.constraints ? `Constraints: ${job.constraints}.` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    quality: job.quality ?? 'low',
    size: job.size ?? '1536x1024',
    output_format: job.output_format ?? 'png',
  };

  let response;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      break;
    }

    const errorText = await response.text();

    if (response.status !== 429 || attempt === 5) {
      throw new Error(`${outName}: ${response.status} ${errorText}`);
    }

    const retryAfter =
      Number(response.headers.get('retry-after')) * 1000 || delayMs;
    console.log(`${outName} rate limited; retrying in ${retryAfter}ms`);
    await new Promise((resolve) => setTimeout(resolve, retryAfter));
  }

  const body = await response.json();
  const image = body.data?.[0];

  if (!image?.b64_json) {
    throw new Error(`${outName}: response did not include b64_json`);
  }

  await writeFile(outPath, Buffer.from(image.b64_json, 'base64'));
  console.log(`${index + 1}/${jobs.length} ${outName}`);

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

let cursor = 0;

async function worker() {
  while (cursor < jobs.length) {
    const index = cursor;
    cursor += 1;
    await generate(jobs[index], index);
  }
}

await Promise.all(
  Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker())
);
