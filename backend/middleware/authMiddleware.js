const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-parola');
      // Token valid, dar contul nu mai există (ex. cont șters) → 401, nu lăsa
      // controllerul să acceseze req.user null și să dea 500.
      if (!req.user) {
        return res.status(401).json({ mesaj: 'Utilizatorul nu mai există' });
      }
      next();
    } else {
      res.status(401).json({ mesaj: 'Nu esti autorizat' });
    }
  } catch (error) {
    res.status(401).json({ mesaj: 'Token invalid' });
  }
};

module.exports = { protect };