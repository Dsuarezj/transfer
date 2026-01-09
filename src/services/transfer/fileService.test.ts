import { describe, it, expect } from 'vitest';
import { fileService } from './fileService';

describe('fileService', () => {
  describe('validateImageFile', () => {
    it('accepts valid image files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = fileService.validateImageFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts PNG images', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      const result = fileService.validateImageFile(file);
      expect(result.isValid).toBe(true);
    });

    it('rejects non-image files', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const result = fileService.validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('El archivo debe ser una imagen');
    });

    it('rejects files without MIME type', () => {
      const file = new File([''], 'test.txt', { type: '' });
      const result = fileService.validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('El archivo debe ser una imagen');
    });

    it('accepts image/webp files', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' });
      const result = fileService.validateImageFile(file);
      expect(result.isValid).toBe(true);
    });
  });

  describe('fileToBlob', () => {
    it('converts File to Blob', async () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const blob = await fileService.fileToBlob(file);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });

    it('preserves file content', async () => {
      const content = 'test image content';
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      const blob = await fileService.fileToBlob(file);
      const text = await blob.text();
      expect(text).toBe(content);
    });
  });
});

