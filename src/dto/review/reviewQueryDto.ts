import {QueryDto} from "../queryDto";

export class ReviewQueryDto extends QueryDto {
  carId: string;
  size?: number;
  from?: number;


  constructor(query: ReviewQueryDto) {
    super();
    if (!query.carId) {
      throw new Error("carId is required");
    }
    this.carId = query.carId;
    this.skip = query.from ? parseInt(String(query.from), 10) : 0;
    this.limit = query.size ? parseInt(String(query.size), 10) : 10;
  }
}