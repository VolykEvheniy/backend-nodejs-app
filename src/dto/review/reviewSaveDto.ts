export class ReviewSaveDto {
  carId?: string;
  text?: string;

  constructor(data: Partial<ReviewSaveDto>) {
    this.carId = data.carId;
    this.text = data.text;
  }
}