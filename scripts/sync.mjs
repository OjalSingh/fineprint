// Copies the registry (source of truth) into the extension folder.
import { copyFile } from 'node:fs/promises';

await copyFile('registry/services.json', 'extension/services.json');
console.log('Synced registry/services.json -> extension/services.json');