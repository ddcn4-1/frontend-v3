export interface ApiResponse<T> {
  message?: string;
  data?: T;
  success: boolean;
  error?: string;
  timestamp?: string;
}

export type ApiResponseString = ApiResponse<string>;
export type ApiResponseBoolean = ApiResponse<boolean>;
