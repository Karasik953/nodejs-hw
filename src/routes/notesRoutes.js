import { Router } from "express";
import { celebrate } from "celebrate";
import { authenticate } from "../middleware/authenticate.js";
import {
  getAllNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
} from "../controllers/notesController.js";

import {
  createNoteSchema,
  getAllNotesSchema,
  noteIdSchema,
  updateNoteSchema,
} from "../validations/notesValidation.js";



const router = Router();

// ✅ усі роуті нотаток захищені middleware authenticate
router.get("/notes", authenticate, celebrate(getAllNotesSchema), getAllNotes);
router.get(
  "/notes/:noteId",
  authenticate,
  celebrate(noteIdSchema),
  getNoteById
);
router.post(
  "/notes",
  authenticate,
  celebrate(createNoteSchema),
  createNote
);
router.delete(
  "/notes/:noteId",
  authenticate,
  celebrate(noteIdSchema),
  deleteNote
);
router.patch(
  "/notes/:noteId",
  authenticate,
  celebrate(updateNoteSchema),
  updateNote
);

export default router;
