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
import v04Batch17DocumentSources from '../data/document-sources-v04-batch17.json';
import v04Batch18DocumentSources from '../data/document-sources-v04-batch18.json';
import v04Batch19DocumentSources from '../data/document-sources-v04-batch19.json';
import v04Batch20DocumentSources from '../data/document-sources-v04-batch20.json';
import v04Batch21DocumentSources from '../data/document-sources-v04-batch21.json';

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
  ...v04Batch17DocumentSources,
  ...v04Batch18DocumentSources,
  ...v04Batch19DocumentSources,
  ...v04Batch20DocumentSources,
  ...v04Batch21DocumentSources,
];

export const financialSourceById = new Map(financialSources.map(source => [source.id, source]));
