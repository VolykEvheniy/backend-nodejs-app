import httpStatus from "http-status";

export class CarNotFoundError {
  message: string;
  status: number;


  constructor(message: string, status: number = httpStatus.NOT_FOUND) {
    this.message = message;
    this.status = status;
  }


}