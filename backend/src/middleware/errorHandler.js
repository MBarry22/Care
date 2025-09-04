const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal server error',
    statusCode: 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      success: false,
      message: `Validation Error: ${message}`,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      statusCode: 401
    };
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') { // Duplicate entry
    error = {
      success: false,
      message: 'Resource already exists',
      statusCode: 409
    };
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') { // Foreign key violation
    error = {
      success: false,
      message: 'Referenced resource not found',
      statusCode: 400
    };
  }

  if (err.code === 'ER_BAD_NULL_ERROR') { // Not null violation
    error = {
      success: false,
      message: 'Required field missing',
      statusCode: 400
    };
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') { // Access denied
    error = {
      success: false,
      message: 'Database access denied',
      statusCode: 500
    };
  }

  if (err.code === 'ER_BAD_DB_ERROR') { // Database doesn't exist
    error = {
      success: false,
      message: 'Database not found',
      statusCode: 500
    };
  }

  // Custom error
  if (err.statusCode) {
    error.statusCode = err.statusCode;
    error.message = err.message;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.statusCode === 500) {
    error.message = 'Internal server error';
  }

  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
