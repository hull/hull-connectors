import Hull from '../hull';

const errorHandler = (err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  if (err) {
    const data = {
      status: err.status,
      method: req.method,
      headers: req.headers,
      url: req.url,
      params: req.params,
    };
    Hull.logger.error(
      'Error ----------------',
      err.message,
      err.status,
      data,
      err.stack
    );
    return res.status(err.status || 500).send({ message: err.message });
  }
  return res.status(err.status || 500).send({ message: 'undefined error' });
};

export default errorHandler;
