import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateDataset } from '../src/data.js';

const output = new URL('../public/data/', import.meta.url);
const inputs = await Promise.all(['hanoi', 'can-tho'].map(async site => {
  const source = new URL(`../../data/processed/${site}.json`, import.meta.url);
  const bytes = await readFile(source);
  validateDataset(JSON.parse(bytes.toString('utf8')), site);
  return { site, bytes };
}));
// Validate both inputs before replacing either frontend asset.
await mkdir(output, { recursive: true });
for (const { site, bytes } of inputs) {
  await writeFile(new URL(`${site}.json`, output), bytes);
  console.log(`Validated and copied ${site}: ${bytes.length} bytes to ${fileURLToPath(output)}`);
}
