import { OpenAI } from 'openai';
import * as fs from 'fs';
import path from 'path';

interface IConfig {
  framework?: string;
  assistantId?: string;
  contextId?: string;
  rules?: any;
}

export async function initConfig(_config: IConfig) {
  const directoryPath = path.join(process.cwd(), '.guidedog');
  const configPath = path.join(directoryPath, 'guidedog.config.cjs');

  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }

    if (fs.existsSync(configPath)) {
      let configObj = await import(configPath);
      configObj = {
        ...configObj,
        framework: _config.framework,
        assistantId: _config.assistantId,
        contextId: _config.contextId,
      };
      fs.writeFileSync(
        configPath,
        `module.exports = ${JSON.stringify(configObj, null, 2)};`,
      );
    } else {
      // Write the new config object to the file
      fs.writeFileSync(
        configPath,
        `module.exports = ${JSON.stringify(_config, null, 2)};`,
        { encoding: 'utf-8' },
      );
    }
  } catch (error) {
    throw error;
  }
}

export async function updateConfig(
  assistant: OpenAI.Beta.Assistants.Assistant,
) {
  // Read existing config or create a new one
  let config: { assistantId: string } = { assistantId: '' }; // TODO: make this a proper config object

  try {
    const directoryPath = path.join(process.cwd(), '.guidedog');
    const configPath = path.join(directoryPath, 'guidedog.config.cjs');
    const existingConfig = fs.readFileSync(configPath, {
      encoding: 'utf8',
    });
    config = JSON.parse(existingConfig);
    // Append assistantId to the config
    config['assistantId'] = assistant.id;

    // Write the updated config back to the file
    fs.writeFileSync(
      directoryPath,
      `module.exports = ${JSON.stringify(config, null, 2)};`,
      'utf8',
    );
    console.log('Configuration saved to .guidedog/guidedog.config.cjs');
  } catch (error) {
    console.log('No existing config found, creating a new one.');
  }
}

export async function createNewRun() {
  // .toJSON is an easy way to give us YYYY-MM-DD-${time} format to avoid using '/'s as that causes issues for path names
  const todaysDate = new Date().toJSON();

  const newRunPath = path.join(
    process.cwd(),
    `.guidedog/runs/run-${todaysDate}`,
  );

  try {
    if (!fs.existsSync(newRunPath)) {
      fs.mkdirSync(newRunPath, { recursive: true });
    } else {
      console.log(
        'Run path already exists for this exact time. Returning existing run path.',
      );
    }

    return newRunPath;
  } catch (error) {
    throw error;
  }
}

export async function saveAPIKey(apiKey: string) {
  const envPath = path.join(process.cwd(), '.env');
  const apiKeyEntry = `OPENAI_API_KEY=${apiKey}`;

  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    // Append the API key if it exists
    fs.appendFileSync(envPath, `\n${apiKeyEntry}`, { encoding: 'utf8' });
    console.log('API key appended to .env file.');
  } else {
    // Create a new .env file and add the API key
    fs.writeFileSync(envPath, apiKeyEntry, { encoding: 'utf8' });
    console.log('.env file created and API key added.');
  }
}
