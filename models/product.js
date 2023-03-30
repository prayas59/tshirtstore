const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please provide product name'],
        trim: true,
        maxlength: [120, 'Product name should not be more then 120 characters']
    },
    price: {
        type: Number,
        required: [true, 'please provide product price'],
        maxlength: [5, 'Product price should not be more then 5 digits']
    },
    description : {
        type: String,
        required: [true, 'please provide product description'],
    },
    photos: [
        {
            id: {
                type: String,
                required: true
            },
            secure_url: {
                type: String,
                required: true
            },
        }
    ],
    category : {
        type: String,
        required: [true, 'please select category from  short-sleeves, long-sleeves, sweat-shirt, hoddies'],
        enum:{
            values: [
                'shortsleeves',
                'longsleeves',
                'sweatshirt',
                'hoddies'
            ],
            message : 'please select category only from  short-sleeves, long-sleeves, sweat-shirt, hoddies',
        }
    },
    stock:{
        type:Number,
        required: [true, 'Please add a number in stock'],
    },
    brand : {
        type: String,
        required: [true, 'please add a  brand for clothing'],
    },
    ratings : {
        type: Number,
        default: 0,
    },
    numOfReviews : {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required:true,
            },
            ratings : {
                type: Number,
                default: 0,
                required: true,
            },
            comment : {
                type: String,
                required: true,
            },
        }
    ],
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
    

})


module.exports = mongoose.model('Product', productSchema);
