const express = require('express');
const router = express.Router();
const {sendStripeKey, sendRazorpayKey, captureStripePaymemt, captureRazorpayPaymemt } = require('../controllers/paymentController');

const { isLoggedIn } = require('../middlewares/user');

router.route("/stripekey").get(isLoggedIn, sendStripeKey);
router.route("/razorpaykey").get(isLoggedIn, sendRazorpayKey);

router.route("/capturestripe").post(isLoggedIn, captureStripePaymemt);
router.route("/capturerazorpay").post(isLoggedIn, captureRazorpayPaymemt);


module.exports = router;