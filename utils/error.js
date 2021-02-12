/**
 * Formats the error with a status code and a message.
 * @param {number} status The status code for the response.
 * @param {string} version The message for the error.
 * @returns {Object} An error.
 */
const formatError = (status, message) => {
  const err = new Error(message)
  err.status = status
  return err
}

module.exports = {
  formatError
}
