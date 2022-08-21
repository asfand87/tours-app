const express = require("express");
const app = express();
const { AppError } = require("../utils/appError");


const handleTokenExpired = () => new AppError("Your Token has expired! , please log in again!", 401);


const handleJwtError = () => {
  return new AppError("Invalid Token. Please login again!", 401);
}

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path} : ${err.value}`
  return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
  const message = `Duplicate Field "${err.keyValue.name}". Please use another value`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
  // Object.values will convert the Object values and convert them to an Array.
  const errors = Object.values(err.errors);
  let message = errors.map(el => ` ${el.properties.message}`).join(". ");
  message = `Invalid input data. ${message}`;
  return new AppError(message, 400);
}

// For Development Errors.

const sendErrorDev = async (err, req, res) => {
  // if the url starts with /API
  if (req.originalUrl.startsWith("/api")) {
    await res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Error for rendered Website
    return res.status(err.statusCode).render("../views/_error", {
      title: "Something Went wrong",
      msg: err.message,
    })
  }
};
// For Production Errors.

const sendErrorProd = (err, req, res) => {

  // API 
  if (req.originalUrl.startsWith("/api")) {

    //Operational, trusted error or the errors which we made : Send message to client 
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // programming or other unknown error or the errors which we don't know : don't want client to know what they are !
    } else {
      console.log("error is console is in errorController line number 65", err)
      // 1) Log Error 
      //  2) Send generic message
      return res.status(500).json({
        status: "error",
        message: "Some thing went wrong!",
      })
    }

  } else {
    // Rendered Website
    if (err.isOperational) {
      res.status(err.statusCode).render("../views/_error", {
        status: err.status,
        msg: err.message,
      });
      // programming or other unknown error or the errors which we don't know : don't want client to know what they are !
    } else {
      // 1) Log Error 
      console.error("ERROR ", err);
      //  2) Send generic message
      return res.status(err.statusCode).render("../views/_error", {
        title: "Something Went wrong",
        msg: "Please try again later",
      })
    }
  }

}

const env = app.get("env");
// Error middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (env === "development") {
    sendErrorDev(err, req, res);
  } else if (env === "production") {

    // so basically every err has name property which is hidden but it's there in error 
    let error = { ...err, name: err.name, message: err.message };
    // console.log(`this is err.message ${err.message}  and this is error.message ${error.message}`);
    // Following line says if there is an error and it's CastError then run handleCaseErrorDB function and then pass this error in to sendErrorProd function.
    // CastError Handler
    if (error.name === "CastError") error = handleCastErrorDB(error);
    // ErrorDuplicate Error Handler
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    // this Error handler is for validation errors thrown by mongoose
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    // if the token is tampered
    if (err.name === "JsonWebTokenError") error = handleJwtError();
    if (err.name === "TokenExpiredError") error = handleTokenExpired();
    sendErrorProd(error, req, res);
  }
};
