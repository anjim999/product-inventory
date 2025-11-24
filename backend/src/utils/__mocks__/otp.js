module.exports = {
  generateOtp: () => "1234",
  getExpiry: () => new Date(Date.now() + 10 * 60 * 1000).toISOString()
};
