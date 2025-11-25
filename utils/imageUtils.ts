import * as ImagePicker from 'expo-image-picker';

/**
 * Request camera and media library permissions
 */
export const requestImagePermissions = async (): Promise<boolean> => {
  try {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

/**
 * Open image picker (camera or gallery) and get base64
 */
export const pickImage = async (
  source: 'camera' | 'gallery' = 'gallery'
): Promise<string | null> => {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      throw new Error('Camera and media library permissions are required');
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3, // Lower quality = smaller base64 size (good for Firestore)
      base64: true, // Get base64 directly!
    };

    let result;
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Return the URI (we'll convert to base64 when uploading)
      return result.assets[0].uri;
    }

    return null;
  } catch (error: any) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Upload pet image - converts URI to base64 for Firestore storage
 * Returns base64 string to save in Firestore
 */
export const uploadPetImage = async (
  petId: string,
  imageUri: string
): Promise<string> => {
  try {
    console.log('Processing image for pet:', petId);
    console.log('Image URI:', imageUri);

    // Re-pick the image with base64 option to get base64 data
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.3,
      base64: true,
    };

    // If it's a local file URI, we need to read it
    // For now, we'll use fetch to convert to blob then base64
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Convert blob to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result); // This already includes data:image/jpeg;base64,
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    console.log('Image converted to base64, size:', base64.length, 'chars');
    console.log('Image ready for Firestore storage');

    return base64;
  } catch (error: any) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image: ' + error.message);
  }
};

/**
 * Delete pet image - no action needed for Firestore
 */
export const deletePetImage = async (imageUrl: string): Promise<void> => {
  try {
    // Images stored in Firestore don't need separate deletion
    console.log('Image will be removed from Firestore document');
  } catch (error: any) {
    console.error('Error deleting image:', error);
  }
};

/**
 * Show image source picker (camera or gallery)
 */
export const showImageSourcePicker = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) {
      return null;
    }

    return await pickImage('gallery');
  } catch (error: any) {
    console.error('Error showing image picker:', error);
    return null;
  }
};
