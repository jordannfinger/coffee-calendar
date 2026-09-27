type Page<T> = {
  data: T[] | null;
  count: number | null;
  error: unknown;
};

// PostgREST can cap a response below the requested range, so advance by the
// number of rows actually received and use the exact count to detect the end.
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<Page<T>>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];

  while (true) {
    const { data, count, error } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) throw error;
    if (!Array.isArray(data) || count === null || !Number.isSafeInteger(count) || count < 0) {
      throw new Error("Incomplete inventory response");
    }
    if (data.length === 0) {
      if (rows.length < count) throw new Error("Incomplete inventory response");
      return rows;
    }
    rows.push(...data);
    if (rows.length >= count) return rows;
  }
}
