#!/usr/bin/env node

/**
 * Generate STATUS.md from features.json
 * Usage: node .buildrunner/scripts/generate-status.mjs
 *
 * ES Module version for projects with "type": "module"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read features.json
const featuresPath = path.join(__dirname, '../features.json');
const features = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));

// Calculate completion
const complete = features.features.filter(f => f.status === 'complete').length;
const inProgress = features.features.filter(f => f.status === 'in_progress').length;
const planned = (features.planned_features || []).length;

// Generate markdown
const md = `# ${features.project} - Project Status

**Repository:** ${features.repository}
**Version:** ${features.version}
**Status:** ${features.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Completion:** ${features.metrics.completion_percentage}%

## Quick Stats
- ✅ ${complete} features complete
- 🚧 ${inProgress} features in progress
- 📋 ${planned} features planned
${features.metrics.python_files ? `- 🐍 ${features.metrics.python_files} Python files` : ''}
${features.metrics.shell_scripts ? `- 📜 ${features.metrics.shell_scripts} Shell scripts` : ''}
${features.metrics.components_count ? `- 📦 ${features.metrics.components_count} components` : ''}
${features.metrics.api_endpoints_count ? `- 🔌 ${features.metrics.api_endpoints_count} API endpoints` : ''}

## Description

${features.description}

---

## Complete Features (v${features.version})

${features.features.filter(f => f.status === 'complete').map(f => `
### ✅ ${f.name}
**Status:** Complete | **Version:** ${f.version} | **Priority:** ${f.priority}

${f.description}

**Components:** ${f.components ? f.components.length : 0}${f.apis ? ` | **APIs:** ${f.apis.length}` : ''} | **Tests:** ${f.tests || 'N/A'}

${f.docs ? `**Docs:** ${f.docs.join(', ')}` : ''}
`).join('\n---\n')}

---

## In Progress Features

${inProgress > 0 ? features.features.filter(f => f.status === 'in_progress').map(f => `
### 🚧 ${f.name}
**Status:** In Progress | **Priority:** ${f.priority}

${f.description}

**Components:** ${f.components ? f.components.length : 0}
`).join('\n---\n') : '_No features currently in progress_'}

---

## Planned Features (v${features.planned_features && features.planned_features.length > 0 ? features.planned_features[0].version : 'Next'})

${planned > 0 ? features.planned_features.map(f => `
### 📋 ${f.name}
**Status:** Planned | **Priority:** ${f.priority}

${f.description}
`).join('\n---\n') : '_No features planned yet_'}

---

## Tech Stack

${features.tech_stack ? `
**Languages:** ${features.tech_stack.languages.join(', ')}
**Frameworks:** ${features.tech_stack.frameworks.join(', ')}
**Infrastructure:** ${features.tech_stack.infrastructure.join(', ')}
**Tools:** ${features.tech_stack.tools.join(', ')}
` : '_Tech stack not documented_'}

---

## Getting Started

1. **Read the spec:** \`docs/${features.project}-spec.md\` (if exists)
2. **Check features:** \`.buildrunner/features.json\`
3. **Recent activity:** \`git log -10 --oneline\`
4. **Coding standards:** \`.buildrunner/standards/CODING_STANDARDS.md\`

---

## For AI Code Builders

**Quick Context (2 min read):**
1. Read this STATUS.md (you are here)
2. Read \`.buildrunner/features.json\` for details
3. Check \`git log -5\` for recent changes

**Coding Standards:** Follow \`.buildrunner/standards/CODING_STANDARDS.md\`

**When you ship a feature:**
1. Update \`.buildrunner/features.json\`
2. Run \`node .buildrunner/scripts/generate-status.mjs\` or \`.js\`
3. Commit: \`feat: Complete [feature name]\`
4. Push: \`git push origin main\`

---

*Generated from \`.buildrunner/features.json\` on ${new Date().toISOString()}*
*Generator: \`.buildrunner/scripts/generate-status.mjs\`*
`;

// Write STATUS.md
const statusPath = path.join(__dirname, '../STATUS.md');
fs.writeFileSync(statusPath, md, 'utf8');

console.log('✅ Generated .buildrunner/STATUS.md');
console.log(`   - ${complete} features complete`);
console.log(`   - ${inProgress} features in progress`);
console.log(`   - ${planned} features planned`);
console.log(`   - ${features.metrics.completion_percentage}% complete`);
