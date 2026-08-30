import sources from '../data/sources.json';
import v02Sources from '../data/sources-v02.json';
import documentSources from '../data/document-sources.json';
import v04DocumentSources from '../data/document-sources-v04.json';
import v04Batch10DocumentSources from '../data/document-sources-v04-batch10.json';
import v04Batch11DocumentSources from '../data/document-sources-v04-batch11.json';

export const financialSources = [
  ...sources,
  ...v02Sources,
  ...documentSources,
  ...v04DocumentSources,
  ...v04Batch10DocumentSources,
  ...v04Batch11DocumentSources,
];

export const financialSourceById = new Map(financialSources.map(source => [source.id, source]));
