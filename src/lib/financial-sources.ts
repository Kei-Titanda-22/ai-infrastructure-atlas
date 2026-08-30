import sources from '../data/sources.json';
import v02Sources from '../data/sources-v02.json';
import documentSources from '../data/document-sources.json';
import v04DocumentSources from '../data/document-sources-v04.json';
import v04Batch10DocumentSources from '../data/document-sources-v04-batch10.json';
import v04Batch11DocumentSources from '../data/document-sources-v04-batch11.json';
import v04Batch12DocumentSources from '../data/document-sources-v04-batch12.json';
import v04Batch13DocumentSources from '../data/document-sources-v04-batch13.json';
import v04Batch14DocumentSources from '../data/document-sources-v04-batch14.json';
import v04Batch15DocumentSources from '../data/document-sources-v04-batch15.json';
import v04Batch16DocumentSources from '../data/document-sources-v04-batch16.json';

export const financialSources = [
  ...sources,
  ...v02Sources,
  ...documentSources,
  ...v04DocumentSources,
  ...v04Batch10DocumentSources,
  ...v04Batch11DocumentSources,
  ...v04Batch12DocumentSources,
  ...v04Batch13DocumentSources,
  ...v04Batch14DocumentSources,
  ...v04Batch15DocumentSources,
  ...v04Batch16DocumentSources,
];

export const financialSourceById = new Map(financialSources.map(source => [source.id, source]));
