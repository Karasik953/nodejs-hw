// src/middlewares/authenticate.js

import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    // 1. перевіряємо наявність accessToken у cookies
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return next(createHttpError(401, 'Missing access token'));
    }

    // 2. шукаємо сесію за accessToken
    const session = await Session.findOne({ accessToken });

    if (!session) {
      return next(createHttpError(401, 'Session not found'));
    }

    // 3. перевіряємо строк дії accessToken
    if (new Date() > new Date(session.accessTokenValidUntil)) {
      return next(createHttpError(401, 'Access token expired'));
    }

    // 4. шукаємо користувача, повʼязаного з сесією
    const user = await User.findById(session.userId);

    if (!user) {
      return next(createHttpError(401));
    }

    // 5. додаємо користувача в req і пускаємо далі
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
