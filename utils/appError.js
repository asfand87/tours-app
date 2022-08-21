class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    // this is referring to Error. so Error.status = whatever code.
    this.statusCode = statusCode;
    // Error.status = 404 or whatever.
    // status can only be fail or error
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //here we are adding isOperational property to Error.
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
