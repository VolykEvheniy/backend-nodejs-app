import httpStatus from "http-status";

interface ErrorType {
  message?: string;
  statusText?: string;
  status?: number;
}


export class ExternalError {
  message: string;
  status: number;


  constructor(error: unknown) {
    const {
      message,
      statusText,
      status,
    } = error as ErrorType;
    this.status = status || httpStatus.BAD_GATEWAY;
    this.message = statusText || message || 'An unexpected error occurred';
  }
}


