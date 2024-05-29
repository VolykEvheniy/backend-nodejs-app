import chai from 'chai';
import sinon from 'sinon';
import mongoSetup from '../mongoSetup';
import Review from 'src/model/review';
import * as reviewService from 'src/services/review';
import * as externalRequest from 'src/client/externalRequests';
import { ReviewSaveDto } from 'src/dto/review/reviewSaveDto';
import mongoose from "mongoose";
import {CarNotFoundError} from "src/system/carNotFoundError";
import {ReviewRequestDto} from "src/dto/review/reviewRequestDto";
import axios from "axios";
import {checkCarExists} from "src/client/externalRequests";

const { expect } = chai;
const sandbox = sinon.createSandbox();

const review1 = new Review({
  carId: 'testCarId1',
  text: 'Great car!',
  createdAt: new Date('2021-01-01T00:00:00Z'),
});

const review2 = new Review({
  carId: 'testCarId1',
  text: 'Not bad',
  createdAt: new Date('2021-01-02T00:00:00Z'),
});

const review3 = new Review({
  carId: 'testCarId2',
  text: 'Excellent!',
  createdAt: new Date('2021-01-03T00:00:00Z'),
});


describe('Review Service', () => {
  before(async () => {
    await mongoSetup;

    await Review.deleteMany({});

    await review1.save();
    await review2.save();
    await review3.save();
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('createReview', () => {
    it('should create a new review and return its id', (done) => {
      const reviewDto: ReviewSaveDto = new ReviewSaveDto({
        carId: 'testCarId',
        text: 'Great car!',
      });

      const checkCarExistsStub = sandbox.stub(externalRequest, 'checkCarExists').resolves(true);

      reviewService.createReview(reviewDto)
        .then(async (reviewId) => {
          const review = await Review.findById(reviewId);

          expect(reviewId).to.exist;
          expect(checkCarExistsStub.calledOnceWith('testCarId')).to.be.true;
          expect(review).to.exist;
          expect(review?.carId).to.equal(reviewDto.carId);
          expect(review?.text).to.equal(reviewDto.text);
          done();
        })
        .catch(done);
    });
  });

  describe('validateReview', () => {
    it('should throw an error if carId is missing', (done) => {
      const reviewDto: ReviewSaveDto = new ReviewSaveDto({
        text: 'Great car!',
      });

      reviewService.validateReview(reviewDto)
        .then(() => done(new Error('Expected method to reject.')))
        .catch((error) => {
          expect(error.message).to.equal('Car ID is required');
          done();
        });
    });

    it('should throw an error if text is missing', (done) => {
      const reviewDto: ReviewSaveDto = new ReviewSaveDto({
        carId: 'testCarId',
        text: '',
      });

      sandbox.stub(externalRequest, 'checkCarExists').resolves(true);

      reviewService.validateReview(reviewDto)
        .then(() => done(new Error('Expected method to reject.')))
        .catch((error) => {
          expect(error.message).to.equal('Review text is required');
          done();
        });
    });

    it('should throw CarNotFoundError if car does not exist', (done) => {
      const reviewDto: ReviewSaveDto = new ReviewSaveDto({
        carId: 'invalidCarId',
        text: 'Great car!',
      });

      sandbox.stub(externalRequest, 'checkCarExists').resolves(false);

      reviewService.validateReview(reviewDto)
        .then(() => done(new Error('Expected method to reject.')))
        .catch((error) => {
          expect(error).to.be.instanceOf(CarNotFoundError);
          expect(error.message).to.equal(`No car exists with ID ${reviewDto.carId}`);
          done();
        });
    });

    it('should throw an error if review text exceeds 500 characters', (done) => {
      const longText = 'a'.repeat(501);
      const reviewDto: ReviewSaveDto = new ReviewSaveDto({
        carId: 'testCarId',
        text: longText,
      });

      sandbox.stub(externalRequest, 'checkCarExists').resolves(true);

      reviewService.validateReview(reviewDto)
        .then(() => done(new Error('Expected method to reject.')))
        .catch((error) => {
          expect(error.message).to.equal('Review text cannot exceed 500 characters');
          done();
        });
    });
  });

  describe('listReviewsByCarId', () => {
    it('should return a list of reviews for a given carId', (done) => {
      const reviewRequestDto: ReviewRequestDto = {
        carId: 'testCarId1',
        size: 2,
        from: 0,
      };

      reviewService.listReviewsByCarId(reviewRequestDto)
        .then((reviews) => {
          expect(reviews.length).to.equal(2);
          expect(reviews[0].text).to.equal('Not bad');
          expect(reviews[1].text).to.equal('Great car!');
          done();
        })
        .catch(done);
    });
  });
  describe('countReviewsByCarsId', () => {
    it('should return a count of reviews grouped by carId', (done) => {
      const carIds = ['testCarId1', 'testCarId2', 'testCarId3'];

      reviewService.countReviewsByCarsId(carIds)
        .then((result) => {
          expect(result['testCarId1']).to.equal(2);
          expect(result['testCarId2']).to.equal(1);
          expect(result['testCarId3']).to.equal(0);
          done();
        })
        .catch(done);
    });
  });

  describe('checkCarExists', () => {

    it('should return true if the car exists', async () => {
      const carId = 'existingCarId';
      const axiosStub = sandbox.stub(axios, 'get').resolves({ status: 200 });

      const result = await checkCarExists(carId);

      expect(result).to.be.true;
      expect(axiosStub.calledOnceWith(`http://localhost:8080/api/car/${carId}`)).to.be.true;
    });

    it('should return false if the car does not exist (404)', async () => {
      const carId = 'nonExistingCarId';
      const axiosStub = sandbox.stub(axios, 'get').rejects({
        response: { status: 404 },
        isAxiosError: true,
      });

      const result = await checkCarExists(carId);

      expect(result).to.be.false;
      expect(axiosStub.calledOnceWith(`http://localhost:8080/api/car/${carId}`)).to.be.true;
    });
  });
});


