import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private defaultImages: string[] = [
    'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1983&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549399542-7e8f2e928464?q=80&w=1974&auto=format&fit=crop',
  ];

  constructor(private configService: ConfigService) {}

  async saveBase64Image(): Promise<string> {
    // Temporarily return a random default image instead of saving
    return this.getDefaultImage();
  }

  async saveMultipleBase64Images(base64Strings: string[]): Promise<string[]> {
    // Return as many default images as requested
    return this.getDefaultImages(base64Strings.length);
  }

  getDefaultImage(): string {
    // Return a random default image from the array
    const randomIndex = Math.floor(Math.random() * this.defaultImages.length);
    return this.defaultImages[randomIndex];
  }

  getDefaultImages(count: number): string[] {
    const result: string[] = [];

    // Return multiple random default images
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * this.defaultImages.length);
      result.push(this.defaultImages[randomIndex]);
    }

    return result;
  }
}
