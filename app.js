const express = require('express');
require('dotenv').config();
const app = express();
const morgan = require('morgan');
const cookiePareser = require('cookie-parser');
const fileUpload = require('express-fileupload');

// for swagger documentation
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load('./swagger.yaml');

// Swagger middleware
app.use('/api-docs',swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// regular middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// cookies and file middleware
app.use(cookiePareser());
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp"
}));

// morgan middleware
app.use(morgan('tiny'));

// import all routes here
const home = require('./routes/home');
const user = require('./routes/user');
const product = require('./routes/product');
const payment = require('./routes/payment');
const order = require('./routes/order');

//temp check 
app.set("view engine", "ejs");

// router middleware
app.use('/api/v1', home);
app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', payment);
app.use('/api/v1', order);

app.get('/signuptest', (req,res) =>{
    res.render('signuptest')
})

// Export App Js
module.exports = app;