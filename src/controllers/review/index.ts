import httpStatus from "http-status";
import log4js from "log4js";
import { ReviewSaveDto } from 'src/dto/review/reviewSaveDto';
import { InternalError } from 'src/system/internalError';
import { Request, Response } from 'express';
import {countReviewsByCarsId, createReview as createReviewApi, listReviewsByCarId} from 'src/services/review';
import {ReviewQueryDto} from "src/dto/review/reviewQueryDto";
import {ReviewCountRequestDto} from "src/dto/review/reviewCountRequestDto";


export const createReview = async (req: Request, res: Response) => {
  try {
    const review = new ReviewSaveDto(req.body);
    const id = await createReviewApi({...review});
    res.status(httpStatus.CREATED).send({
      id,
    });
  } catch (err) {
    const { message, status } = new InternalError(err);
    log4js.getLogger().error('Error in creating review.', err);
    res.status(status).send({ message });
  }
};


export const getReviews = async (req: Request, res: Response) => {
  try {
    const request = new ReviewQueryDto(req.body);
    const reviews = await listReviewsByCarId(request);
    res.json(reviews);
  } catch (err) {
    const { message, status } = new InternalError(err);
    log4js.getLogger().error('Error in retrieving reviews.', err);
    res.status(status).send({ message });
  }
};

export const getReviewCounts = async (req: Request, res: Response) => {
  try {
    const request = new ReviewCountRequestDto(req.body);
    const counts = await countReviewsByCarsId(request.carsId);
    res.json(counts);
  } catch (err) {
    const { message, status } = new InternalError(err);
    log4js.getLogger().error('Error in counting reviews.', err);
    res.status(status).send({ message });
  }
};

