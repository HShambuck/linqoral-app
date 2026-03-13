// src/context/AuthContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isOnboardingComplete: false,
  error: null,
};

const AUTH_ACTIONS = {
  RESTORE_SESSION_START: 'RESTORE_SESSION_START',
  RESTORE_SESSION_SUCCESS: 'RESTORE_SESSION_SUCCESS',
  RESTORE_SESSION_FAIL: 'RESTORE_SESSION_FAIL',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ONBOARDING_COMPLETE: 'SET_ONBOARDING_COMPLETE',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.RESTORE_SESSION_START:
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };

    case AUTH_ACTIONS.RESTORE_SESSION_SUCCESS:
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
        isOnboardingComplete: action.payload.isOnboardingComplete ?? state.isOnboardingComplete,
        error: null,
      };

    case AUTH_ACTIONS.RESTORE_SESSION_FAIL:
      return { ...state, user: null, isLoading: false, isAuthenticated: false, error: null };

    case AUTH_ACTIONS.LOGIN_FAIL:
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState, isLoading: false };

    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: action.payload.user };

    case AUTH_ACTIONS.SET_ONBOARDING_COMPLETE:
      return { ...state, isOnboardingComplete: true };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const restoreSession = async () => {
      dispatch({ type: AUTH_ACTIONS.RESTORE_SESSION_START });
      try {
        const user = await authService.restoreSession();
        const isOnboardingComplete = await authService.isOnboardingComplete();
        if (user) {
          dispatch({
            type: AUTH_ACTIONS.RESTORE_SESSION_SUCCESS,
            payload: { user, isOnboardingComplete },
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.RESTORE_SESSION_FAIL });
        }
      } catch (error) {
        console.warn('Session restore failed:', error);
        dispatch({ type: AUTH_ACTIONS.RESTORE_SESSION_FAIL });
      }
    };
    restoreSession();
  }, []);

  const register = async ({ displayName, preferredTone }) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const { user } = await authService.register({ displayName, preferredTone });
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, isOnboardingComplete: false },
      });
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAIL, payload: { error: error.message } });
      return { success: false, error: error.message };
    }
  };

  const loginAnonymous = async () => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const { user } = await authService.loginAnonymous();
      const isOnboardingComplete = await authService.isOnboardingComplete();
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, isOnboardingComplete },
      });
      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAIL, payload: { error: error.message } });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await authService.logout();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: { user: updatedUser } });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const completeOnboarding = async () => {
    await authService.completeOnboarding();
    dispatch({ type: AUTH_ACTIONS.SET_ONBOARDING_COMPLETE });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  /**
   * Refresh user from server — call after LinkedIn OAuth or any external change
   */
  const refreshUser = async () => {
    try {
      const user = await authService.restoreSession();
      if (user) {
        dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: { user } });
      }
    } catch (error) {
      console.warn('Failed to refresh user:', error);
    }
  };

  const value = {
    ...state,
    register,
    loginAnonymous,
    logout,
    updateProfile,
    completeOnboarding,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;