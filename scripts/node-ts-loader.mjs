import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transform } from 'esbuild';

function isTypeScriptFile(url) {
  return /(\.[cm]?[jt]s|\.[cm]?tsx)$/.test(url);
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('node:') || specifier.startsWith('data:')) {
    return defaultResolve(specifier, context, defaultResolve);
  }

  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
    const basePath = path.resolve(path.dirname(parentPath), specifier);
    const candidates = [
      basePath,
      `${basePath}.ts`,
      `${basePath}.tsx`,
      `${basePath}.js`,
      `${basePath}.jsx`,
      path.join(basePath, 'index.ts'),
      path.join(basePath, 'index.tsx'),
      path.join(basePath, 'index.js'),
      path.join(basePath, 'index.jsx'),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return {
          url: pathToFileURL(candidate).href,
          shortCircuit: true,
        };
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (!isTypeScriptFile(url)) {
    return defaultLoad(url, context, defaultLoad);
  }

  const source = await readFile(fileURLToPath(url), 'utf8');
  const loader = url.endsWith('.tsx') || url.endsWith('.jsx') ? 'tsx' : 'ts';
  const { code } = await transform(source, {
    loader,
    format: 'esm',
    sourcemap: 'inline',
    target: 'es2022',
  });

  return {
    format: 'module',
    source: code,
    shortCircuit: true,
  };
}
