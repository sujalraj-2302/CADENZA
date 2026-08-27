// Central error handler - never leak raw DB/server errors to the client.
function errorHandler(err, req, res, next) {
  console.error('[error]', err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `${field} already in use.` });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  res.status(err.status || 500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = errorHandler;
