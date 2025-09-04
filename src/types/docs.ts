export interface DocItem {
  name: string;
  description: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  authors: string[];
  reviewers: string[];
  editors: string[];
  tags: string[];
  children: DocItem[];
}
