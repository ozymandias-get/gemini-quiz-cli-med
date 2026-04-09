import type { GenerationStore } from '../useGenerationStore';

export const selectPdfSourcePath = (state: GenerationStore) => state.pdfSourcePath;
export const selectFileName = (state: GenerationStore) => state.fileName;
export const selectGenerationInProgress = (state: GenerationStore) => state.generationInProgress;
export const selectSetGenerationInProgress = (state: GenerationStore) => state.setGenerationInProgress;
