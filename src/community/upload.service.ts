import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private uploadDir: string;
  private defaultImages: string[] = [
    'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1974&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1983&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549399542-7e8f2e928464?q=80&w=1974&auto=format&fit=crop',
  ];

  constructor(private configService: ConfigService) {
    // Create upload directory if it doesn't exist
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || 'uploads';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveBase64Image(base64String: string): Promise<string> {
    // Check if the string is a valid base64 image
    if (!base64String.startsWith('data:image/')) {
      throw new Error('Invalid base64 image string');
    }

    // Extract the file type and data
    const matches = base64String.match(
      /^data:image\/([a-zA-Z0-9]+);base64,(.+)$/,
    );
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format');
    }

    const fileExt = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    // Generate a unique filename
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Save the file
    await fs.promises.writeFile(filePath, buffer);

    // Return the URL path to the file
    return `/uploads/${fileName}`;
  }

  async saveMultipleBase64Images(base64Strings: string[]): Promise<string[]> {
    const imageUrls: string[] = [];

    for (const base64String of base64Strings) {
      try {
        const imageUrl = await this.saveBase64Image(base64String);
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }

    return imageUrls;
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
