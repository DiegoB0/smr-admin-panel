import { Roles } from './authEnums';

export const isAuthenticated = state => Boolean(state.auth.isAuthenticated);

export const hasRole = (state, wantedRole) => {
  if (!state?.auth?.isAuthenticated) return false

  const allowed = Array.isArray(wantedRole) ? wantedRole : [wantedRole];

  const userRoles = state.auth.user?.roles ?? []
  return allowed.some(r => userRoles.includes(r))
};

export const hasPermission = (state, perm) => {
  if (!state?.auth?.isAuthenticated) return false;
  const userPerms = state.auth.user?.permissions ?? [];
  return userPerms.includes(perm)
};


export function canAccessResource(
  state,
  resourceType,         
  action,              
  resourceUserId = null 
) {
  if (!state?.auth?.isAuthenticated) return false

  const userRoles = state.auth.user?.roles ?? []
  if (userRoles.includes(Roles.ADMIN)) return true

  const perm = `${action}-${resourceType}`       

  const userPerms = state.auth.user?.permissions ?? []
  const hasPerm  = userPerms.includes(perm)

  if ((action === 'edit' || action === 'delete') && resourceUserId) {
    return hasPerm && state.auth.user.id === resourceUserId
  }

  return hasPerm
}

