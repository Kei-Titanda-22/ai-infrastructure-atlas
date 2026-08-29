import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const directionalScore = z.object({
  value: z.number().min(0).max(5),
  direction: z.enum(['positive', 'negative', 'mixed', 'neutral']),
  confidence: z.enum(['low', 'medium', 'high']),
  status: z.enum(['provisional', 'reviewed']),
  rationale: z.string(),
  definitionId: z.string(),
  asOf: z.string(),
  assessmentSource: z.string(),
  evidenceSourceIds: z.array(z.string()),
});

const nullableMetric = z.object({
  value: z.number().nullable(),
  unit: z.string(),
  basis: z.string(),
  definitionId: z.string(),
  asOf: z.string().nullable(),
  period: z.string().nullable(),
  sourceId: z.string().nullable(),
});

const companies = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/companies', generateId: ({ entry }) => entry.replace(/\.json$/, '') }),
  schema: z.object({
    name: z.string(),
    officialName: z.string(),
    japaneseName: z.string(),
    reading: z.string(),
    ticker: z.string(),
    exchange: z.string(),
    country: z.string(),
    primaryLayer: z.string(),
    layers: z.array(z.string()),
    tags: z.array(z.string()),
    summary: z.string(),
    aiRole: z.string(),
    products: z.array(z.string()),
    strengths: z.array(z.string()),
    risks: z.array(z.string()),
    competitors: z.array(z.string()),
    scores: z.object({
      aiExposure: directionalScore,
      rateSensitivity: directionalScore,
      cyclicality: directionalScore,
      moat: directionalScore,
    }),
    metrics: z.object({
      peTTM: nullableMetric,
      peFY1: nullableMetric,
      pb: nullableMetric,
      roic: nullableMetric,
      operatingMargin: nullableMetric,
      revenueGrowth: nullableMetric,
    }),
    sourceIds: z.array(z.string()),
    sourceStatus: z.enum(['placeholder', 'partial', 'verified']),
    lastReviewed: z.string(),
  }),
});

export const collections = { companies };
