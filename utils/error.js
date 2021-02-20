/**
 * Formats the error with a status code and a message.
 * @param {number} status The status code for the response.
 * @param {string} message The message for the error.
 * @returns {Object} An error.
 * @function
 */
const formatError = (status, message) => {
  const err = new Error(message)
  // @ts-ignore
  err.status = status
  return err
}

module.exports = {
  formatError
}
