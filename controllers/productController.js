const Product = require('../models/product');

const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cloudinary = require('cloudinary');
const WhereClause = require('../utils/whereClause');
const { findById } = require('../models/product');

exports.addProduct = BigPromise(async (req, res, next) => {
    //images
    let imageArray = []
    if(!req.files){
        return next(new CustomError("images are required",401))
    }
    if(req.files){
        for (let index = 0; index <  req.files.photos.length; index++) {
            let result = await cloudinary.v2.uploader.upload(req.files.photos[index].tempFilePath,{
                folder: "products",

            });
            imageArray.push({
                id: result.public_id,
                secure_url : result.secure_url,
            })

        }
    }

    req.body.photos = imageArray;
    req.body.user = req.user.id;

    const product =  await Product.create(req.body);
    
    res.status(200).json({
        success: true,
        product, 
    });

});

exports.getAllProduct = BigPromise(async (req, res, next) => {
    
    const resultperPage = 6;
    const totalcountProduct = await Product.countDocuments();

    

    
    const productsObj = new WhereClause(Product.find(), req.query).search().filter();

    let products = await productsObj.base;
    const filteredProductNumber = products.length;



    productsObj.pager(resultperPage);
    products = await productsObj.base.clone();

    res.status(200).json({
        success:true,
        products,
        filteredProductNumber,
        totalcountProduct,
    })
});

exports.getOneProduct = BigPromise(async (req, res, next) => {

    const product = await Product.findById(req.params.id);


    if(!product){
        return next(new CustomError("No Product found with this id", 401))
    }

    res.status(200).json({
        success:true,
        product,
    })
  
});

exports.addReview = BigPromise(async (req, res, next) => {

    const {rating, comment, productId} = req.body;

    const review ={
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,

    }

    const product = await Product.findById(productId);
    const AlreadyReview = product.reviews.find(
        (rev) => rev.user.toString() === req.user._id.toString()

    )
    if(AlreadyReview){
        product.reviews.forEach((review) =>{
            if(review.user.toString() === req.user._id.toString()){
                review.comment = comment;
                review.rating = rating;
            }
        });
    }else{
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }

    // adjust ratings
    product.ratings = product.reviews.reduce((acc, item) => item.rating +acc, 0)/ product.reviews.length;

    //save
    await product.save({validateBeforeSave: false});

    res.status(200).json({
        success:true,
    })
  
});

exports.deleteReview = BigPromise(async (req, res, next) => {

    const {productId} = req.query;

    const product = await Product.findById(productId);

    const reviews = product.reviews.filter(
        (rev) => rev.user.toString() === req.user._id.toString()
    )

    const numOfReviews = reviews.length

    // adjust ratings
    product.ratings = product.reviews.reduce((acc, item) => item.rating +acc, 0)/ product.reviews.length;

    //update the product
    await Product.findByIdAndDelete(productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success:true,
    })
  
});

exports.getOnlyReviewsForOneProduct = BigPromise(async (req, res, next) =>{
    const product = await Product.findById(req.query.id);
    res.status(200).json({
        success: true,
        reviews: product.reviews,
    })

});


// Admin only Controllers 

exports.adminGetAllProduct = BigPromise(async (req, res, next) => {
    
    const products = await Product.find();

    res.status(200).json({
        success:true,
        products,

    })
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
    
    let product = await Product.findById(req.params.id);

    if(!product){
        return next(new CustomError("No Product found with this id", 401))
    }
    let imagesArray = [];
    if(req.files){
        // destroy existing images
        for (let index = 0; index < product.photos.length; index++) {
          const res = await cloudinary.v2.uploader.destroy(product.photos[index].id); 
            
        }
        //upload and save the images
    
            for (let index = 0; index <  req.files.photos.length; index++) {
                let result = await cloudinary.v2.uploader.upload(req.files.photos[index].tempFilePath,{
                    folder: "products", // folder name -> .env
    
                });
                imagesArray.push({
                    id: result.public_id,
                    secure_url : result.secure_url,
                })  
        }
    }
    
    req.body.photos = imagesArray;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })

    res.status(200).json({
        success:true,
        product,

    })
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
    console.log("1");
    let product = await Product.findById(req.params.id);
    console.log(product);

    if(!product){
        return next(new CustomError("No Product found with this id", 401))
    }
      // destroy existing images
      for (let index = 0; index < product.photos.length; index++) {
        await cloudinary.v2.uploader.destroy(product.photos[index].id); 
          
      }

      await product.remove();

   
    res.status(200).json({
        success:true,
        message: "Product was deleted!",
        product,

    })
});
