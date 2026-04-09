import { useEffect } from 'react';
import type { PreparedDocumentPage } from '../types';

type SearchStatus = 'IDLE' | 'FOUND' | 'NOT_FOUND';

interface UseSourceViewerSearchParams {
  pageMap: PreparedDocumentPage[];
  searchText: string;
  searchLocale: string;
  pageNumber: number;
  setPageNumber: (pageNumber: number) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSearchStatus: (status: SearchStatus) => void;
}

export function normalizeSearch(text: string, locale: string): string {
  return text
    .toLocaleLowerCase(locale)
    .replace(/[.,/#!$%^&*;:{}=\-_`~()[\]"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function scorePage(page: PreparedDocumentPage, normalizedQuery: string, locale: string): number {
  const haystack = normalizeSearch(page.searchText || `${page.markdown}\n${page.text}`, locale);
  if (!haystack) return 0;
  if (haystack.includes(normalizedQuery)) return 1000;

  const queryWords = normalizedQuery.split(' ').filter((word) => word.length > 3);
  if (queryWords.length === 0) return 0;

  let matches = 0;
  for (const word of queryWords) {
    if (haystack.includes(word)) matches += 1;
  }
  return (matches / queryWords.length) * 100;
}

export function useSourceViewerSearch({
  pageMap,
  searchText,
  searchLocale,
  pageNumber,
  setPageNumber,
  setIsSearching,
  setSearchStatus,
}: UseSourceViewerSearchParams): void {
  useEffect(() => {
    const findPageForText = async () => {
      if (pageMap.length === 0 || !searchText || searchText.length < 3) {
        setSearchStatus('IDLE');
        return;
      }

      setIsSearching(true);
      setSearchStatus('IDLE');
      try {
        const normalizedQuery = normalizeSearch(searchText, searchLocale);
        const currentPage = pageMap.find((page) => page.pageNumber === pageNumber);
        if (currentPage && scorePage(currentPage, normalizedQuery, searchLocale) > 70) {
          setSearchStatus('FOUND');
          return;
        }

        let bestPage = -1;
        let maxScore = 0;
        for (const page of pageMap) {
          if (page.pageNumber === pageNumber) continue;
          const score = scorePage(page, normalizedQuery, searchLocale);
          if (score > maxScore) {
            maxScore = score;
            bestPage = page.pageNumber;
          }
          if (score >= 1000) break;
        }

        if (bestPage !== -1 && maxScore > 35) {
          setPageNumber(bestPage);
          setSearchStatus('FOUND');
        } else {
          setSearchStatus('NOT_FOUND');
        }
      } catch {
        setSearchStatus('NOT_FOUND');
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      void findPageForText();
    }, 350);
    return () => clearTimeout(timer);
  }, [pageMap, pageNumber, searchLocale, searchText, setIsSearching, setPageNumber, setSearchStatus]);
}
