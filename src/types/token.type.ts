export type Payload = {
  id: string;
  name: string;
  email: string;
  rolesWithPermissions?: {
    id: string;
    name: string;
    slug: string;
    permissions: {
      resource: string;
      action: string;
    }[];
  }[];
};
