import bodyParser from 'body-parser';
import express from 'express';
import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';
import mongoSetup from '../mongoSetup';
import {createReview, getReviewCounts, getReviews} from "src/controllers/review";
import Review from "src/model/review";
import { ObjectId } from 'mongodb';
import * as reviewService from 'src/services/review';
import * as externalRequest from 'src/client/externalRequests';

const { expect } = chai;

chai.use(chaiHttp);
chai.should();

const sandbox = sinon.createSandbox();
const app = express();

app.use(bodyParser.json({ limit: '1mb' }));

app.post('/reviews', createReview);
app.get('/reviews', getReviews);
app.post('/reviews/_counts', getReviewCounts);

const review1 = new Review({
  carId: 'testCarId1',
  text: 'Great car!',
  createdAt: new Date(),
});

const review2 = new Review({
  carId: 'testCarId1',
  text: 'Not bad',
  createdAt: new Date(),
});

const review3 = new Review({
  carId: 'testCarId2',
  text: 'Excellent!',
  createdAt: new Date(),
});

describe('Review Controller', () => {
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


  describe('POST /reviews', () => {
    it('should create a new review and return its id', (done) => {
      const reviewDto = {
        carId: 'testCarId',
        text: 'Great car!',
      };

      const checkCarExistsStub = sandbox.stub(externalRequest, 'checkCarExists').resolves(true);
      const saveStub = sandbox.stub(Review.prototype, 'save').resolves({ _id: new ObjectId().toString() });

      chai.request(app)
        .post('/reviews')
        .send(reviewDto)
        .end((_, res) => {
          res.should.have.status(201);
          expect(res.body).to.have.property('id');
          checkCarExistsStub.calledOnceWith('testCarId').should.be.true;
          saveStub.calledOnce.should.be.true;
          done();
        });
    });

    it('should return error if car does not exist', (done) => {
      const reviewDto = {
        carId: 'nonExistingCarId',
        text: 'Nice car!',
      };

      const checkCarExistsStub = sandbox.stub(externalRequest, 'checkCarExists').resolves(false);

      chai.request(app)
        .post('/reviews')
        .send(reviewDto)
        .end((_, res) => {
          res.should.have.status(404);
          expect(res.body).to.have.property('message');
          checkCarExistsStub.calledOnceWith('nonExistingCarId').should.be.true;
          done();
        });
    });
  });

  describe('GET /reviews', () => {
    it('should return a list of reviews for a given carId', (done) => {
      const reviewRequestDto = {
        carId: 'testCarId1',
        size: 2,
        from: 0,
      };

      chai.request(app)
        .get('/reviews')
        .query(reviewRequestDto)
        .end((_, res) => {
          res.should.have.status(200);
          expect(res.body.length).to.equal(2);
          expect(res.body[0].text).to.equal('Not bad');
          expect(res.body[1].text).to.equal('Great car!');
          done();
        });
    });

    it('should return an error if carId is missing', (done) => {
      chai.request(app)
        .get('/reviews')
        .end((_, res) => {
          res.should.have.status(400);
          expect(res.body).to.have.property('message', 'Car id is required');
          done();
        });
    });

    it('should return empty array if no reviews found', (done) => {
      const reviewRequestDto = {
        carId: 'nonExistingCarId',
        size: 2,
        from: 0,
      };

      chai.request(app)
        .get('/reviews')
        .query(reviewRequestDto)
        .end((_, res) => {
          res.should.have.status(200);
          expect(res.body).to.be.an('array').that.is.empty;
          done();
        });
    });
  });

  describe('POST /reviews/_counts', () => {
    it('should return a count of reviews grouped by carId', (done) => {
      const reviewCountRequestDto = {
        carsId: ['testCarId1', 'testCarId2', 'testCarId3'],
      };

      const counts = {
        testCarId1: 2,
        testCarId2: 1,
        testCarId3: 0,
      };

      sandbox.stub(reviewService, 'countReviewsByCarsId').resolves(counts);

      chai.request(app)
        .post('/reviews/_counts')
        .send(reviewCountRequestDto)
        .end((_, res) => {
          res.should.have.status(200);
          expect(res.body.testCarId1).to.equal(2);
          expect(res.body.testCarId2).to.equal(1);
          expect(res.body.testCarId3).to.equal(0);
          done();
        });
    });
  });
});