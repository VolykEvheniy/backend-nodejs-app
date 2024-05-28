import express from 'express';
import {
  createReview, getReviewCounts, getReviews,
} from 'src/controllers/review';


const router = express.Router();

router.post('', createReview);
router.get('', getReviews);
router.post("/_counts", getReviewCounts);

export default router;