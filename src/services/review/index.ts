import {ReviewSaveDto} from "src/dto/review/reviewSaveDto";
import {checkCarExists} from "src/client/externalRequests";
import Review, {IReview} from "src/model/review";
import {CarNotFoundError} from "src/system/carNotFoundError";
import {ReviewInfoDto} from "src/dto/review/reviewInfoDto";
import {ReviewRequestDto} from "src/dto/review/reviewRequestDto";



export const createReview = async (reviewDto: ReviewSaveDto): Promise<string> => {
  await validateReview(reviewDto);

  const review = await new Review(reviewDto).save();
  return review._id.toString();
};


export const validateReview = async (reviewDto: ReviewSaveDto) => {
  const carId = reviewDto.carId;
  if (!carId) {
    throw new Error(`Car ID is required`);
  }
  if (!await checkCarExists(carId)) {
    throw new CarNotFoundError(`No car exists with ID ${carId}`);
  }

  if (!reviewDto.text) {
    throw new Error('Review text is required');
  } else if (reviewDto.text.length > 500) {
    throw new Error('Review text cannot exceed 500 characters');
  }
};

export const listReviewsByCarId = async (query: ReviewRequestDto): Promise<ReviewInfoDto[]> => {
  const reviews = await Review.find({carId: query.carId})
    .sort({createdAt: -1})
    .skip(query.from)
    .limit(query.size);
  return reviews.map(review => toInfoReviewDto(review));
};

export const toInfoReviewDto = (review: IReview): ReviewInfoDto => {
  return ({
    _id: review._id,
    carId: review.carId,
    text: review.text,
    createdAt: review.createdAt,
  });
};

export const countReviewsByCarsId = async (carsId: string[]): Promise<{[key: string]: number}> => {
  const counts = await Review.aggregate([
    { $match: { carId: { $in: carsId } } },
    { $group: { _id: "$carId", count: { $sum: 1 } } },
  ]);

  const countMap: {[key: string]: number} = {};
  counts.forEach((item) => {
    countMap[item._id] = item.count;
  });

  carsId.forEach(id => {
    if (!countMap[id]) {
      countMap[id] = 0;
    }
  });
  return countMap;
};





