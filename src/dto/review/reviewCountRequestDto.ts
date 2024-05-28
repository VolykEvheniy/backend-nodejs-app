

export class ReviewCountRequestDto {
  carsId: string[];


  constructor(data: {carsId: string[]}) {
    this.carsId = data.carsId;
  }
}