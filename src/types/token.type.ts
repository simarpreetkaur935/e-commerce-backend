export type Payload = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: {
      resource: string;
      action: string;
    }[];
};
