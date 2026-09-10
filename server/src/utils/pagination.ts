import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().optional(),
  sort: z.string().trim().optional(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function paginate<T>(data: T[], total: number, pagination: Pagination) {
  return {
    data,
    meta: { page: pagination.page, per_page: pagination.per_page, total },
  };
}

export function toSort(sort?: string): Record<string, 1 | -1> {
  if (!sort) return { createdAt: -1 };
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return { [field]: desc ? -1 : 1 };
}
