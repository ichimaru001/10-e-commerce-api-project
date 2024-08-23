const orderModel = require("../models/order");
const productModel = require("../models/product");

const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { checkPermissions } = require("../utils");

const fakeStripeAPI = async ({ amount, currency }) => {
  const client_secret = "someRandomValue";
  return { client_secret, amount };
};

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError("No cart items provided");
  }
  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError(
      "Please provide tax and shipping fee"
    );
  }

  let orderItems = [];
  let subtotal = 0;
  for (const item of cartItems) {
    const dbProduct = await productModel.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new CustomError.NotFoundError(
        `No product with id : ${item.product}`
      );
    }
    const { name, price, image, _id } = dbProduct;
    const singleOrderItem = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };
    // add item to order
    orderItems = [...orderItems, singleOrderItem];
    // calculate subtotal
    subtotal += item.amount * price;
  }

  // calculate total
  const total = tax + shippingFee + subtotal;

  // get client secret
  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: "usd",
  });

  const order = await orderModel.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userId,
  });

  res.status(StatusCodes.CREATED).json({order,clientSecret:order.client_secret})
};
const getAllOrders = async (req, res) => {
  const orders = await orderModel.find({})
  res.status(StatusCodes.OK).json({orders:orders,count:orders.length})
};
const getSingleOrder = async (req, res) => {
  const {id:orderId} = req.params

  const order = await orderModel.findOne({_id:orderId})
  if(!order){
    throw new CustomError.NotFoundError(`Order with ID ${orderId} does not exist`)
  }

  checkPermissions(req.user,order.user)
  res.status(StatusCodes.OK).json({msg:`Successfully received user ${req.user.userId}'s order!`,order:order})
};
const getCurrentUserOrders = async (req, res) => {
  const {userId} = req.user

  const orders = await orderModel.find({user:userId})
  res.status(StatusCodes.OK).json({msg:`Successfully retrieved user ${userId}'s orders!`,orders:orders,count:orders.length})
};
const updateOrder = async (req, res) => {
  const {id:orderId} = req.params 

  const {paymentIntentId} = req.body
  if(!paymentIntentId){
    throw new CustomError.BadRequestError('Please provide payment intent ID')
  }

  const order = await orderModel.findOne({_id:orderId})
  if(!order){
    throw new CustomError.NotFoundError(`Order with ID ${orderId} is not found`)
  }

  checkPermissions(req.user,order.user)
  order.status = 'paid'
  order.paymentIntentId = paymentIntentId

  await order.save()
  res.status(StatusCodes.OK).json({msg:`Successfully updated user ${req.user.userId}'s order!`,order:order})
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
