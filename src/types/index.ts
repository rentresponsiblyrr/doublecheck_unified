// Type exports for better organization
export * from "./categories";
export * from "./inspection";
export * from "./propertySubmission";

// Common types
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface APIResponse<T = unknown> {
  data: T;
  error?: AppError;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
