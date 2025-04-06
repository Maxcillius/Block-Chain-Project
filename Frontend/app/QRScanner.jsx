import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location"; // Import expo-location
import { useState, useEffect } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View,
  Alert,
  AppState,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

export default function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          setScannedData(null);
        }
      }
    );

    return () => {
      appStateListener.remove();
    };
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera permission</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }) => {
    if (data === scannedData) return; // Avoid duplicate scans
    setScannedData(data);
  };

  const uploadData = async () => {
    if (!scannedData) return;
    setIsUploading(true);

    try {
      await fetch("http://localhost:3000/api/storeData",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: scannedData,
          }),
        }
      ).then((response) => response.json()).then(async (data) => {
        if(!data.ok) {
          throw new Error(data.message)
        }
        await saveToHistory(data.data);
        Alert.alert("Success", "Entry added successfully!", [
          { text: "OK", onPress: () => (router.back()) },
        ])
      })
    } catch (error) {
      Alert.alert("Error", "Failed to add Entry!");
    } finally {
      setIsUploading(false);
    }
  };

  const saveToHistory = async (data) => {
    const timestamp = new Date().toLocaleString();
    let location = null;

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const currentLocation = await Location.getCurrentPositionAsync({});
        location = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
      } else {
        console.warn("Location permission not granted");
        throw new Error("Location permission not granted");
      }

      // Create a new entry with location
      const newEntry = { data, timestamp, location };

      // Save to AsyncStorage
      const history = await AsyncStorage.getItem("qrHistory");
      const historyArray = history ? JSON.parse(history) : [];
      historyArray.push(newEntry);
      await AsyncStorage.setItem("qrHistory", JSON.stringify(historyArray));
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      // TODO: Add logic to decode QR code from the selected image
      Alert.alert(
        "Feature not implemented",
        "Decoding QR from gallery is not yet implemented."
      );
    }
  };

  return (
    <View style={styles.container}>
      {!scannedData ? (
        <>
          <View style={styles.overlay}>
            <View style={styles.scannerFrame}>
              <CameraView
                style={styles.camera}
                onBarcodeScanned={handleBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              />
            </View>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImageFromGallery}
            >
              <Text style={styles.galleryButtonText}>Upload From Gallery</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Scanned QR Code:</Text>
          <Text style={styles.scannedData}>{scannedData}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={uploadData}
            disabled={isUploading}
          >
            <Text style={styles.actionButtonText}>
              {isUploading ? "Uploading..." : "Save Entry"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setScannedData(null)}
          >
            <Text style={styles.actionButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E", // Dark purple background
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#6A0572", // Purple button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  scannerFrame: {
    width: Dimensions.get("window").width * 0.8,
    height: Dimensions.get("window").width * 0.8,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  galleryButton: {
    backgroundColor: "#6A0572", // Purple button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
  },
  galleryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  resultContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  resultText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  scannedData: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: "#6A0572", // Purple button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
