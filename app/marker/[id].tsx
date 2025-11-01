import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ImageList } from "../../components/ImageList";
import { MarkerList } from '../../markerList';
import { MARKER_COLORS, MarkerImage } from "../../types";

export default function MarkerDetails() {
  const { id, latitude, longitude, title, description, color } = useLocalSearchParams();
  const router = useRouter();

  const [images, setImages] = useState<MarkerImage[]>(MarkerList.getImages(id as string));
  const [loading, setLoading] = useState(false);

  const handleAddImage = async () => {
    try {
      setLoading(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Ошибка доступа", "Необходимо разрешение на доступ к галерее.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets[0]) {
        const newImage: MarkerImage = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          markerId: id as string,
          createdAt: new Date(),
        };

        const newImages = [...images, newImage];
        setImages(newImages);

        MarkerList.setImages([...MarkerList.getImages().filter(img => img.markerId !== id), ...newImages]);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось выбрать изображение.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    const newImages = images.filter(img => img.id !== imageId);
    setImages(newImages);
    MarkerList.setImages(newImages);
  };

  const handleDeleteMarker = () => {
    Alert.alert(
      "Удалить маркер",
      "Вы уверены, что хотите удалить этот маркер?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            MarkerList.deleteMarker(id as string);
            router.back();
          },
        },
      ]
    );
  };

  if (!latitude || !longitude) {
    return (
      <View style={styles.container}>
        <Text>Маркер не найден</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title || `Маркер ${id}`}</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteMarker}>
          <Text style={styles.deleteButtonText}>Удалить</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.markerInfo}>
          <Text style={styles.coordinates}>
            Широта: {Number(latitude).toFixed(6)}
            {'\n'}
            Долгота: {Number(longitude).toFixed(6)}
          </Text>

          {description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionTitle}>Описание</Text>
              <Text style={styles.descriptionBody}>{description}</Text>
            </View>
          ) : (
            <View style={styles.noDescriptionBox}>
              <Text style={styles.noDescriptionText}>Описание отсутствует</Text>
            </View>
          )}

          <View style={styles.colorInfo}>
            <Text>Цвет маркера: </Text>
            <View
              style={[
                styles.colorPreview,
                { backgroundColor: (color as string) || MARKER_COLORS.RED },
              ]}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Загрузка изображения...</Text>
          </View>
        ) : (
          <ImageList
            images={images}
            onAddImage={handleAddImage}
            onDeleteImage={handleDeleteImage}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  markerInfo: {
    marginBottom: 20,
  },
  coordinates: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    lineHeight: 22,
  },
  descriptionBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  descriptionBody: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  noDescriptionBox: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 16,
  },
  noDescriptionText: {
    fontSize: 15,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  colorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});
