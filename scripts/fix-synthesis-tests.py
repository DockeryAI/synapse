#!/usr/bin/env python3
"""Fix synthesis test ExtractionResult objects to match correct type structure"""

import re

filepath = 'src/services/v2/synthesis/__tests__/OpusSynthesisService.test.ts'

with open(filepath, 'r') as f:
    content = f.read()

# Pattern to match flat extractionResults objects
pattern = r'''          \{
            extractorId: '([^']+)',
            confidence: (0\.\d+)( as any)?,
            dataPoints: (\d+),
            data: (\{[^}]*\}),
            timestamp: Date\.now\(\),
            duration: (\d+),
          \}'''

replacement = r'''          {
            success: true,
            data: \5,
            confidence: {
              overall: \2,
              dataQuality: \2,
              sourceCount: \4,
            },
            metadata: {
              extractorId: '\1',
              taskType: 'customer_profile' as any,
              model: 'HAIKU' as any,
              fromCache: false,
              timing: { total: \6 },
              timestamp: Date.now(),
            },
          } as any'''

content = re.sub(pattern, replacement, content)

with open(filepath, 'w') as f:
    f.write(content)

print(f"Fixed {filepath}")
