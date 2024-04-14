# The Good News According to St. Mark

A public-domain revision of the English Revised Version (ERV) of the Gospel according to St. Mark.

⚠️ **Work in progress** (I'm currently working on chapter 3) ⚠

## Quick Start ("I just want the text!")
While the project is in progress, you can download the latest revision of the text from the `dist` directory. The text is currently available only as a CSV file but will be available in other formats in the future.

## What and Why

This project aims to produce a modern public-domain revision of the English Revised Version (ERV) text of the Gospel of Mark.

This is a single-author interpretation, intended for personal-reflection, and not academic or (approved) worship use. For transparency, all changes are recorded in version control software (Git) and are reproducible using the scripts in this repository.

The need for this project arose during my curacy, when a man wondered into church and asked me if he could have a bible. Not wanting to say no, but not having anything suitable to hand, I gave him one of our pew bibles (NRSV). Not only are these large hardback books, they cost us lots of money. Later, the rector showed me where he kept small paperback copies of The Gospel according to Mark. While these are cheaper, they are still not free, and being the ESV translation they are not in the public domain, meaning we still have to pay a publisher and we can't print them ourselves.

To solve this, this project aims to create a reliable version of the gospel which is free to use, print, and distribute without copyright or licenses etc.

The English Revised Version (ERV) was published in 1885, and while readable it has lots of archaisms that make it inaccessible to first-time readers. For example, the use of the word "meet" to mean "suitable" or "appropriate" is not common in modern English.

I chose the ERV because it is the basis for many modern translations of the Bible such as the Revised Standard Version (RSV) and the New Revised Standard Version (NRSV). The ERV is approved by the Roman Catholic Church in England, the Church of England and others, making it a better choice as the basis for a public-domain revision than others such as the NET Bible or the World English Bible.

Importantly, this is a revision, not a new translation, but the Greek of the Tyndale House Greek New Testament and NA28 were consulted where the ERV presents an ambiguity (for example, when modernising grammar). While I aim for formal equivalence (this certainly isn't a "paraphrase" revision), the Bible is made to be read aloud, and so, where there are ambiguities or multiple possible interpretations, I have consulted the British National Corpus for the word which is most commonly used in modern English speech. I opt for some prosaic forms (such as choosing "behold!" over "look!" or "see!") where the word is still understandable but not common in British English. On the other hand, words like "gospel" are changed to "good news", where I believe the influence of organised religion or changes in society have skewed a word's meaning.

For verses not present in the ERV (7:16, 9:44, 9:46, 11:26, 15:28), the text of the Douay-Rheims Bible (DRB) was used as a basis for the revision. While I would have preferred to fall-back to the KJV (as it is the basis of the ERV), it is not public-domain in England, and the DRB is the closest public-domain equivalent which enjoys approval from a mainline denomination (RCC).

## Who is this for?

> "...the anarchists, the agitators, the looters, and people who in many instances have absolutely no clue what they're doing" - Donald Trump.


## Directory Structure
- `.vscode` - Contains the settings for the VSCode editor.
- `dist` - The final output of the build process, containing the revised text.
- `output`  The intermediate build steps of the various scripts in `src`.
- `src` - The source code for the various scripts used in the build process.
- `vendor` - The source files for the ERV & DRB text.

## Revision Method

### 1. Source Materials
1. ERV text downloaded as CSV

### 2. Finding and Replacing Archaisms
2. ERV text was tokenized using `tokenize.ts`
3. A set of archaisms and their translations were made by hand from the resulting list of tokens.
4. The archaisms were translated throughout the text using `modernize.ts`

    N.B.the `src/data/` directory contains a set of `archaic_**.jsonc` file where you can see each archaism and its revision.

5. Brute-force replacement produces lots of grammatical errors. To correct these, a set of errata were constructed by hand and corrected. (See `src/data/archaic_errata.jsonc`)

## 3. Text Revision
6. The text was revised using `revise.ts`. (See `src/data/revisions.jsonc`)

### 4. Finishing Touches
7. The revised text was Anglicized using `anglicize.ts`. (See `src/data/anglicisms.json`)

## DIY
1. Install Deno from [https://deno.land/](https://deno.land/)
2. Run `deno task start` to build the revised text.

See `deno.json` for a list of individual build tasks, or `src/README.md` for more information on the individual scripts.

## License
CC0 1.0 Universal
