import mongoose, {Document, Schema} from "mongoose";


export interface IReview extends Document {
  carId: string;
  text: string;
  createdAt: Date;
}

const reviewSchema = new Schema({
  carId: {
    type: String,
    required: true,
    ref: 'Car',
  },
  text: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;