const express = require('express');
const path = require("path");
const morgan = require('morgan');
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const compression = require("compression");
const app = express();


app.enable("trust proxy");


// defining our engine
app.set("view engine", "pug");
// app.set("views", "./views"); for pug
app.set("views", path.join(__dirname, "./views"));

// app.use(
//   cors({
//     credentials: true,
//     origin: 'http://localhost:3000'
//   }))
app.use(cors({ credentials: true, origin: true }));
app.options('*', cors()) // include before other routes



// this is the middleware to serve public files.
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

//  helmet middleware should be used at the very top of middleware.
// It's used to set various http headers.
// app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
    },
  })
);




const environment = app.get("env");
// console.log(environment);
console.log("environemnt is ", app.get("env"));
// console.log(process.env.NODE_ENV);
// if (process.env.NODE_ENV !== 'production') {
if (app.get("env") !== "production") {
  // tiny morgan.
  app.use(morgan('dev'));
}

// this middle ware is to limit the number of requests from an IP in an hour. 
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "You have reached the max number of requests for an hour, please try again after an hour"
});
// each time we will make request to /api this limiter middleware will run
app.use("/api", limiter);

// this middleware is for preventing users from polluting queries, i.e it removes the duplicate queries for e.g sort=price & sort= price. so in this case it will only remove duplicate sort.so white list let us run some duplicate queries as we want duration because of the query . ?duration = 5 & duration =9
app.use(hpp({
  whitelist: [
    "duration",
    "ratingsQuality",
    "ratingsAverage",
    "maxGroupSize",
    "difficulty",
    "price",
  ]
}));


app.use(compression());



//API Routes.
const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const bookingRoutes = require("./routes/bookingRoutes");
// test route. 

//VIEW ROUTES.
const viewRouter = require("./routes/viewRoutes");


// this is the middleware for adding data to the body.
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.text());
// support json encoded bodies
// so limit is to limit the size of the data coming in body and we are setting it to 10kb.
app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());
// Data sanitization against NOSql query injection, so basically this removes the $ signs from req.query req.body and req.params . so this query can be prevented     "email" : {"$gt": ""},
app.use(mongoSanitize());

// Data sanitization against XXS, this will convert html tags to symbols.
app.use(xss());

// support url encoded bodies
app.use(
  express.urlencoded({
    extended: true,
  })
);



// users routes.

// middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});




// API Routes.
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/users', userRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/booking", bookingRoutes);

//VIEW ROUTES.
app.use("/", viewRouter);

//Unhandelled Routes middle ware
// all runs for all the verbs like get post and every thing
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// global error handling middle ware
app.use(globalErrorHandler);
module.exports = app;
