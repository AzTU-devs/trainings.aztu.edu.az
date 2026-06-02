export type Category = {
  id: string;
  parentId?: string | null;
  slug: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
  active: boolean;
};
