import { useSelector } from 'react-redux';
import { Roles } from '../guards/authEnums';
import { hasRole, canAccessResource } from '../guards/authGuards';

export function useAuthFlags() {
  // Posts
  const canCreatePost = useSelector(s => canAccessResource(s, 'post', 'create'))
  const canReadPosts = useSelector(s => canAccessResource(s, 'post', 'read'));
  const canDeletePost = useSelector(s => canAccessResource(s, 'post', 'delete'))
  // const canDeleteOwnPost = userSelector(s => canAccessResource(s, 'user', 'delete'))
  const canEditPost = useSelector(s => canAccessResource(s, 'post', 'read'));

  // Users
  const canCreateUsers = useSelector(s => canAccessResource(s, 'user', 'create'))
  const canReadUsers = useSelector(s => canAccessResource(s, 'user', 'read'));
  const canDeleteUsers = useSelector(s => canAccessResource(s, 'user', 'delete'))
  const canEditUsers = useSelector(s => canAccessResource(s, 'user', 'edit'))

  // Check roles
  const isBlogger = useSelector(s => hasRole(s, Roles.BLOGGER));
  const isOperador = useSelector(s => hasRole(s, Roles.OPERADOR));
  const isAdmin = useSelector(s => hasRole(s, Roles.ADMIN));
  const isAdminWeb = useSelector(s => hasRole(s, Roles.ADMIN_WEB))
  const isAdminAlmacen = useSelector(s => hasRole(s, Roles.ADMIN_ALMACEN))

  return {
    canCreatePost,
    canReadPosts,
    canDeletePost,
    canEditPost,
    canCreateUsers,
    canReadUsers,
    canDeleteUsers,
    canEditUsers,
    isAdmin,
    isAdminWeb,
    isAdminAlmacen,
    isBlogger,
    isOperador
  }
}
