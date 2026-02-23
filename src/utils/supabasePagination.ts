/** Fetch all rows with pagination to bypass Supabase 1000-row limit */
export async function fetchAllPaginated<T = any>(
  baseQuery: () => any,
  pageSize = 1000
): Promise<T[]> {
  const allRecords: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await baseQuery().range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRecords.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return allRecords;
}
