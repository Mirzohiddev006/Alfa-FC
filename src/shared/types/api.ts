export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiValidationErrorItem {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface ApiValidationError {
  detail: ApiValidationErrorItem[];
}
