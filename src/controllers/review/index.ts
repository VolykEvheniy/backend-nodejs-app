import httpStatus from "http-status";
import log4js from "log4js";
import { ReviewSaveDto } from 'src/dto/review/reviewSaveDto';
import { InternalError } from 'src/system/internalError';
import { Request, Response } from 'express';
import {countReviewsByCarsId, createReview as createReviewApi, listReviewsByCarId} from 'src/services/review';
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
    const { carId, size, from } = req.query;

    if (!carId) {
      return res.status(400).json({ message: "Car id is required" });
    }

    const query = {
      carId: carId as string,
      size: size ? parseInt(size as string, 10) : 10,
      from: from ? parseInt(from as string, 10) : 0,
    };

    const reviews = await listReviewsByCarId(query);
    return res.json(reviews);
  } catch (err) {
    const { message, status } = new InternalError(err);
    log4js.getLogger().error('Error in retrieving reviews.', err);
    return res.status(status).send({ message });
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

