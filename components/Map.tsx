import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Marker as MapMarker } from "react-native-maps";
import { MarkerList } from "../markerList";
import { Marker, MARKER_COLORS, MarkerColor, MarkerNavigationParams } from "../types";

const Map = () => {
  const router = useRouter();

  const [region, setRegion] = useState({
    latitude: 58.007124,
    longitude: 56.188173,
    latitudeDelta: 0.009,
    longitudeDelta: 0.009,
  });

  const [markers, setMarkers] = useState<Marker[]>(MarkerList.getMarkers());
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [colorModalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<MarkerColor>(MARKER_COLORS.RED);
  const [markerTitle, setMarkerTitle] = useState("");
  const [markerDescription, setMarkerDescription] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const handleMapReady = () => {
    setIsMapReady(true);
    setMapError(null);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isMapReady) {
        setMapError("Карта не загрузилась. Проверьте подключение к интернету.");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isMapReady]);

  const handleLongPress = (event: any) => {
    try {
      if (!isMapReady) {
        Alert.alert("Ошибка", "Карта еще не загрузилась. Подождите.");
        return;
      }

      const { coordinate } = event.nativeEvent;
      setSelectedCoordinate(coordinate);
      setMarkerTitle(`Маркер ${markers.length + 1}`);
      setMarkerDescription("");
      setSelectedColor(MARKER_COLORS.RED);
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось выбрать координаты для маркера.");
      console.error(error);
    }
  };

  const handleColorSelect = (color: MarkerColor) => setSelectedColor(color);

  const handleCreateMarker = () => {
    if (!markerTitle.trim()) {
      Alert.alert("Ошибка", "Название маркера не может быть пустым");
      return;
    }

    if (!selectedCoordinate) {
      Alert.alert("Ошибка", "Не удалось определить координаты маркера");
      return;
    }

    try {
      const newMarker: Marker = {
        id: Date.now().toString(),
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        title: markerTitle,
        description: markerDescription,
        color: selectedColor,
      };

      const updatedMarkers = [...markers, newMarker];
      setMarkers(updatedMarkers);
      MarkerList.setMarkers(updatedMarkers);

      setModalVisible(false);
      setSelectedCoordinate(null);
      setMarkerTitle("");
      setMarkerDescription("");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось сохранить маркер.");
      console.error(error);
    }
  };

  const handleMarkerPress = (marker: Marker) => {
    try {
      const params: MarkerNavigationParams = {
        id: marker.id,
        latitude: marker.latitude.toString(),
        longitude: marker.longitude.toString(),
        title: marker.title,
        description: marker.description || "",
        color: marker.color || MARKER_COLORS.RED,
      };
      router.push({
        pathname: "/marker/[id]" as const,
        params: params,
      });
    } catch (error) {
      Alert.alert("Ошибка навигации", "Не удалось открыть детали маркера.");
      console.error(error);
    }
  };

  const handleRetryMap = () => {
    setMapError(null);
    setIsMapReady(false);
    setRegion(prev => ({ ...prev }));
  };

  useFocusEffect(
    useCallback(() => {
      try {
        setMarkers(MarkerList.getMarkers());
      } catch (error) {
        console.error("Ошибка обновления маркеров:", error);
      }
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      {mapError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{mapError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetryMap}
          >
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isMapReady && !mapError && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка карты...</Text>
        </View>
      )}

      <MapView
        style={{ flex: 1, opacity: isMapReady ? 1 : 0.5 }}
        region={region}
        onRegionChangeComplete={setRegion}
        onLongPress={handleLongPress}
        onMapReady={handleMapReady}
        onLayout={handleMapReady}
        onPanDrag={() => {
          if (!isMapReady) setIsMapReady(true);
        }}
      >
        {markers.map((marker) => (
          <MapMarker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            pinColor={MarkerList.getMarkerColor(marker.color)}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>

      <Modal visible={colorModalVisible}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.markerCreator}>
              <Text style={styles.markerCreatorTitle}>Создать маркер</Text>

              <ScrollView style={styles.creatorScrollView}>
                <Text style={styles.inputLabel}>Название маркера:</Text>
                <TextInput
                  style={styles.textInput}
                  value={markerTitle}
                  onChangeText={setMarkerTitle}
                  placeholder="Введите название маркера"
                />

                <Text style={styles.inputLabel}>Описание маркера:</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={markerDescription}
                  onChangeText={setMarkerDescription}
                  placeholder="Введите описание (необязательно)"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <Text style={styles.inputLabel}>Цвет маркера:</Text>
                <View style={styles.colorButtons}>
                  {Object.values(MARKER_COLORS).map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorButton,
                      ]}
                      onPress={() => handleColorSelect(color)}
                    />
                  ))}
                </View>
              </ScrollView>

              <View style={styles.creatorButtons}>
                <TouchableOpacity
                  style={[styles.creatorButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.creatorButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.creatorButton, styles.createButton]}
                  onPress={handleCreateMarker}
                >
                  <Text style={styles.creatorButtonText}>Создать</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  markerCreator: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  markerCreatorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  creatorScrollView: { maxHeight: 400 },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  colorButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  selectedColorButton: {
    borderColor: "#1C1C1E",
    borderWidth: 3,
  },
  creatorButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  creatorButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#8E8E93" },
  createButton: { backgroundColor: "#007AFF" },
  creatorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,59,48,0.9)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 1000,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,122,255,0.9)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Map;