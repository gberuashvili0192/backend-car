export interface BrandsResponse {
  success: boolean;
  brands: Array<{
    id: string;
    name: string;
    models: Array<{
      id: string;
      name: string;
      years: { from: string; to: string };
    }>;
  }>;
}

export interface CategoriesResponse {
  success: boolean;
  categories: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}
