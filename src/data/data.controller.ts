import { Controller, Get, Query } from '@nestjs/common';
import { DataService } from './data.service';
import { BrandsResponse, CategoriesResponse } from './types';

@Controller('api/data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('brands')
  async getBrands(): Promise<BrandsResponse> {
    return this.dataService.getBrands();
  }

  @Get('categories')
  async getCategories(
    @Query('role') role: string,
  ): Promise<CategoriesResponse> {
    return this.dataService.getCategories(role);
  }
}
