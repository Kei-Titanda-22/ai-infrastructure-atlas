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
import v04Batch22DocumentSources from '../data/document-sources-v04-batch22.json';
import v04Batch23DocumentSources from '../data/document-sources-v04-batch23.json';
import v04Batch24DocumentSources from '../data/document-sources-v04-batch24.json';
import v04Batch25DocumentSources from '../data/document-sources-v04-batch25.json';
import v04Batch26DocumentSources from '../data/document-sources-v04-batch26.json';
import v04Batch27DocumentSources from '../data/document-sources-v04-batch27.json';
import v04Batch28DocumentSources from '../data/document-sources-v04-batch28.json';
import v04Batch29DocumentSources from '../data/document-sources-v04-batch29.json';
import v04Batch30DocumentSources from '../data/document-sources-v04-batch30.json';
import v04Batch31DocumentSources from '../data/document-sources-v04-batch31.json';
import v04Batch32DocumentSources from '../data/document-sources-v04-batch32.json';
import v04Batch33DocumentSources from '../data/document-sources-v04-batch33.json';
import v04Batch34DocumentSources from '../data/document-sources-v04-batch34.json';

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
  ...v04Batch22DocumentSources,
  ...v04Batch23DocumentSources,
  ...v04Batch24DocumentSources,
  ...v04Batch25DocumentSources,
  ...v04Batch26DocumentSources,
  ...v04Batch27DocumentSources,
  ...v04Batch28DocumentSources,
  ...v04Batch29DocumentSources,
  ...v04Batch30DocumentSources,
  ...v04Batch31DocumentSources,
  ...v04Batch32DocumentSources,
  ...v04Batch33DocumentSources,
  ...v04Batch34DocumentSources,
];

export const financialSourceById = new Map(financialSources.map(source => [source.id, source]));
