/** PDF çıkarma komutunun ham cevabı — backend ile eşleşmeli */

export interface BackendPreparedPage {
  pageNumber: number;
  markdown: string;
  text: string;
  elementCount: number;
}

export interface BackendArtifact {
  kind: string;
  path: string;
}

export interface BackendExtractionResponse {
  markdown: string;
  text: string;
  jsonElements: Array<Record<string, unknown>>;
  pages: BackendPreparedPage[];
  images: string[];
  mode: 'local' | 'hybrid';
  artifacts: BackendArtifact[];
}
