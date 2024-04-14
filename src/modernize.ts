#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * A script to modernize the ERV CSV file.
 *
 * Usage: deno task modernize --input="./data/erv.csv" --output="./output/modernized.csv"
 *
 * Input: A two-column CSV without header row, where column A is the verse ID, B is the verse text
 *
 * Output: A two-column CSV with header row, where column A is the verse ID, B is the modernized verse text
 *
 * @module
 */

import { parse as parseFlags } from 'flags';
import { errata, extra, phrases, tokens } from './data/archaisms.ts';
import { exitWithError, extractCells, getCSVLines } from './utils.ts';

const VERSION = '1.0.0';

const TITLE = `Replacer script v${VERSION}`;

const CSV_HAS_HEADER_ROW = false;

type Row = [id: string, text: string];

type PatternReplacer = (value: string[], index: number, array: string[][]) => [RegExp, string];
const makePattern: PatternReplacer = ([k, v]) => [new RegExp(`\\b${k}\\b`, 'gmi'), v];
const tokenPatterns: Map<RegExp, string> = new Map(tokens.map(makePattern));
const phrasePatterns: Map<RegExp, string> = new Map(phrases.map(makePattern));
const errataPatterns: Map<RegExp, string> = new Map(errata.map(makePattern));
const extraPatterns: Map<RegExp, string> = new Map(extra.map(makePattern));

type ModernizerFlags = {
  input?: string;
  output?: string;
  headers: boolean;
  help: boolean;
  version: boolean;
};

const FLAGS_OPTS = {
  boolean: [
    'headers',
    'help',
    'version',
  ],
  negatable: [
    'headers',
  ],
  string: [
    'input',
    'output',
  ],
  alias: {
    headers: 'H',
    help: 'h',
    input: 'i',
    output: 'o',
    version: 'v',
  },
  default: {
    headers: CSV_HAS_HEADER_ROW,
    help: false,
    version: false,
  },
};

const getFlags = (): ModernizerFlags => {
  const flags = parseFlags(Deno.args, FLAGS_OPTS);
  return {
    input: flags.input || undefined,
    output: flags.output || undefined,
    help: !!flags.help,
    headers: !!flags.headers,
    version: !!flags.version,
  };
};

const CAPITAL_PATTERN = /[A-Z]/;
const replaceCase = (target: string, pattern: RegExp, source: string) => {
  if (!source) return target;
  return target.replaceAll(pattern, (str) => {
    if (str[0] && str[0].match(CAPITAL_PATTERN)) {
      return `${source.charAt(0).toUpperCase()}${source.slice(1)}`;
    } else {
      return `${source.charAt(0).toLowerCase()}${source.slice(1)}`;
    }
  });
};

const tokenReducer = (acc: [id: string, text: string][], [id, text]: [id: string, text: string]) => {
  let result = text;
  /**
   * order matters:
   * 1. phrases (because they contain spaces)
   * 2. tokens (because they are single words)
   * 3. errata (to correct overshots in the previous steps)
   * 4. extra (to correct grammar and add opinionated changes)
   */
  for (const [pattern, replacement] of phrasePatterns) {
    result = replaceCase(result, pattern, replacement);
  }
  for (const [pattern, replacement] of tokenPatterns) {
    result = replaceCase(result, pattern, replacement);
  }
  for (const [pattern, replacement] of errataPatterns) {
    result = replaceCase(result, pattern, replacement);
  }
  for (const [pattern, replacement] of extraPatterns) {
    result = replaceCase(result, pattern, replacement);
  }
  acc.push([id, result]);
  return acc;
};

const mapToCsv = (data: [id: string, text: string][]): string => {
  return data.reduce((res, [id, text]) => id ? `${res ? res + '\n' : res}${id},${text}` : res, '');
};

const printHelp = (): void => {
  console.log(`
Input: A two-column CSV without header row, where column A is the verse ID, B is the verse text

Output: A two-column CSV with header row, where column A is the verse ID, B is the replaced verse text

Flags:
  Required:
  -i, --input     <string>  Path to the input CSV file
  -o, --output    <string>  Path to the output CSV file

  Optional:
  -H, --headers   <bool>    CSV file has a header row (default: false)

  Other:
  -h, --help      <bool>    Prints this help message
  -v, --version   <bool>    Prints the version number
`);
};

async function main() {
  const { input, output, headers = CSV_HAS_HEADER_ROW, help = false, version = false } = getFlags();
  console.log(TITLE);
  if (help) {
    printHelp();
    Deno.exit(0);
  } else if (version) {
    Deno.exit(0);
  }
  if (!input) exitWithError(1, 'No input file specified. Please use --input=<PATH>.');
  if (!output) exitWithError(1, 'No output file specified. Please use --output=<PATH>.');
  console.log(`Reading ${input}...`);
  const lines: Row[] = (await getCSVLines(input, headers)).map(extractCells);
  console.log(`Processing ${lines.length} verses...`);
  const result: Row[] = lines.reduce(tokenReducer, []).reduce(tokenReducer, []);
  console.log(`Writing result to ${output}...`);
  await Deno.writeTextFile(output, mapToCsv(result));
  console.log('Done!');
}

await main();
