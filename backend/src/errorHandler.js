export const errorHandler = (error, req, res, next) => {
  console.error(error.message);

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  if (error.message === 'Email already registered') {
    return res.status(400).json({
      error: error.message,
    });
  }

  if (error.message === 'Invalid email or password') {
    return res.status(401).json({
      error: error.message,
    });
  }

  res.status(500).json({
    error: 'Internal server error',
  });
};
