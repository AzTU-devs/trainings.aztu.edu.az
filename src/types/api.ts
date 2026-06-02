export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type ApiEnvelope<T> = {
  data: T;
  meta?: unknown;
  timestamp: string;
};

export type FieldErrorItem = {
  field: string;
  code?: string;
  message: string;
  rejectedValue?: unknown;
};

export type ApiError = {
  status: number;
  code?: string;
  message: string;
  path?: string;
  requestId?: string;
  errors?: FieldErrorItem[];
};

export type Money = {
  amount: number;
  currency: string;
};
