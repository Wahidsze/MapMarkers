import React, { useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MarkerImage } from '../types';

interface ImageListProps {
  images: MarkerImage[];
  onAddImage: () => void;
  onDeleteImage: (imageId: string) => void;
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

export const ImageList: React.FC<ImageListProps> = ({ images, onAddImage, onDeleteImage }) => {
  const [selectedImage, setSelectedImage] = useState<MarkerImage | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const handleDeletePress = (imageId: string) => {
    Alert.alert("Удалить изображение", "Вы уверены, что хотите удалить это изображение?",
      [
        {
          text: "Отмена",
          style: "cancel"
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => onDeleteImage(imageId)
        }
      ]
    );
  };

  const handleImagePress = (image: MarkerImage) => {
    setSelectedImage(image);
    setImageModalVisible(true);
  };

  const imageRender = ({ item }: { item: MarkerImage }) => (
    <TouchableOpacity 
      style={styles.imageItem}
      onPress={() => handleImagePress(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeletePress(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={onAddImage}>
        <Text style={styles.addButtonText}>Добавить изображение</Text>
      </TouchableOpacity>

      {images.length > 0 ? (
        <View style={styles.galleryContainer}>
          <Text style={styles.sectionTitle}>Галерея ({images.length})</Text>
          <FlatList
            data={images}
            renderItem={imageRender}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.gallery}
            showsVerticalScrollIndicator={false}
            style={styles.flatList}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Нет изображений</Text>
          <Text style={styles.emptySubtext}>Нажмите кнопку выше чтобы добавить фото</Text>
        </View>
      )}

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalBackground}
            onPress={() => setImageModalVisible(false)}
          >
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.fullSizeImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.closeImageButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Text style={styles.closeImageButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  galleryContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  flatList: {
    flex: 1,
  },
  gallery: {
    paddingBottom: 20,
  },
  imageItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSizeImage: {
    width: '100%',
    height: '80%',
  },
  closeImageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
