// src/context/DraftContext.js

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import aiService from "../services/aiService";
import draftService from "../services/draftService";
import publishService from "../services/publishService";
import { useAuth } from "./AuthContext";

/**
 * Draft state structure
 */
const initialState = {
  drafts: [],
  currentDraft: null,
  recentDraft: null,
  stats: {
    totalDrafts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
  },
  isLoading: false,
  isProcessing: false,
  error: null,
  filter: "all",
};

/**
 * Action types
 */
const DRAFT_ACTIONS = {
  FETCH_DRAFTS_START: "FETCH_DRAFTS_START",
  FETCH_DRAFTS_SUCCESS: "FETCH_DRAFTS_SUCCESS",
  FETCH_DRAFTS_FAIL: "FETCH_DRAFTS_FAIL",

  SET_CURRENT_DRAFT: "SET_CURRENT_DRAFT",
  CLEAR_CURRENT_DRAFT: "CLEAR_CURRENT_DRAFT",

  CREATE_DRAFT_START: "CREATE_DRAFT_START",
  CREATE_DRAFT_SUCCESS: "CREATE_DRAFT_SUCCESS",
  CREATE_DRAFT_FAIL: "CREATE_DRAFT_FAIL",

  UPDATE_DRAFT_SUCCESS: "UPDATE_DRAFT_SUCCESS",
  DELETE_DRAFT_SUCCESS: "DELETE_DRAFT_SUCCESS",

  PROCESS_VOICE_START: "PROCESS_VOICE_START",
  PROCESS_VOICE_SUCCESS: "PROCESS_VOICE_SUCCESS",
  PROCESS_VOICE_FAIL: "PROCESS_VOICE_FAIL",

  SET_RECENT_DRAFT: "SET_RECENT_DRAFT",
  SET_STATS: "SET_STATS",
  SET_FILTER: "SET_FILTER",
  CLEAR_ERROR: "CLEAR_ERROR",

  UPLOAD_MEDIA_START: "UPLOAD_MEDIA_START",
  UPLOAD_MEDIA_SUCCESS: "UPLOAD_MEDIA_SUCCESS",
  UPLOAD_MEDIA_FAIL: "UPLOAD_MEDIA_FAIL",
};

/**
 * Draft reducer
 */
const draftReducer = (state, action) => {
  switch (action.type) {
    case DRAFT_ACTIONS.FETCH_DRAFTS_START:
      return { ...state, isLoading: true, error: null };

    case DRAFT_ACTIONS.FETCH_DRAFTS_SUCCESS:
      return {
        ...state,
        drafts: action.payload.drafts,
        isLoading: false,
        error: null,
      };

    case DRAFT_ACTIONS.FETCH_DRAFTS_FAIL:
      return { ...state, isLoading: false, error: action.payload.error };

    case DRAFT_ACTIONS.SET_CURRENT_DRAFT:
      return { ...state, currentDraft: action.payload.draft };

    case DRAFT_ACTIONS.CLEAR_CURRENT_DRAFT:
      return { ...state, currentDraft: null };

    case DRAFT_ACTIONS.CREATE_DRAFT_START:
      return { ...state, isLoading: true, error: null };

    case DRAFT_ACTIONS.CREATE_DRAFT_SUCCESS:
      return {
        ...state,
        drafts: [action.payload.draft, ...state.drafts],
        currentDraft: action.payload.draft,
        recentDraft: action.payload.draft,
        stats: { ...state.stats, totalDrafts: state.stats.totalDrafts + 1 },
        isLoading: false,
      };

    case DRAFT_ACTIONS.CREATE_DRAFT_FAIL:
      return { ...state, isLoading: false, error: action.payload.error };

    case DRAFT_ACTIONS.UPDATE_DRAFT_SUCCESS:
      return {
        ...state,
        drafts: state.drafts.map((d) =>
          d.id === action.payload.draft.id ? action.payload.draft : d,
        ),
        currentDraft:
          state.currentDraft?.id === action.payload.draft.id
            ? action.payload.draft
            : state.currentDraft,
      };

    case DRAFT_ACTIONS.DELETE_DRAFT_SUCCESS:
      return {
        ...state,
        drafts: state.drafts.filter((d) => d.id !== action.payload.draftId),
        currentDraft:
          state.currentDraft?.id === action.payload.draftId
            ? null
            : state.currentDraft,
        stats: {
          ...state.stats,
          totalDrafts: Math.max(0, state.stats.totalDrafts - 1),
        },
      };

    case DRAFT_ACTIONS.PROCESS_VOICE_START:
      return { ...state, isProcessing: true, error: null };

    case DRAFT_ACTIONS.PROCESS_VOICE_SUCCESS:
      return {
        ...state,
        isProcessing: false,
        currentDraft: action.payload.draft,
      };

    case DRAFT_ACTIONS.PROCESS_VOICE_FAIL:
      return { ...state, isProcessing: false, error: action.payload.error };

    case DRAFT_ACTIONS.SET_RECENT_DRAFT:
      return { ...state, recentDraft: action.payload.draft };

    case DRAFT_ACTIONS.SET_STATS:
      return { ...state, stats: action.payload.stats };

    case DRAFT_ACTIONS.SET_FILTER:
      return { ...state, filter: action.payload.filter };

    case DRAFT_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case DRAFT_ACTIONS.UPLOAD_MEDIA_START:
      return { ...state, isProcessing: true };

    case DRAFT_ACTIONS.UPLOAD_MEDIA_SUCCESS:
    case DRAFT_ACTIONS.UPLOAD_MEDIA_FAIL:
      return { ...state, isProcessing: false };

    default:
      return state;
  }
};

/**
 * Draft Context
 */
const DraftContext = createContext(null);

/**
 * Draft Provider Component
 */
export const DraftProvider = ({ children }) => {
  const [state, dispatch] = useReducer(draftReducer, initialState);
  const { isAuthenticated } = useAuth();

  /**
   * Fetch all drafts
   */
  const fetchDrafts = useCallback(async (filter = null) => {
    dispatch({ type: DRAFT_ACTIONS.FETCH_DRAFTS_START });
    try {
      const status = filter === "all" ? null : filter;
      const drafts = await draftService.getDrafts({ status });
      dispatch({
        type: DRAFT_ACTIONS.FETCH_DRAFTS_SUCCESS,
        payload: { drafts },
      });
      return drafts;
    } catch (error) {
      dispatch({
        type: DRAFT_ACTIONS.FETCH_DRAFTS_FAIL,
        payload: { error: error.message },
      });
      const cached = await draftService.getCachedDrafts();
      if (cached.length > 0) {
        dispatch({
          type: DRAFT_ACTIONS.FETCH_DRAFTS_SUCCESS,
          payload: { drafts: cached },
        });
      }
      return [];
    }
  }, []);

  /**
   * Fetch stats and recent draft on auth
   */
  useEffect(() => {
    if (isAuthenticated) {
      const loadInitialData = async () => {
        try {
          const stats = await draftService.getStats();
          dispatch({ type: DRAFT_ACTIONS.SET_STATS, payload: { stats } });

          const recentDraft = await draftService.getRecentDraft();
          if (recentDraft) {
            dispatch({
              type: DRAFT_ACTIONS.SET_RECENT_DRAFT,
              payload: { draft: recentDraft },
            });
          }
        } catch (error) {
          console.warn("Error loading initial draft data:", error);
        }
      };
      loadInitialData();
    }
  }, [isAuthenticated]);

  /**
   * Process voice recording (transcribe + refine + create draft)
   */
  const processVoiceRecording = useCallback(
    async (audioUri, tone = "Professional") => {
      dispatch({ type: DRAFT_ACTIONS.PROCESS_VOICE_START });
      try {
        const result = await aiService.processVoicePost(audioUri, { tone });
        const draft = await draftService.createDraft({
          rawTranscript: result.transcript,
          aiRefinedText: result.refinedText,
          tone,
          audioUri,
          audioDurationMs: result.durationMs,
        });
        dispatch({
          type: DRAFT_ACTIONS.PROCESS_VOICE_SUCCESS,
          payload: { draft },
        });
        dispatch({
          type: DRAFT_ACTIONS.CREATE_DRAFT_SUCCESS,
          payload: { draft },
        });
        return { success: true, draft };
      } catch (error) {
        dispatch({
          type: DRAFT_ACTIONS.PROCESS_VOICE_FAIL,
          payload: { error: error.message },
        });
        return { success: false, error: error.message };
      }
    },
    [],
  );

  /**
   * Update current draft text
   */
  const updateDraftText = useCallback(async (draftId, text) => {
    try {
      const updatedDraft = await draftService.updateDraft(draftId, {
        userEditedText: text,
      });
      dispatch({
        type: DRAFT_ACTIONS.UPDATE_DRAFT_SUCCESS,
        payload: { draft: updatedDraft },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Update draft tone and re-refine
   */
  const updateDraftTone = useCallback(
    async (draftId, newTone) => {
      try {
        const draft =
          state.drafts.find((d) => d.id === draftId) || state.currentDraft;
        if (!draft) throw new Error("Draft not found");

        const { refinedText } = await aiService.changeTone(
          draft.userEditedText || draft.aiRefinedText,
          newTone,
        );

        const updatedDraft = await draftService.updateDraft(draftId, {
          tone: newTone,
          aiRefinedText: refinedText,
          userEditedText: refinedText,
        });

        dispatch({
          type: DRAFT_ACTIONS.UPDATE_DRAFT_SUCCESS,
          payload: { draft: updatedDraft },
        });
        return { success: true, refinedText };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [state.drafts, state.currentDraft],
  );

  /**
   * Save draft
   */
  const saveDraft = useCallback(async (draftId, updates) => {
    try {
      const updatedDraft = await draftService.updateDraft(draftId, updates);
      dispatch({
        type: DRAFT_ACTIONS.UPDATE_DRAFT_SUCCESS,
        payload: { draft: updatedDraft },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Schedule draft
   */
  const scheduleDraft = useCallback(
    async (draftId, scheduledAt) => {
      try {
        const updatedDraft = await draftService.scheduleDraft(
          draftId,
          scheduledAt,
        );
        dispatch({
          type: DRAFT_ACTIONS.UPDATE_DRAFT_SUCCESS,
          payload: { draft: updatedDraft },
        });
        dispatch({
          type: DRAFT_ACTIONS.SET_STATS,
          payload: {
            stats: {
              ...state.stats,
              scheduledPosts: state.stats.scheduledPosts + 1,
            },
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [state.stats],
  );

  /**
   * Delete draft
   */
  const deleteDraft = useCallback(async (draftId) => {
    try {
      await draftService.deleteDraft(draftId);
      dispatch({
        type: DRAFT_ACTIONS.DELETE_DRAFT_SUCCESS,
        payload: { draftId },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Set current draft for editing
   */
  const setCurrentDraft = useCallback((draft) => {
    dispatch({ type: DRAFT_ACTIONS.SET_CURRENT_DRAFT, payload: { draft } });
  }, []);

  /**
   * Clear current draft
   */
  const clearCurrentDraft = useCallback(() => {
    dispatch({ type: DRAFT_ACTIONS.CLEAR_CURRENT_DRAFT });
  }, []);

  /**
   * Set filter
   */
  const setFilter = useCallback((filter) => {
    dispatch({ type: DRAFT_ACTIONS.SET_FILTER, payload: { filter } });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: DRAFT_ACTIONS.CLEAR_ERROR });
  }, []);

  /**
   * Get filtered drafts
   */
  const getFilteredDrafts = useCallback(() => {
    if (state.filter === "all") return state.drafts;
    return state.drafts.filter((d) => d.status === state.filter);
  }, [state.drafts, state.filter]);

  // ── FIX: uploadMedia defined BEFORE the value object so it's not undefined ──
  const uploadMedia = useCallback(async (uri, type, mimeType) => {
    dispatch({ type: DRAFT_ACTIONS.UPLOAD_MEDIA_START });
    try {
      const result = await publishService.uploadMedia(uri, type, mimeType);
      dispatch({ type: DRAFT_ACTIONS.UPLOAD_MEDIA_SUCCESS });
      return { assetUrn: result.assetUrn };
    } catch (error) {
      dispatch({ type: DRAFT_ACTIONS.UPLOAD_MEDIA_FAIL });
      throw error;
    }
  }, []);

  const value = {
    ...state,
    filteredDrafts: getFilteredDrafts(),
    fetchDrafts,
    processVoiceRecording,
    updateDraftText,
    updateDraftTone,
    saveDraft,
    scheduleDraft,
    deleteDraft,
    setCurrentDraft,
    clearCurrentDraft,
    setFilter,
    clearError,
    uploadMedia,
  };

  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
};

/**
 * Custom hook to use draft context
 */
export const useDrafts = () => {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error("useDrafts must be used within a DraftProvider");
  }
  return context;
};

export default DraftContext;
