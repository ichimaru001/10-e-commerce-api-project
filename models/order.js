const mongoose = require('mongoose')

const singleOrderItemSchema = new mongoose.Schema({
  name:{type:String,required:true},
  image:{type:String,required:true},
  price:{type:Number,required:true},
  amount:{type:Number,required:true},
  product:{
    type:mongoose.Types.ObjectId,
    ref:'Product',
    required:true,
  }
})

const orderSchema = new mongoose.Schema({
  tax:{
    type:Number,
    required:[true,'Please provide order tax']
  },
  shippingFee:{
    type:Number,
    required:[true,'Please provide order shipping fee']
  },
  subtotal:{
    type:Number,
    required:[true,'Please provide order subtotal']
  },
  total:{
    type:Number,
    required:[true,'Please provide order total']
  },
  orderItems:[singleOrderItemSchema],
  status:{
    type:String,
    required:[true,'Please provide order status'],
    enum:['pending','failed','paid','delivered','canceled'],
    default:'pending',
  },
  user:{
    type:mongoose.Types.ObjectId,
    ref:'User',
    required:true,
  },
  clientSecret:{
    type:String,
    required:[true,'Please provide client secret']
  },
  paymentIntentId:{
    type:String,
  },
},{timestamps:true})

const orderModel = mongoose.model('Order',orderSchema)


 module.exports = orderModel