import {
  useCallback, useEffect, useRef, useState
} from 'react';
import { Notification } from '../../ui';
import {
  createSessionNote,
  deleteSessionNote,
  getSessionMetadata,
  listSessionNotes,
  normalizeSessionTags,
  replaceSessionNote,
  setSessionBookmark
} from '../../services/BehaviorLensService';

export const REVIEW_METADATA_NOTIFICATION_ID = 'behaviorlens-review-metadata-notification';
export const MAX_SESSION_NOTE_LENGTH = 5000;

const emptyMetadata = () => ({ tags: [], bookmarked: false });

export const getSessionReviewErrorMessage = (error, fallback) => {
  const response = error?.response || error;
  return response?.data?.content?.error
    || response?.data?.message
    || error?.message
    || fallback;
};

export const getSessionReviewErrorStatus = error => {
  const response = error?.response || error;
  return Number(response?.data?.responseCode || response?.status || 0);
};

export const prepareSessionNoteText = (text, tags = []) => {
  if (typeof text !== 'string') {
    return { error: 'Note text must be a string.', text: '' };
  }
  if (text.includes('\0')) {
    return { error: 'Note text must not contain U+0000.', text };
  }

  const trimmedText = text.trim();
  if (!trimmedText && normalizeSessionTags(tags).length === 0) {
    return { error: 'Enter a note or select at least one tag before saving.', text: trimmedText };
  }
  if (Array.from(trimmedText).length > MAX_SESSION_NOTE_LENGTH) {
    return {
      error: `Notes can contain at most ${MAX_SESSION_NOTE_LENGTH} characters.`,
      text: trimmedText
    };
  }

  return { error: '', text: trimmedText };
};

export const formatSessionNoteDate = timestamp => {
  if (typeof timestamp !== 'string') {
    return '';
  }
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const isSessionNoteOwner = (note, currentUsername) => (
  typeof currentUsername === 'string'
  && currentUsername.length > 0
  && note?.created_by === currentUsername
);

const sortSessionNotes = notes => [...notes].sort((left, right) => {
  const byCreatedAt = String(right?.created_at || '').localeCompare(String(left?.created_at || ''));
  return byCreatedAt || String(right?.id || '').localeCompare(String(left?.id || ''));
});

export const collectSessionNoteTags = notes => normalizeSessionTags(
  (Array.isArray(notes) ? notes : []).flatMap(note => (
    Array.isArray(note?.tags) ? note.tags : []
  ))
);

const showNotification = (description, colorStyle) => Notification.show({
  description,
  colorStyle,
  containerId: REVIEW_METADATA_NOTIFICATION_ID
});

const useReviewRequestRefs = () => ({
  metadataRequestRef: useRef(0),
  notesRequestRef: useRef(0),
  bookmarkRequestRef: useRef(0),
  createRequestRef: useRef(0),
  editRequestRef: useRef(0),
  deleteRequestRef: useRef(0),
  bookmarkPendingRef: useRef(false),
  creatingRef: useRef(false),
  updatingRef: useRef(false),
  deletingRef: useRef(false)
});

const useSessionReviewMetadata = ({ currentUsername, sessionId }) => {
  const [metadata, setMetadata] = useState(emptyMetadata);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState('');
  const [metadataActionError, setMetadataActionError] = useState('');
  const [bookmarkPending, setBookmarkPending] = useState(false);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState('');
  const [updatingNoteId, setUpdatingNoteId] = useState(null);
  const [notePendingDelete, setNotePendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  const {
    metadataRequestRef,
    notesRequestRef,
    bookmarkRequestRef,
    createRequestRef,
    editRequestRef,
    deleteRequestRef,
    bookmarkPendingRef,
    creatingRef,
    updatingRef,
    deletingRef
  } = useReviewRequestRefs();

  const loadMetadata = useCallback(async () => {
    const requestId = metadataRequestRef.current + 1;
    metadataRequestRef.current = requestId;
    setMetadataLoading(true);
    setMetadataError('');

    try {
      const response = await getSessionMetadata(sessionId);
      if (metadataRequestRef.current !== requestId) {
        return;
      }
      const tags = normalizeSessionTags(response?.tags);
      setMetadata({
        tags,
        bookmarked: response?.bookmarked === true
      });
    } catch (error) {
      if (metadataRequestRef.current === requestId) {
        setMetadataError(getSessionReviewErrorMessage(
          error,
          'Session labels could not be loaded.'
        ));
      }
    } finally {
      if (metadataRequestRef.current === requestId) {
        setMetadataLoading(false);
      }
    }
  }, [sessionId]);

  const loadNotes = useCallback(async () => {
    const requestId = notesRequestRef.current + 1;
    notesRequestRef.current = requestId;
    setNotesLoading(true);
    setNotesError('');

    try {
      const response = await listSessionNotes(sessionId);
      if (notesRequestRef.current !== requestId) {
        return;
      }
      setNotes(sortSessionNotes(Array.isArray(response) ? response : []));
    } catch (error) {
      if (notesRequestRef.current === requestId) {
        setNotesError(getSessionReviewErrorMessage(error, 'Session notes could not be loaded.'));
      }
    } finally {
      if (notesRequestRef.current === requestId) {
        setNotesLoading(false);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    setMetadata(emptyMetadata());
    setMetadataError('');
    setMetadataActionError('');
    setNotes([]);
    setNotesError('');
    setNewNoteText('');
    setCreateError('');
    setEditingNoteId(null);
    setEditText('');
    setEditError('');
    setNotePendingDelete(null);
    setDeleteError('');
    bookmarkPendingRef.current = false;
    creatingRef.current = false;
    updatingRef.current = false;
    deletingRef.current = false;
    setBookmarkPending(false);
    setCreating(false);
    setUpdatingNoteId(null);
    setDeletingNoteId(null);
    loadMetadata();
    loadNotes();

    return () => {
      metadataRequestRef.current += 1;
      notesRequestRef.current += 1;
      bookmarkRequestRef.current += 1;
      createRequestRef.current += 1;
      editRequestRef.current += 1;
      deleteRequestRef.current += 1;
    };
  }, [loadMetadata, loadNotes, sessionId]);

  const toggleBookmark = useCallback(async () => {
    if (bookmarkPendingRef.current || metadataLoading || metadataError) {
      return;
    }

    const requestId = bookmarkRequestRef.current + 1;
    bookmarkRequestRef.current = requestId;
    bookmarkPendingRef.current = true;
    const previousBookmarked = metadata.bookmarked;
    const desiredBookmarked = !previousBookmarked;
    setMetadata(previous => ({ ...previous, bookmarked: desiredBookmarked }));
    setMetadataActionError('');
    setBookmarkPending(true);

    try {
      const response = await setSessionBookmark(sessionId, desiredBookmarked);
      if (bookmarkRequestRef.current === requestId) {
        setMetadata(previous => ({
          ...previous,
          bookmarked: response?.bookmarked === true
        }));
      }
    } catch (error) {
      if (bookmarkRequestRef.current === requestId) {
        const message = getSessionReviewErrorMessage(error, 'The bookmark could not be updated.');
        setMetadata(previous => ({ ...previous, bookmarked: previousBookmarked }));
        setMetadataActionError(message);
        showNotification(message, 'error');
      }
    } finally {
      if (bookmarkRequestRef.current === requestId) {
        bookmarkPendingRef.current = false;
        setBookmarkPending(false);
      }
    }
  }, [metadata.bookmarked, metadataError, metadataLoading, sessionId]);

  // Creates note text, moment tags, and replay offset in one request.
  const createNote = useCallback(async (event, moment = {}) => {
    event?.preventDefault();
    if (creatingRef.current || notesLoading || notesError) {
      return false;
    }

    const tags = normalizeSessionTags(moment.tags);
    const offsetMs = Number(moment.offsetMs);
    const prepared = prepareSessionNoteText(newNoteText, tags);
    if (prepared.error) {
      setCreateError(prepared.error);
      return false;
    }
    if (!Number.isFinite(offsetMs) || offsetMs < 0) {
      setCreateError('The current replay time is unavailable.');
      return false;
    }

    const requestId = createRequestRef.current + 1;
    createRequestRef.current = requestId;
    creatingRef.current = true;
    setCreating(true);
    setCreateError('');

    try {
      const createdNote = await createSessionNote(sessionId, {
        offsetMs,
        tags,
        text: prepared.text
      });
      if (createRequestRef.current !== requestId) {
        return;
      }
      if (!createdNote || typeof createdNote !== 'object') {
        throw new Error('The created note response was invalid.');
      }
      const nextNotes = sortSessionNotes([...notes, createdNote]);
      setNotes(nextNotes);
      setMetadata(previous => ({ ...previous, tags: collectSessionNoteTags(nextNotes) }));
      setNewNoteText('');
      showNotification('Note added.', 'success');
      return true;
    } catch (error) {
      if (createRequestRef.current === requestId) {
        setCreateError(getSessionReviewErrorMessage(error, 'The note could not be added.'));
      }
    } finally {
      if (createRequestRef.current === requestId) {
        creatingRef.current = false;
        setCreating(false);
      }
    }
    return false;
  }, [newNoteText, notes, notesError, notesLoading, sessionId]);

  const startEditingNote = useCallback(note => {
    if (!isSessionNoteOwner(note, currentUsername) || updatingRef.current) {
      return;
    }
    setEditingNoteId(note.id);
    setEditText(note.text);
    setEditError('');
  }, [currentUsername]);

  const cancelEditingNote = useCallback(() => {
    if (updatingRef.current) {
      return;
    }
    setEditingNoteId(null);
    setEditText('');
    setEditError('');
  }, []);

  const saveEditedNote = useCallback(async event => {
    event?.preventDefault();
    if (updatingRef.current || editingNoteId === null) {
      return;
    }

    const note = notes.find(item => item.id === editingNoteId);
    if (!isSessionNoteOwner(note, currentUsername)) {
      setEditError('Only the note creator may modify this note.');
      return;
    }
    const prepared = prepareSessionNoteText(editText, note.tags);
    if (prepared.error) {
      setEditError(prepared.error);
      return;
    }

    const requestId = editRequestRef.current + 1;
    editRequestRef.current = requestId;
    updatingRef.current = true;
    setUpdatingNoteId(editingNoteId);
    setEditError('');

    try {
      const updatedNote = await replaceSessionNote(sessionId, editingNoteId, prepared.text);
      if (editRequestRef.current !== requestId) {
        return;
      }
      setNotes(previous => previous.map(item => (
        item.id === editingNoteId ? updatedNote : item
      )));
      setEditingNoteId(null);
      setEditText('');
      showNotification('Note updated.', 'success');
    } catch (error) {
      if (editRequestRef.current !== requestId) {
        return;
      }
      const message = getSessionReviewErrorMessage(error, 'The note could not be updated.');
      if (getSessionReviewErrorStatus(error) === 404) {
        const nextNotes = notes.filter(item => item.id !== editingNoteId);
        setNotes(nextNotes);
        setMetadata(previous => ({ ...previous, tags: collectSessionNoteTags(nextNotes) }));
        setEditingNoteId(null);
        setEditText('');
        showNotification(message, 'error');
      } else {
        setEditError(message);
      }
    } finally {
      if (editRequestRef.current === requestId) {
        updatingRef.current = false;
        setUpdatingNoteId(null);
      }
    }
  }, [currentUsername, editText, editingNoteId, notes, sessionId]);

  const openDeleteNote = useCallback(note => {
    if (!isSessionNoteOwner(note, currentUsername) || deletingRef.current) {
      return;
    }
    setNotePendingDelete(note);
    setDeleteError('');
  }, [currentUsername]);

  const closeDeleteNote = useCallback(() => {
    if (deletingRef.current) {
      return;
    }
    setNotePendingDelete(null);
    setDeleteError('');
  }, []);

  const confirmDeleteNote = useCallback(async () => {
    if (!notePendingDelete || deletingRef.current) {
      return;
    }

    const noteId = notePendingDelete.id;
    const requestId = deleteRequestRef.current + 1;
    deleteRequestRef.current = requestId;
    deletingRef.current = true;
    setDeletingNoteId(noteId);
    setDeleteError('');

    try {
      await deleteSessionNote(sessionId, noteId);
      if (deleteRequestRef.current !== requestId) {
        return;
      }
      const nextNotes = notes.filter(note => note.id !== noteId);
      setNotes(nextNotes);
      setMetadata(previous => ({ ...previous, tags: collectSessionNoteTags(nextNotes) }));
      setNotePendingDelete(null);
      showNotification('Note deleted.', 'success');
    } catch (error) {
      if (deleteRequestRef.current !== requestId) {
        return;
      }
      const message = getSessionReviewErrorMessage(error, 'The note could not be deleted.');
      if (getSessionReviewErrorStatus(error) === 404) {
        const nextNotes = notes.filter(note => note.id !== noteId);
        setNotes(nextNotes);
        setMetadata(previous => ({ ...previous, tags: collectSessionNoteTags(nextNotes) }));
        setNotePendingDelete(null);
        showNotification(message, 'error');
      } else {
        setDeleteError(message);
      }
    } finally {
      if (deleteRequestRef.current === requestId) {
        deletingRef.current = false;
        setDeletingNoteId(null);
      }
    }
  }, [notePendingDelete, notes, sessionId]);

  return {
    bookmarkPending,
    cancelEditingNote,
    closeDeleteNote,
    confirmDeleteNote,
    createError,
    createNote,
    creating,
    deleteError,
    deletingNoteId,
    editError,
    editingNoteId,
    editText,
    loadMetadata,
    loadNotes,
    metadata,
    metadataActionError,
    metadataError,
    metadataLoading,
    newNoteText,
    notePendingDelete,
    notes,
    notesError,
    notesLoading,
    openDeleteNote,
    saveEditedNote,
    setCreateError,
    setEditError,
    setEditText,
    setNewNoteText,
    startEditingNote,
    toggleBookmark,
    updatingNoteId
  };
};

export default useSessionReviewMetadata;
