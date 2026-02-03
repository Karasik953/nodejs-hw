// src/controllers/notesController.js
import { Note } from "../models/note.js";
import createHttpError from "http-errors";

export const getAllNotes = async (req, res) => {
  const { search, tag, page = 1, perPage = 10 } = req.query;

  const pageNum = Number(page);
  const perPageNum = Number(perPage);
  const skip = (pageNum - 1) * perPageNum;

  // ✅ тепер базовий фільтр — тільки нотатки поточного користувача
  const filter = { userId: req.user._id };

  if (tag) {
    filter.tag = tag;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const notesQuery = Note.find(filter);

  const [totalItems, notes] = await Promise.all([
    notesQuery.clone().countDocuments(),
    notesQuery.skip(skip).limit(perPageNum),
  ]);

  const totalPages = Math.ceil(totalItems / perPageNum);

  res.status(200).json({
    page: pageNum,
    perPage: perPageNum,
    totalNotes: totalItems,
    totalPages,
    notes,
  });
};

export const getNoteById = async (req, res, next) => {
  const { noteId } = req.params;

  // ✅ шукаємо нотатку, яка належить поточному користувачу
  const note = await Note.findOne({ _id: noteId, userId: req.user._id });

  if (!note) {
    next(createHttpError(404, "Note not found"));
    return;
  }

  res.status(200).json(note);
};

export const createNote = async (req, res) => {
  // ✅ при створенні додаємо userId
  const note = await Note.create({
    ...req.body,
    userId: req.user._id,
  });

  res.status(201).json(note);
};

export const deleteNote = async (req, res, next) => {
  const { noteId } = req.params;

  // ✅ видаляємо тільки свою нотатку
  const note = await Note.findOneAndDelete({
    _id: noteId,
    userId: req.user._id,
  });

  if (!note) {
    next(createHttpError(404, "Note not found"));
    return;
  }

  // ✅ за умовою: 404 якщо нема, інакше можна 204 або 200.
  // Я лишаю твій стиль: 200 з видаленою нотаткою.
  res.status(200).json(note);
};

export const updateNote = async (req, res, next) => {
  const { noteId } = req.params;

  // ✅ оновлюємо тільки свою нотатку
  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId: req.user._id },
    req.body,
    { new: true }
  );

  if (!note) {
    next(createHttpError(404, "Note not found"));
    return;
  }

  res.status(200).json(note);
};
