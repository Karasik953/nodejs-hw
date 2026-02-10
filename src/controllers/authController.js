// src/controllers/authController.js

import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { User } from "../models/user.js";
import { createSession, setSessionCookies } from "../services/auth.js";
import { Session } from "../models/session.js";
import jwt from "jsonwebtoken";
import handlebars from "handlebars";
import path from "node:path";
import fs from "node:fs/promises";
import { sendEmail } from "../utils/sendMail.js";

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createHttpError(400, "Email in use"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    const newSession = await createSession(newUser._id);
    setSessionCookies(res, newSession);

    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(createHttpError(401, "Invalid credentials"));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return next(createHttpError(401, "Invalid credentials"));
    }

    await Session.deleteOne({ userId: user._id });

    const newSession = await createSession(user._id);
    setSessionCookies(res, newSession);

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};


export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    res.clearCookie("sessionId");
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    const session = await Session.findOne({ _id: sessionId, refreshToken });
    if (!session) {
      return next(createHttpError(401, "Session not found"));
    }

    if (new Date() > new Date(session.refreshTokenValidUntil)) {
      return next(createHttpError(401, "Session token expired"));
    }

    await Session.deleteOne({ _id: session._id });

    const newSession = await createSession(session.userId);
    setSessionCookies(res, newSession);

    res.status(200).json({ message: "Session refreshed" });
  } catch (err) {
    next(err);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Якщо користувача нема — все одно 200 (згідно ТЗ)
    if (!user) {
      return res.status(200).json({ message: "Password reset email sent successfully" });
    }

    const resetToken = jwt.sign(
      { sub: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const link = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${encodeURIComponent(
      resetToken
    )}`;

    const templatePath = path.resolve("src/templates/reset-password-email.html");
    const templateSource = await fs.readFile(templatePath, "utf-8");
    const template = handlebars.compile(templateSource);

    const html = template({
      name: user.username || user.email,
      link,
    });

    try {
      await sendEmail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Reset your password",
        html,
      });
    } catch (err) {
      return next(
        createHttpError(500, "Failed to send the email, please try again later.")
      );
    }

    return res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (err) {
    next(err);
  }
};


export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(createHttpError(401, "Invalid or expired token"));
    }

    const user = await User.findOne({ _id: payload.sub, email: payload.email });
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne(
      { _id: user._id },
      { password: hashedPassword }
    );

    // (не вимагається ТЗ, але супер-логічно) — вийти з усіх сесій
    await Session.deleteMany({ userId: user._id });

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};
