const jwt = require("jsonwebtoken");

const getJwtExpiry = () => process.env.JWT_EXPIRE || "7d";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: getJwtExpiry() }
  );
};

module.exports = generateToken;
