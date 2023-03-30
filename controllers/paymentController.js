const BigPromise = require('../middlewares/bigPromise');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
// import { nanoid } from 'nanoid'

exports.sendStripeKey = BigPromise(async(req, res, next)=>{
    res.status(200).json({
        stripekey: process.env.STRIPE_API_KEY,
    })
});

exports.captureStripePaymemt = BigPromise(async(req, res, next)=>{
   
const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: 'inr',
    automatic_payment_methods: {enabled: true},

    //optional
    metadata: {integration_check: 'accept_a_payment'}

  });
  res.status(200).json({
    success: true,
    client_secret: paymentIntent.client_secret,
    // you can optionally send id as well
    id: paymentIntent.id,
  })
});


exports.sendRazorpayKey = BigPromise(async(req, res, next)=>{
    res.status(200).json({
        stripekey: process.env.RAZORPAY_API_KEY,
    })
});

exports.captureRazorpayPaymemt = BigPromise(async(req, res, next)=>{
    var instance = new Razorpay({
         key_id: process.env.RAZORPAY_API_KEY,
         key_secret: process.env.RAZORPAY_SECRET,
         })
    var options = {
        amount: req.body.amount,
        currency: "INR",
        receipt: 'order_number#1',
        // receipt: nanoid(),
        notes: {
          key1: "value3",
          key2: "value2"
        }
    }
    const myOrder = await instance.orders.create(options);
    res.status(200).json({
        success:true,
        amount:req.body.amount,
        order:myOrder,
        
    })
});