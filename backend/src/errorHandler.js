// Anything thrown from the service layer that needs a specific HTTP status
// should be a `new AppError(message, statusCode)` (see utils.js) rather than
// a plain Error whose message text this file has to recognize — matching on
// literal message strings was issue #19: reword one and the mapping breaks
// silently, with nothing louder than a generic 500 to notice.
export const errorHandler = (error, req, res, next) => {
  console.error(error.message);

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  res.status(500).json({
    error: 'Internal server error',
  });
};
