#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * A script to tokenize the ERV CSV file.
 *
 * Usage: deno task tokenize --input="./vendor/erv.csv" --output="./output/tokens.csv" --locale="en-gb" --verbose
 *
 * Input: A two-column CSV without header row, where column A is the verse ID, B is the verse text
 *
 * Output: A three-column CSV with header row, where column A is the token, B is the count of verses, C is a list of verse IDs
 *
 * @module
 */

// External dependencies
import { parseArgs, type ParseOptions } from 'cli';
import { parse as parseCsv } from 'csv';
import { tokenizer } from 'tokenizer';

// Internal dependencies
import stopwords from './data/stopwords.json' with { type: 'json' };
import { exitWithError, replaceBom } from './utils.ts';

// Default config
const CSV_HAS_HEADER_ROW: boolean = false;
const LOCALE: string = 'en-gb';

// CLI flags
const flagParseOptions: ParseOptions = {
  alias: {
    headers: 'h',
    input: 'i',
    locale: 'l',
    output: 'o',
  },
  boolean: ['headers', 'verbose'],
  default: {
    headers: CSV_HAS_HEADER_ROW,
    locale: LOCALE,
    verbose: false,
  },
  negatable: ['headers', 'verbose'],
  string: [
    'input',
    'locale',
    'output',
  ],
} as const;

// Tokenizer
const tokenize = tokenizer({
  mode: 'dlatk',
  preserveCase: false,
  normalize: null,
});

//#region Types

type Verse = {
  id: string;
  text: string;
};

type TokenizerFlags = {
  headers: boolean;
  input: string;
  locale: string;
  output: string;
  verbose: boolean;
};

//#endregion Types

const mapToCsv = (tokens: Record<string, string[]>): string =>
  Object.keys(tokens)
    .map((k) => ({ key: k, value: tokens[k] }))
    .sort((a, b) => b!.value!.length - a!.value!.length)
    .reduce((res, curr) => `${res}\n${curr.key},${curr.value.length},"[${curr.value}]"`, 'token,verses,ids');

const idsByVerse = (acc: Record<string, string[]>, [id, tokens]: [string, string[]]) => {
  tokens.forEach((token) => {
    if (stopwords.includes(token)) return acc;
    if (!Array.isArray(acc[token])) acc[token] = [];
    if (!acc[token].includes(id)) acc[token].push(id);
  });
  return acc;
};

const normalizeText = (text: string, locale = LOCALE): string =>
  text
    .normalize('NFD') // Decompose to separate the diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLocaleLowerCase(locale) // Convert to lowercase
    .replaceAll(/[^a-z0-9\s\u00C0-\u017F]/gi, '') // remove symbols but keep letters with diacritics // (?)
    .replaceAll(/\s+/g, ' ') // replace multiple spaces with a single space
    .trim(); // remove leading and trailing spaces

const tokenizeVerse = (verse: Verse, locale = LOCALE): [id: string, tokens: string[]] => {
  const { id, text } = verse;
  const tokens = tokenize(normalizeText(text, locale))();
  const uniqueTokens = [...new Set([...tokens].map((token) => token.value))];
  return [id, uniqueTokens];
};

const readCsv = async (input: string, headers = CSV_HAS_HEADER_ROW): Promise<Verse[]> => {
  const rawCsv = replaceBom(await Deno.readTextFile(input));
  return parseCsv(rawCsv, { columns: ['id', 'text'], skipFirstRow: headers, fieldsPerRecord: 2 });
};

const getFlags = (): TokenizerFlags => {
  const flags = parseArgs(Deno.args, flagParseOptions);
  if (!flags.input) exitWithError(1, 'No input file specified. Please use --input=<PATH>.');
  if (!flags.output) exitWithError(1, 'No output file specified. Please use --output=<PATH>.');
  return {
    input: flags.input,
    output: flags.output,
    headers: !!flags.headers,
    locale: flags.locale,
    verbose: !!flags.verbose,
  };
};

try {
  const startTime = performance?.now() ?? Date.now();
  const { input, output, headers = CSV_HAS_HEADER_ROW, locale = LOCALE, verbose = false } = getFlags();
  console.log(`Tokenizing ${input}...`);
  const verses = await readCsv(input, headers);
  if (verbose) console.log(`Found ${verses.length} verses...`);
  const tokensByVerse = verses.map((verse) => tokenizeVerse(verse, locale)).reduce(idsByVerse, {});
  if (verbose) console.log(`Writing ${Object.keys(tokensByVerse).length} tokens to ${output}...`);
  await Deno.writeTextFile(output, mapToCsv(tokensByVerse));
  const endTime = performance?.now() ?? Date.now();
  console.log(`Done in ${endTime - startTime}ms!`);
} catch (err) {
  exitWithError(2, err);
}
