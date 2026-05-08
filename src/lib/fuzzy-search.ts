/**
 * Simple fuzzy search algorithm for client-side search
 * Scores matches based on character position and contiguity
 */

export interface SearchableItem {
  id: string;
  title: string;
  searchText?: string; // Additional text to search in
}

export interface SearchResult<T extends SearchableItem> {
  item: T;
  score: number;
  highlight?: string; // Highlighted matched text
}

function calculateScore(searchTerm: string, text: string): number {
  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();

  if (!searchLower) return 0;
  if (textLower === searchLower) return 1000; // Perfect match
  if (textLower.startsWith(searchLower)) return 500; // Prefix match
  if (textLower.includes(searchLower)) return 300; // Contains match

  // Fuzzy score: consecutive characters score higher
  let score = 0;
  let searchIndex = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      consecutiveMatches++;
      score += 10 + consecutiveMatches;
      searchIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // If not all characters matched, return 0
  if (searchIndex !== searchLower.length) {
    return 0;
  }

  return score;
}

/**
 * Fuzzy search items and return sorted results
 * @param items Items to search
 * @param query Search query
 * @param getSearchText Function to extract searchable text from item
 * @returns Sorted array of results with scores
 */
export function fuzzySearch<T extends SearchableItem>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string = (item) => item.title,
): SearchResult<T>[] {
  if (!query.trim()) {
    return [];
  }

  const results: SearchResult<T>[] = [];

  for (const item of items) {
    const searchText = getSearchText(item);
    const score = calculateScore(query, searchText);

    if (score > 0) {
      results.push({
        item,
        score,
      });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}
