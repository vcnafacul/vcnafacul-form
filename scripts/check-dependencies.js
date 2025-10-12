#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para verificar dependências ausentes no package.json
 *
 * Este script analisa todos os arquivos TypeScript na pasta src/
 * e identifica imports de módulos externos que podem estar faltando
 * no package.json
 */

function getAllTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTsFiles(filePath));
    } else if (file.endsWith('.ts')) {
      results.push(filePath);
    }
  });

  return results;
}

function extractExternalImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];

  // Regex para capturar imports
  const importRegex = /import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Filtrar apenas imports externos (não começam com @, src/, ./ ou ../)
    if (
      !importPath.startsWith('@') &&
      !importPath.startsWith('src/') &&
      !importPath.startsWith('./') &&
      !importPath.startsWith('../')
    ) {
      imports.push({
        module: importPath,
        file: filePath,
      });
    }
  }

  return imports;
}

function checkDependencies() {
  console.log('🔍 Verificando dependências ausentes...\n');

  // Ler package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});

  // Analisar arquivos TypeScript
  const tsFiles = getAllTsFiles('./src');
  const externalImports = new Set();
  const importDetails = [];

  tsFiles.forEach((file) => {
    const imports = extractExternalImports(file);
    imports.forEach((imp) => {
      externalImports.add(imp.module);
      importDetails.push(imp);
    });
  });

  console.log('📦 Imports externos encontrados:');
  console.log('');

  let hasIssues = false;

  Array.from(externalImports)
    .sort()
    .forEach((module) => {
      const inDeps = dependencies.includes(module);
      const inDevDeps = devDependencies.includes(module);

      if (inDeps) {
        console.log(`✅ ${module} - presente em dependencies`);
      } else if (inDevDeps) {
        console.log(`⚠️  ${module} - presente em devDependencies (deveria estar em dependencies)`);
        hasIssues = true;
      } else {
        console.log(`❌ ${module} - AUSENTE do package.json`);
        hasIssues = true;

        // Mostrar onde está sendo usado
        const usages = importDetails.filter((imp) => imp.module === module);
        usages.forEach((usage) => {
          console.log(`   📄 ${usage.file}`);
        });
      }
    });

  console.log('');

  if (hasIssues) {
    console.log('🚨 Problemas encontrados! Execute:');
    console.log('   yarn add <dependencia-ausente>');
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ Todas as dependências estão corretas!');
    process.exit(0);
  }
}

// Executar verificação
checkDependencies();
