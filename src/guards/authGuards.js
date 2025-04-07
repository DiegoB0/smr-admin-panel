import { Roles, Permissions } from './authEnums';

export const hasRole = (roles, state) => {
  // If roles is a single string, convert it into an array for consistency
  if (!Array.isArray(roles)) {
    roles = [roles];
  }

  return state.auth.isAuthenticated && roles.some(role => state.auth.user?.roles.includes(role));
};

export const hasPermission = (permission, state) => {
  return state.auth.isAuthenticated && state.auth.user?.permissions.includes(permission);
};

export const isAuthenticated = (state) => {

  return state.auth.isAuthenticated;

};

// General resource access (user or post) with ownership
export const canAccessResource = (resourceType, action, resourceUserId, state) => {
  if (!state.auth.isAuthenticated) return false;
  const userId = state.auth.user?.id;

  // Admin can do anything

  if (hasRole(Roles.ADMIN, state)) return true;


  // Map resource type and action to permission
  const permissionMap = {
    post: {
      create: Permissions.CREATE_POST,
      read: Permissions.READ_POST,
      edit: Permissions.EDIT_POST,
      delete: Permissions.DELETE_POST,
    },
    user: {
      create: Permissions.CREATE_USER,
      read: Permissions.READ_USER,
      edit: Permissions.EDIT_USER,
      delete: Permissions.DELETE_USER,
    },
  };


  const permission = permissionMap[resourceType]?.[action];
  if (!permission) return false;

  // For create/read, just need permission (no ownership check)
  if (action === 'create' || action === 'read') {

    return hasPermission(permission, state);
  }

  // For edit/delete, need permission + ownership (unless admin)
  return hasPermission(permission, state) && resourceUserId === userId;
};

// Specific helpers for convenience
export const canAccessPost = (postUserId, action, state) => {
  return canAccessResource('post', action, postUserId, state);
};

export const canAccessUser = (userId, action, state) => {

  return canAccessResource('user', action, userId, state);
};
