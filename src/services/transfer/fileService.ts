interface ValidationResult {
  isValid: boolean;
  error?: string;
}

function validateImageFile(file: File): ValidationResult {
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'El archivo debe ser una imagen',
    };
  }

  return { isValid: true };
}

async function fileToBlob(file: File): Promise<Blob> {
  return new Blob([await file.arrayBuffer()], { type: file.type });
}

export const fileService = {
  validateImageFile,
  fileToBlob,
};

