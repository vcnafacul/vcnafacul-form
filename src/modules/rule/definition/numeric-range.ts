export const numericRangeDefinition = {
  type: 'object',
  properties: {
    ranges: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          min: { type: ['number', 'null'] },
          max: { type: ['number', 'null'] },
          points: { type: 'number' },
        },
        required: ['points'],
        additionalProperties: false,
      },
    },
    includeMin: { type: 'boolean' },
    includeMax: { type: 'boolean' },
  },
  required: ['ranges'],
  additionalProperties: false,
} as const;
