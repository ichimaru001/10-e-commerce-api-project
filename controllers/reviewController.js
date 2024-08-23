const reviewModel = require('../models/review')
const productModel = require('../models/product')

const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const {checkPermissions} = require('../utils')

const createReview = async(req,res)=>{
  const {product:productId} = req.body
  
  const isValidProduct = await productModel.findOne({_id:productId})
  if(!isValidProduct){
    throw new CustomError.NotFoundError(`No product with id : ${productId}`)
  }
  
  const alreadySubmitted = await reviewModel.findOne({
    product:productId,user:req.user.userId,
  })
  if(alreadySubmitted){
    throw new CustomError.BadRequestError('Already submitted review for this product')
  }

  req.body.user = req.user.userId
  const review = await reviewModel.create(req.body)

  res.status(StatusCodes.CREATED).json({review})
}
const getAllReviews = async(req,res)=>{
  const reviews = await reviewModel.find({}).populate({path:'product',select:'name company price'})

  res.status(StatusCodes.OK).json({reviews,count:reviews.length})
}
const getSingleReview = async(req,res)=>{
  const {id:reviewId} = req.params

  const review = await reviewModel.findOne({_id:reviewId})
  if(!review){
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
  }

  res.status(StatusCodes.OK).json({review})
}
const updateReview = async(req,res)=>{
  const {id:reviewId} = req.params
  const {rating,title,comment} = req.body

  const review = await reviewModel.findOne({_id:reviewId})
  if(!review){
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
  }

  checkPermissions(req.user,review.user)

  review.title = title
  review.rating = rating
  review.comment = comment

  await review.save()
  res.status(StatusCodes.OK).json({review})
}
const deleteReview = async(req,res)=>{
  const {id:reviewId} = req.params

  const review = await reviewModel.findOne({_id:reviewId})
  if(!review){
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
  }

  checkPermissions(req.user,review.user)
  await review.deleteOne()
  res.status(StatusCodes.OK).json({msg:`Successfully deleted review with id : ${reviewId}`})
} 

const getSingleProductReviews = async(req,res)=>{
  const {id:productId} = req.params
  const reviews = await reviewModel.find({product:productId})

  res.status(StatusCodes.OK).json({reviews,count:reviews.length})
}

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
}