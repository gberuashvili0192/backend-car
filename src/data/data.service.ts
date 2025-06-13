import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../models/brand.schema';
import { Category, CategoryDocument } from '../models/category.schema';
import { BrandsResponse, CategoriesResponse } from './types';

@Injectable()
export class DataService {
  constructor(
    @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async getBrands(): Promise<BrandsResponse> {
    const brands = await this.brandModel.find().exec();
    return {
      success: true,
      brands: brands.map((brand) => ({
        id: brand._id.toString(),
        name: brand.name,
        models: brand.models,
      })),
    };
  }

  async getCategories(role: string): Promise<CategoriesResponse> {
    const categories = await this.categoryModel.find({ role }).exec();
    return {
      success: true,
      categories: categories.map((category) => ({
        id: category._id.toString(),
        title: category.title,
        description: category.description,
      })),
    };
  }
}
