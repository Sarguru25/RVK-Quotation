export const PERMISSIONS = {
  QUOTATION: {
    CREATE: "quotation.create",
    VIEW: "quotation.view",
    EDIT: "quotation.edit",
    DELETE: "quotation.delete",
    APPROVE: "quotation.approve",
    SEND: "quotation.send",
    CONVERT_SO: "quotation.convert_so",
    VIEW_ALL: "quotation.view_all", // view quotes not owned by user/team
  },
  CUSTOMER: {
    CREATE: "customer.create",
    VIEW: "customer.view",
    EDIT: "customer.edit",
    DELETE: "customer.delete",
  },
  USER: {
    CREATE: "user.create",
    VIEW: "user.view",
    EDIT: "user.edit",
    DELETE: "user.delete",
  },
  PRODUCT: {
    CREATE: "product.create",
    VIEW: "product.view",
    EDIT: "product.edit",
    DELETE: "product.delete",
  },
  SYSTEM: {
    MANAGE_SETTINGS: "settings.manage",
    VIEW_REPORTS: "reports.view",
    VIEW_ANALYTICS: "analytics.view",
  },
  ROLE: {
    MANAGE: "role.manage"
  }
};

// Default roles and their typical permissions (for seeding or reference)
export const DEFAULT_ROLES = {
  ADMIN: {
    name: "Admin",
    permissions: Object.values(PERMISSIONS).flatMap(module => Object.values(module))
  },
  MANAGER: {
    name: "Manager",
    permissions: [
      PERMISSIONS.QUOTATION.CREATE, PERMISSIONS.QUOTATION.VIEW, PERMISSIONS.QUOTATION.EDIT, PERMISSIONS.QUOTATION.DELETE, PERMISSIONS.QUOTATION.APPROVE, PERMISSIONS.QUOTATION.SEND, PERMISSIONS.QUOTATION.CONVERT_SO,
      PERMISSIONS.CUSTOMER.CREATE, PERMISSIONS.CUSTOMER.VIEW, PERMISSIONS.CUSTOMER.EDIT,
      PERMISSIONS.PRODUCT.VIEW,
      PERMISSIONS.SYSTEM.VIEW_REPORTS
    ]
  },
  EXECUTIVE: {
    name: "Executive",
    permissions: [
      PERMISSIONS.QUOTATION.CREATE, PERMISSIONS.QUOTATION.VIEW, PERMISSIONS.QUOTATION.EDIT, PERMISSIONS.QUOTATION.SEND,
      PERMISSIONS.CUSTOMER.VIEW, PERMISSIONS.CUSTOMER.CREATE,
      PERMISSIONS.PRODUCT.VIEW
    ]
  },
  VIEWER: {
    name: "Viewer",
    permissions: [
      PERMISSIONS.QUOTATION.VIEW,
      PERMISSIONS.CUSTOMER.VIEW,
      PERMISSIONS.PRODUCT.VIEW
    ]
  }
};

export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions) return false;
  // Admin wildcard or exact match
  return userPermissions.includes("*") || userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions, requiredPermissionsArray) => {
  if (!userPermissions) return false;
  if (userPermissions.includes("*")) return true;
  return requiredPermissionsArray.some(p => userPermissions.includes(p));
};
