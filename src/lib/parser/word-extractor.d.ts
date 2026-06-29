declare module "word-extractor" {
  interface WordExtractorResult {
    getBody(): string;
    getFootnotes(): string;
    getHeaders(): Record<string, string>;
    getAnnotations(): string;
    getEndNotes(): string;
  }

  class WordExtractor {
    extract(document: Buffer | string): Promise<WordExtractorResult>;
  }

  export = WordExtractor;
}
