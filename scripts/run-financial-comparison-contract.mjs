import { stdin, stdout } from 'node:process';
import { assessFinancialProjection } from '../src/lib/financial-comparison-contract.ts';

let input = '';
stdin.setEncoding('utf8');
for await (const chunk of stdin) input += chunk;
const payload = JSON.parse(input);
const result = assessFinancialProjection(
  payload.sets,
  payload.metricIds,
  payload.history,
  payload.metricDefinitions,
);
stdout.write(`${JSON.stringify(result)}\n`);
