#!/usr/bin/env python3
"""Fix MegaPromptGenerator test ExtractionResult objects"""

import re

filepath = 'src/services/v2/synthesis/__tests__/MegaPromptGenerator.test.ts'

with open(filepath, 'r') as f:
    content = f.read()

# Pattern to match flat extractionResults objects with various data structures
pattern = r'''(\s+)(\{
\s+extractorId: '([^']+)',
\s+confidence: (0\.\d+),
\s+dataPoints: (\d+),
\s+data: (\{[^}]+\}),
\s+timestamp: Date\.now\(\),
\s+duration: (\d+),
\s+\}) as ExtractionResult'''

def replacement(match):
    indent = match.group(1)
    extractorId = match.group(3)
    confidence = match.group(4)
    dataPoints = match.group(5)
    data = match.group(6)
    duration = match.group(7)

    return f'''{indent}{{
{indent}  success: true,
{indent}  data: {data},
{indent}  confidence: {{
{indent}    overall: {confidence},
{indent}    dataQuality: {confidence},
{indent}    sourceCount: {dataPoints},
{indent}  }},
{indent}  metadata: {{
{indent}    extractorId: '{extractorId}',
{indent}    taskType: 'customer_profile' as any,
{indent}    model: 'HAIKU' as any,
{indent}    fromCache: false,
{indent}    timing: {{ total: {duration} }},
{indent}    timestamp: Date.now(),
{indent}  }},
{indent}}} as any'''

content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

# Also handle the one with metadata.insights
pattern2 = r'''(\s+)(\{
\s+extractorId: '([^']+)',
\s+confidence: (0\.\d+),
\s+dataPoints: (\d+),
\s+data: \{\},
\s+metadata: \{ insights: \[[^\]]+\] \},
\s+timestamp: Date\.now\(\),
\s+duration: (\d+),
\s+\}) as ExtractionResult'''

def replacement2(match):
    indent = match.group(1)
    extractorId = match.group(3)
    confidence = match.group(4)
    dataPoints = match.group(5)
    duration = match.group(6)

    return f'''{indent}{{
{indent}  success: true,
{indent}  data: {{}},
{indent}  confidence: {{
{indent}    overall: {confidence},
{indent}    dataQuality: {confidence},
{indent}    sourceCount: {dataPoints},
{indent}  }},
{indent}  metadata: {{
{indent}    extractorId: '{extractorId}',
{indent}    taskType: 'customer_profile' as any,
{indent}    model: 'HAIKU' as any,
{indent}    fromCache: false,
{indent}    timing: {{ total: {duration} }},
{indent}    timestamp: Date.now(),
{indent}  }},
{indent}}} as any'''

content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE)

with open(filepath, 'w') as f:
    f.write(content)

print(f"Fixed {filepath}")
