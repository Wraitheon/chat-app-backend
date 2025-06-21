export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: {
    message: string;
    status_code: number;
    code?: string; // An optional, machine-readable error code
  };
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;