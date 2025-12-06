import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Marker as MapMarker } from "react-native-maps";
import { useDB } from "../contexts/DatabaseContext";
import { useLocationTracker } from '../hooks/useLocationTracker';
import { isWithinNotificationRadius } from '../services/location';
import { NotificationManager } from '../services/notifications';
import { Marker, MARKER_COLORS, MarkerColor, MarkerNavigationParams } from "../types";

const notificationManager = new NotificationManager();

const Map = () => {
  const router = useRouter();
  const { addMarker, getMarkers, getMarkerColor, isInitialized } = useDB();
  
  const { userLocation, locationError } = useLocationTracker();

  const [region, setRegion] = useState({
    latitude: 58.007124,
    longitude: 56.188173,
    latitudeDelta: 0.009,
    longitudeDelta: 0.009,
  });

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [colorModalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState<MarkerColor>(MARKER_COLORS.RED);
  const [markerTitle, setMarkerTitle] = useState("");
  const [markerDescription, setMarkerDescription] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const markersLoadedRef = useRef(false);

  const handleMapReady = () => {
    setIsMapReady(true);
  };

  const loadMarkers = useCallback(async () => {
    try {
      if (markersLoadedRef.current) return;
      
      console.log('Загрузка маркеров...');
      const markersFromDb = await getMarkers();
      setMarkers(markersFromDb);
      markersLoadedRef.current = true;
    } catch (error) {
      console.error("Ошибка загрузки маркеров:", error);
    }
  }, [getMarkers]);

  useEffect(() => {
    if (isInitialized && !markersLoadedRef.current) {
      loadMarkers();
    }
  }, [isInitialized, loadMarkers]);

  useFocusEffect(
    useCallback(() => {
      if (isInitialized) {
        markersLoadedRef.current = false;
        loadMarkers();
      }
    }, [isInitialized, loadMarkers])
  );

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

  const handleCreateMarker = async () => {
    if (!markerTitle.trim()) {
      Alert.alert("Ошибка", "Название маркера не может быть пустым");
      return;
    }

    if (!selectedCoordinate) {
      Alert.alert("Ошибка", "Не удалось определить координаты маркера");
      return;
    }

    try {
      setIsLoading(true);

      const newMarker: Omit<Marker, 'id'> = {
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        title: markerTitle,
        description: markerDescription,
        color: selectedColor,
      };

      await addMarker(newMarker);
      
      markersLoadedRef.current = false;
      await loadMarkers();

      setModalVisible(false);
      setSelectedCoordinate(null);
      setMarkerTitle("");
      setMarkerDescription("");
    } catch (error) {
      console.error("Ошибка создания маркера:", error);
      Alert.alert("Ошибка", "Не удалось сохранить маркер в базу данных.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerPress = (marker: Marker) => {
    try {
      const params: MarkerNavigationParams = {
        id: marker.id.toString(),
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

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const markerId = data?.markerId;

      if (markerId) {
        const marker = markers.find(m => m.id === markerId);

        if (marker) {
          const params = {
            id: marker.id.toString(),
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
        }
      }
    });

    return () => {
      responseListener.remove();
    };
  }, [router, markers]);

  const checkProximity = useCallback((location: Location.LocationObject) => {
    console.log('Проверка расстояния до маркеров');
    
    const currentlyCloseMarkers = new Set<number>();
    
    markers.forEach(marker => {
      const isNear = isWithinNotificationRadius(
        location.coords.latitude,
        location.coords.longitude,
        marker.latitude,
        marker.longitude
      );
      
      if (isNear) {
        currentlyCloseMarkers.add(marker.id);
        console.log(`Пользователь находится рядом с маркером: ${marker.title}`);
        notificationManager.showNotification(marker);
      }
    });
    
    notificationManager.clearOldMarkers(currentlyCloseMarkers);
  }, [markers]);

  useEffect(() => {
    if (userLocation && markers.length > 0) {
      checkProximity(userLocation);
    }
  }, [userLocation, markers, checkProximity]);

  const centerOnUser = () => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      Alert.alert("Ошибка", "Местоположение пользователя не определено");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.locationControls}>       
        {locationError && (
          <Text style={styles.locationError}>{locationError}</Text>
        )}
        
        {userLocation && (
          <Text style={styles.locationInfo}>
            Текущее местоположение: {userLocation.coords.latitude.toFixed(5)}, {userLocation.coords.longitude.toFixed(5)}
          </Text>
        )}
        
        <Text style={styles.notificationInfo}>
          Показано уведомлений: {notificationManager.getShownCount()}
        </Text>
      </View>

      <MapView
        style={{ flex: 1, opacity: isMapReady ? 1 : 0.5 }}
        region={region}
        onRegionChangeComplete={setRegion}
        onLongPress={handleLongPress}
        onMapReady={handleMapReady}
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
            pinColor={getMarkerColor(marker.color)}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
        
        {userLocation && (
          <MapMarker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title="Вы здесь"
            image={require('../assets/person.png')}
          />
        )}
      </MapView>

      {userLocation && (
        <TouchableOpacity 
          style={styles.centerButton}
          onPress={centerOnUser}
        >
        <Text style={styles.centerButtonText}>📍</Text>
        </TouchableOpacity>
      )}

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
                  editable={!isLoading}
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
                  editable={!isLoading}
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
                      disabled={isLoading}
                    />
                  ))}
                </View>
              </ScrollView>

              <View style={styles.creatorButtons}>
                <TouchableOpacity
                  style={[styles.creatorButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.creatorButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.creatorButton, styles.createButton, isLoading && styles.disabledButton]}
                  onPress={handleCreateMarker}
                  disabled={isLoading}
                >
                  <Text style={styles.creatorButtonText}>
                    {isLoading ? "Создание..." : "Создать"}
                  </Text>
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
  disabledButton: {
    opacity: 0.6,
  },
  locationControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  locationError: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
  },
  locationInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  notificationInfo: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 5,
    fontWeight: 'bold',
  },
  centerButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  centerButtonText: {
    fontSize: 24,
  },
});

export default Map;