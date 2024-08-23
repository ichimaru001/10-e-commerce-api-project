const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  rating:{
    type:Number,
    min:1,
    max:5,
    required:[true,'Please provide review rating']
  },
  title:{
    type:String,
    trim:true,
    required:[true,'Please provide review title'],
    maxlength:100,
  },
  comment:{
    type:String,
    required:[true,'Please provide review comment'],
  },
  user:{
    type:mongoose.Types.ObjectId,
    ref:'User',
    required:true,
  },
  product:{
    type:mongoose.Types.ObjectId,
    ref:'Product',
    required:true,
  },
},{timestamps:true})

reviewSchema.index({product:1,user:1},{unique:true})

reviewSchema.statics.calculateAverageRating = async function(productId){
  const result = await this.aggregate([
    {$match:{product:productId}},
    {$group:{
      _id:'$product',
      averageRating:{$avg:'$rating'},
      numOfReviews:{$sum:1},
    }}
  ])

  try {
    await this.model('Product').findOneAndUpdate({_id:productId},{
      averageRating:Math.ceil(result[0]?.averageRating||0),
      numOfReviews:result[0]?.numOfReviews||0
    })
  } catch (error) {
    console.log(error)
  }
}

reviewSchema.post('save',async function(){
  await this.constructor.calculateAverageRating(this.product)
})
reviewSchema.post('deleteOne',{document:true,query:false},async function(){
  await this.constructor.calculateAverageRating(this.product)
})

const reviewModel = mongoose.model('Review',reviewSchema)

module.exports = reviewModel