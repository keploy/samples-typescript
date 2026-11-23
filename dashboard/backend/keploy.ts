import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import { exec } from 'child_process'

const TESTS_DIR = path.resolve(__dirname, process.env.KEPLOY_TESTS_PATH || '')

export async function getAllTests() {
  const files = await fs.readdir(TESTS_DIR);
  console.log("Reading test files from:", TESTS_DIR);

  const yamlFiles = files.filter(file =>
    file.endsWith('.yaml') || file.endsWith('.yml')
  );
  return Promise.all(
    yamlFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(TESTS_DIR, file), 'utf-8');

      let data: any;
      try {
        data = yaml.load(raw) as {
          req?: { url?: string; method?: string };
          status?: number | string;
        };
      } catch (err) {
        console.error(`❌ Failed to parse YAML file: ${file}`, err);
        return null;
      }

      let status = 'pending';
      if (data?.status === 1 || data?.status === 'pass' || data?.status === 'passed') status = 'passed';
      else if (data?.status === 0 || data?.status === 'fail' || data?.status === 'failed') status = 'failed';

      return {
        id: file.replace('.yaml', ''),
        route: data?.req?.url || '',
        method: data?.req?.method || '',
        status,
      };
    })
  ).then(results => results.filter(Boolean));
}


export async function getTestById(id: string) {
  const filePath = path.join(TESTS_DIR, `${id}.yaml`)
  const raw = await fs.readFile(filePath, 'utf-8')
  return yaml.load(raw)
}

export async function rerunTest(id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`keploy test --id ${id}`, (err, stdout, stderr) => {
      if (err) return reject(stderr)
      resolve(stdout)
    })
  })
}
