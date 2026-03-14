export const computedInverseProportionalDefinition = {
  type: 'object',
  properties: {
    expression: { type: 'string', minLength: 1 },
    questionIds: { type: 'array', items: { type: 'string' }, minItems: 2 },
    referenceValue: { type: 'number', exclusiveMinimum: 0 },
    maxScore: { type: 'number' },
  },
  required: ['expression', 'questionIds', 'referenceValue', 'maxScore'],
  additionalProperties: false,
} as const;
