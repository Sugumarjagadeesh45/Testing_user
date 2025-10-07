import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  Switch,
  Modal,
  TextInput,
  PermissionsAndroid,
  Platform,
  Image
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import socket from '../../socket';
import haversine from 'haversine-distance';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../../util/backendConfig';

// Import your custom icons
import BikeIcon from '../../../assets001/bike.svg';
import LorryIcon from '../../../assets001/lorry.svg';
import TaxiIcon from '../../../assets001/taxi.svg'; // Added taxi icon
import PersonIcon from '../../../assets001/person.svg';

interface LocationType {
  latitude: number;
  longitude: number;
}

interface SuggestionType {
  id: string;
  name: string;
  address: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface DriverType {
  driverId: string;
  name: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  vehicleType: string;
  status?: string;
  driverMobile?: string;
}

interface TaxiContentProps {
  loadingLocation?: boolean;
  currentLocation: LocationType | null;
  lastSavedLocation: LocationType | null;
  pickup: string;
  dropoff: string;
  handlePickupChange: (text: string) => void;
  handleDropoffChange: (text: string) => void;
}

const TaxiContent: React.FC<TaxiContentProps> = ({
  loadingLocation: propLoadingLocation,
  currentLocation: propCurrentLocation,
  lastSavedLocation: propLastSavedLocation,
  pickup,
  dropoff,
  handlePickupChange: propHandlePickupChange,
  handleDropoffChange: propHandleDropoffChange,
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedRideType, setSelectedRideType] = useState<string>('taxi');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [wantReturn, setWantReturn] = useState(false);
  const [distance, setDistance] = useState<string>('');
  const [travelTime, setTravelTime] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingOTP, setBookingOTP] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationType | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationType | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationType | null>(null);
  const [routeCoords, setRouteCoords] = useState<LocationType[]>([]);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<"idle" | "searching" | "onTheWay" | "arrived" | "started" | "completed">("idle");
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<LocationType | null>(null);
  const [travelledKm, setTravelledKm] = useState(0);
  const [lastCoord, setLastCoord] = useState<LocationType | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<DriverType[]>([]);
  const [nearbyDriversCount, setNearbyDriversCount] = useState<number>(0);
  
  const [pickupSuggestions, setPickupSuggestions] = useState<SuggestionType[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<SuggestionType[]>([]);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  
  const [pickupLoading, setPickupLoading] = useState(false);
  const [dropoffLoading, setDropoffLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [pickupCache, setPickupCache] = useState<Record<string, SuggestionType[]>>({});
  const [dropoffCache, setDropoffCache] = useState<Record<string, SuggestionType[]>>({});
  
  const [isPickupCurrent, setIsPickupCurrent] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [driverArrivedAlertShown, setDriverArrivedAlertShown] = useState(false);
  const [rideCompletedAlertShown, setRideCompletedAlertShown] = useState(false);
  const [acceptedDriver, setAcceptedDriver] = useState<DriverType | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  
  const [driverName, setDriverName] = useState<string | null>(null);
  const [driverMobile, setDriverMobile] = useState<string | null>(null);
  const [bookedAt, setBookedAt] = useState<Date | null>(null);
  
  const pickupDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dropoffDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const driverArrivalCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const panelAnimation = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView | null>(null);

  const fallbackLocation: LocationType = {
    latitude: 11.3312971,
    longitude: 77.7167303,
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log(`📍 Distance calculation: (${lat1},${lon1}) to (${lat2},${lon2}) = ${distance.toFixed(4)} km`);
    
    return distance;
  };

  const calculateDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    return distanceKm * 1000;
  };

  const fetchNearbyDrivers = (latitude: number, longitude: number) => {
    console.log(`Fetching nearby drivers for lat: ${latitude}, lng: ${longitude}`);
    if (socket && socketConnected) {
      socket.emit("requestNearbyDrivers", { 
        latitude, 
        longitude, 
        radius: 10000,
        vehicleType: selectedRideType 
      });
      console.log("Emitted requestNearbyDrivers event");
    } else {
      console.log("Socket not connected, attempting to reconnect...");
      socket.connect();
      socket.once("connect", () => {
        console.log("Socket reconnected, emitting requestNearbyDrivers");
        socket.emit("requestNearbyDrivers", { 
          latitude, 
          longitude, 
          radius: 10000,
          vehicleType: selectedRideType 
        });
      });
    }
  };

  useEffect(() => {
    const handleNearbyDriversResponse = (data: { drivers: DriverType[] }) => {
      console.log('📍 Received nearby drivers response:', JSON.stringify(data, null, 2));
      if (!location) {
        console.log("❌ No location available, can't process drivers");
        return;
      }
      
      console.log('📍 User current location:', location);
      console.log('📍 Number of drivers received:', data.drivers.length);
      
      // ACTIVE RIDE: Show only accepted driver
      if (currentRideId && acceptedDriver) {
        console.log('🚗 Active ride - Showing only accepted driver');
        const acceptedDriverData = data.drivers.find(d => d.driverId === acceptedDriver.driverId);
        if (acceptedDriverData) {
          setNearbyDrivers([acceptedDriverData]);
          setNearbyDriversCount(1);
          console.log('✅ Accepted driver found and displayed');
        } else {
          setNearbyDrivers([]);
          setNearbyDriversCount(0);
          console.log('❌ Accepted driver not found in response');
        }
        return;
      }
      
      // NO ACTIVE RIDE: Show only drivers of selected vehicle type
      const filteredDrivers = data.drivers
        .filter(driver => {
          console.log(`🔍 Processing driver: ${driver.driverId} (${driver.name})`);
          console.log(`📍 Driver location: ${driver.location.coordinates[1]}, ${driver.location.coordinates[0]}`);
          console.log(`🚗 Driver vehicle type: ${driver.vehicleType}, Selected: ${selectedRideType}`);
          
          // Filter by vehicle type
          if (driver.vehicleType !== selectedRideType) {
            console.log(`❌ Driver ${driver.driverId} filtered out by vehicle type: ${driver.vehicleType}`);
            return false;
          }
          
          // Check driver status
          if (driver.status && !["Live", "online", "onRide", "available"].includes(driver.status)) {
            console.log(`❌ Driver ${driver.driverId} filtered out by status: ${driver.status}`);
            return false;
          }
          
          // Calculate distance
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            driver.location.coordinates[1],
            driver.location.coordinates[0]
          );
          console.log(`📏 Driver ${driver.driverId} distance: ${distance.toFixed(2)} km`);
          
          const isWithinRange = distance <= 10;
          console.log(`✅ Driver ${driver.driverId} within 10km: ${isWithinRange}`);
          
          return isWithinRange;
        })
        .sort((a, b) => {
          const distA = calculateDistance(location.latitude, location.longitude, a.location.coordinates[1], a.location.coordinates[0]);
          const distB = calculateDistance(location.latitude, location.longitude, b.location.coordinates[1], b.location.coordinates[0]);
          return distA - distB;
        })
        .slice(0, 10);
      
      console.log('✅ Filtered drivers count:', filteredDrivers.length);
      console.log('📍 Final drivers to display:', filteredDrivers);
      
      setNearbyDrivers(filteredDrivers);
      setNearbyDriversCount(filteredDrivers.length);
    };

    socket.on("nearbyDriversResponse", handleNearbyDriversResponse);
    return () => socket.off("nearbyDriversResponse", handleNearbyDriversResponse);
  }, [location, socketConnected, currentRideId, acceptedDriver, selectedRideType]);

  useEffect(() => {
    const requestLocation = async () => {
      setIsLoadingLocation(true);

      if (propCurrentLocation) {
        console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Using current location from props:`, propCurrentLocation);
        setLocation(propCurrentLocation);
        global.currentLocation = propCurrentLocation;
        fetchNearbyDrivers(propCurrentLocation.latitude, propCurrentLocation.longitude);
        setIsLoadingLocation(false);
        return;
      }

      if (propLastSavedLocation) {
        console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Using last saved location from props:`, propLastSavedLocation);
        setLocation(propLastSavedLocation);
        global.currentLocation = propLastSavedLocation;
        fetchNearbyDrivers(propLastSavedLocation.latitude, propLastSavedLocation.longitude);
        setIsLoadingLocation(false);
        return;
      }

      console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Using fallback location:`, fallbackLocation);
      setLocation(fallbackLocation);
      global.currentLocation = fallbackLocation;
      fetchNearbyDrivers(fallbackLocation.latitude, fallbackLocation.longitude);
      setIsLoadingLocation(false);

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Location permission denied`);
          Alert.alert("Permission Denied", "Location permission is required to proceed.");
          return;
        }
      }
      Geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Live location fetched successfully:`, loc);
          setLocation(loc);
          global.currentLocation = loc;
          fetchNearbyDrivers(loc.latitude, loc.longitude);
        },
        (err) => {
          console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Location error:`, err.code, err.message);
          Alert.alert("Location Error", "Could not fetch location. Please try again or check your GPS settings.");
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000, distanceFilter: 10 }
      );
    };
    requestLocation();
  }, [propCurrentLocation, propLastSavedLocation]);

  useEffect(() => {
    const handleConnect = async () => { 
      console.log("Socket connected"); 
      setSocketConnected(true); 
      if (location) fetchNearbyDrivers(location.latitude, location.longitude);
      
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          socket.emit('registerUser', { userId });
          console.log('👤 User registered with socket:', userId);
        }
      } catch (error) {
        console.error('Error registering user with socket:', error);
      }
    };
    
    const handleDisconnect = () => { console.log("Socket disconnected"); setSocketConnected(false); };
    const handleConnectError = (error: Error) => { console.error("Socket connection error:", error); setSocketConnected(false); };
    
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    setSocketConnected(socket.connected);
    
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [location]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (location && (rideStatus === "idle" || rideStatus === "searching")) {
        Geolocation.getCurrentPosition(
          (pos) => {
            const newLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setLocation(newLoc);
            if (isPickupCurrent && pickupLocation && dropoffLocation) {
              setPickupLocation(newLoc);
              fetchRoute(newLoc);
            }
            fetchNearbyDrivers(newLoc.latitude, newLoc.longitude);
          },
          (err) => { console.error("Live location error:", err); },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
        );
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [rideStatus, isPickupCurrent, dropoffLocation, location, socketConnected]);

  useEffect(() => {
    const handleDriverLiveLocationUpdate = (data: { driverId: string; lat: number; lng: number; status?: string }) => {
      console.log('📍 Received driver location update:', data);
      
      // If we have an active ride and this is the accepted driver
      if (currentRideId && acceptedDriver && data.driverId === acceptedDriver.driverId) {
        console.log('📍 Updating accepted driver location during active ride');
        
        // CRITICAL: Update driver location state
        const driverCoords = { latitude: data.lat, longitude: data.lng };
        setDriverLocation(driverCoords);
        
        // Update the driver in nearbyDrivers
        setNearbyDrivers(prev => {
          if (prev.length > 0 && prev[0].driverId === data.driverId) {
            return [{
              ...prev[0],
              location: { coordinates: [data.lng, data.lat] },
              status: data.status || "onTheWay"
            }];
          }
          return prev;
        });
        
        // Calculate distance if needed
        if (lastCoord) {
          const dist = haversine(lastCoord, driverCoords);
          setTravelledKm(prev => prev + dist / 1000);
        }
        setLastCoord(driverCoords);
        
        // Check if driver is near pickup location
        if (pickupLocation && rideStatus === "onTheWay") {
          const distanceToPickup = calculateDistanceInMeters(
            driverCoords.latitude, 
            driverCoords.longitude, 
            pickupLocation.latitude, 
            pickupLocation.longitude
          );
          
          console.log(`📍 Driver distance to pickup: ${distanceToPickup.toFixed(1)} meters`);
          
          if (distanceToPickup <= 50) {
            console.log('🚨 DRIVER ARRIVED ALERT TRIGGERED');
            setRideStatus("arrived");
            setDriverArrivedAlertShown(true);
            
            // Immediately update UI state
            setNearbyDrivers(prev => {
              if (prev.length > 0 && prev[0].driverId === data.driverId) {
                return [{
                  ...prev[0],
                  status: "arrived"
                }];
              }
              return prev;
            });
            
            // Get customer ID for OTP
            AsyncStorage.getItem('customerId').then(customerId => {
              const otp = customerId ? customerId.slice(-4) : '1234';
              Alert.alert(
                "🎉 Driver Arrived!",
                `Our driver (${acceptedDriver.name}) has reached your pickup location.\n\nPlease share your OTP: ${otp}`,
                [{ text: "OK", onPress: () => {
                  console.log('✅ User acknowledged driver arrival');
                }}]
              );
            });
          }
        }
        
        // Check if driver is near dropoff location
        if (dropoffLocation && rideStatus === "started") {
          const distanceToDropoff = calculateDistanceInMeters(
            driverCoords.latitude, 
            driverCoords.longitude, 
            dropoffLocation.latitude, 
            dropoffLocation.longitude
          );
          
          if (distanceToDropoff <= 50 && !rideCompletedAlertShown) {
            // Instead of immediately completing the ride, just notify the backend
            socket.emit('driverReachedDestination', {
              rideId: currentRideId,
              driverId: data.driverId,
              distance: travelledKm.toFixed(2)
            });
            
            // Set a flag to prevent multiple notifications
            setRideCompletedAlertShown(true);
          }
        }
        return; // Ignore other drivers during active ride
      }
      
      // If no active ride, update all drivers
      setNearbyDrivers((prev) => {
        const existingIndex = prev.findIndex(d => d.driverId === data.driverId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            location: { coordinates: [data.lng, data.lat] },
            status: data.status || "Live"
          };
          return updated;
        } else {
          if (data.status && !["Live", "online", "onRide", "available"].includes(data.status)) return prev;
          return [
            ...prev,
            {
              driverId: data.driverId,
              name: `Driver ${data.driverId}`,
              location: { coordinates: [data.lng, data.lat] },
              vehicleType: "taxi",
              status: data.status || "Live"
            }
          ];
        }
      });
    };
    
    socket.on("driverLiveLocationUpdate", handleDriverLiveLocationUpdate);
    return () => socket.off("driverLiveLocationUpdate", handleDriverLiveLocationUpdate);
  }, [location, currentRideId, acceptedDriver, lastCoord, pickupLocation, dropoffLocation, rideStatus, driverArrivedAlertShown, rideCompletedAlertShown]);

  useEffect(() => {
    if (driverArrivalCheckInterval.current) {
      clearInterval(driverArrivalCheckInterval.current);
    }

    if (rideStatus === "onTheWay" && driverLocation && pickupLocation && !driverArrivedAlertShown) {
      console.log('🔍 Starting driver arrival checker interval');
      
      driverArrivalCheckInterval.current = setInterval(() => {
        if (driverLocation && pickupLocation && rideStatus === "onTheWay" && !driverArrivedAlertShown) {
          const distanceToPickup = calculateDistanceInMeters(
            driverLocation.latitude,
            driverLocation.longitude,
            pickupLocation.latitude,
            pickupLocation.longitude
          );
          
          console.log(`🔍 Interval check - Driver distance to pickup: ${distanceToPickup.toFixed(1)} meters`);
          
          if (distanceToPickup <= 50) {
            console.log('🚨 DRIVER ARRIVED ALERT TRIGGERED FROM INTERVAL CHECKER');
            setRideStatus("arrived");
            setDriverArrivedAlertShown(true);
            
            if (driverArrivalCheckInterval.current) {
              clearInterval(driverArrivalCheckInterval.current);
              driverArrivalCheckInterval.current = null;
            }
            
            AsyncStorage.getItem('customerId').then(customerId => {
              const otp = customerId ? customerId.slice(-4) : '1234';
              Alert.alert(
                "🎉 Driver Arrived!",
                `Our driver (${acceptedDriver?.name || 'Driver'}) has reached your pickup location.\n\nPlease share your OTP: ${otp}`,
                [{ text: "OK", onPress: () => {
                  console.log('✅ User acknowledged driver arrival');
                }}]
              );
            });
          }
        }
      }, 2000);
    }

    return () => {
      if (driverArrivalCheckInterval.current) {
        clearInterval(driverArrivalCheckInterval.current);
        driverArrivalCheckInterval.current = null;
      }
    };
  }, [rideStatus, driverLocation, pickupLocation, driverArrivedAlertShown, acceptedDriver]);

  useEffect(() => {
    const handleRideCompleted = (data: any) => {
      console.log('🎉 Ride completed event received:', data);
      
      setRideStatus("completed");
      
      const finalDistance = data.distance || travelledKm.toFixed(2);
      const finalTime = data.travelTime || travelTime;
      const finalCharge = data.charge || estimatedPrice;
      
      Alert.alert(
        "Ride Completed",
        `Thank you for choosing EAZYGO!\n\nDistance: ${finalDistance} km\nTravel Time: ${finalTime}\nCharge: ₹${finalCharge}`,
        [
          { 
            text: "OK", 
            onPress: () => {
              setTimeout(() => {
                setCurrentRideId(null);
                setDriverId(null);
                setDriverLocation(null);
                setAcceptedDriver(null);
                setRouteCoords([]);
                setPickupLocation(null);
                setDropoffLocation(null);
                propHandlePickupChange("");
                propHandleDropoffChange("");
                setRideStatus("idle");
                setDriverArrivedAlertShown(false);
                setRideCompletedAlertShown(false);
                
                if (location) {
                  fetchNearbyDrivers(location.latitude, location.longitude);
                }
              }, 2000);
            }
          }
        ]
      );
      
      AsyncStorage.removeItem('currentRideId');
      AsyncStorage.removeItem('acceptedDriver');
      AsyncStorage.removeItem('bookedAt');
      setBookedAt(null);
    };
    
    socket.on("rideCompleted", handleRideCompleted);
    
    return () => {
      socket.off("rideCompleted", handleRideCompleted);
    };
  }, [travelledKm, travelTime, estimatedPrice, location]);

  useEffect(() => {
    const handleRideStatusUpdate = (data: any) => {
      console.log('📋 Ride status update received:', data);
      
      if (data.rideId === currentRideId) {
        if (data.status === 'completed') {
          setRideStatus("completed");
          
          const finalDistance = data.distance || travelledKm.toFixed(2);
          const finalTime = data.travelTime || travelTime;
          const finalCharge = data.charge || estimatedPrice;
          
          Alert.alert(
            "Ride Completed",
            `Thank you for choosing EAZYGO!\n\nDistance: ${finalDistance} km\nTravel Time: ${finalTime}\nCharge: ₹${finalCharge}`,
            [
              { 
                text: "OK", 
                onPress: () => {
                  setTimeout(() => {
                    setCurrentRideId(null);
                    setDriverId(null);
                    setDriverLocation(null);
                    setAcceptedDriver(null);
                    setRouteCoords([]);
                    setPickupLocation(null);
                    setDropoffLocation(null);
                    propHandlePickupChange("");
                    propHandleDropoffChange("");
                    setRideStatus("idle");
                    setDriverArrivedAlertShown(false);
                    setRideCompletedAlertShown(false);
                    
                    if (location) {
                      fetchNearbyDrivers(location.latitude, location.longitude);
                    }
                  }, 2000);
                }
              }
            ]
          );
          
          AsyncStorage.removeItem('currentRideId');
          AsyncStorage.removeItem('acceptedDriver');
          AsyncStorage.removeItem('bookedAt');
          setBookedAt(null);
        }
      }
    };
    
    socket.on("rideStatusUpdate", handleRideStatusUpdate);
    
    return () => {
      socket.off("rideStatusUpdate", handleRideStatusUpdate);
    };
  }, [currentRideId, travelledKm, travelTime, estimatedPrice, location]);

  useEffect(() => {
    const handleDriverOffline = (data: { driverId: string }) => {
      console.log(`Driver ${data.driverId} went offline`);
      
      if (currentRideId && acceptedDriver && data.driverId === acceptedDriver.driverId) {
        console.log('⚠️ Accepted driver went offline during active ride');
        return;
      }
      
      setNearbyDrivers(prev => prev.filter(driver => driver.driverId !== data.driverId));
      setNearbyDriversCount(prev => Math.max(0, prev - 1));
    };
    
    socket.on("driverOffline", handleDriverOffline);
    return () => socket.off("driverOffline", handleDriverOffline);
  }, [currentRideId, acceptedDriver]);

  useEffect(() => {
    const handleDriverStatusUpdate = (data: { driverId: string; status: string }) => {
      console.log(`Driver ${data.driverId} status updated to: ${data.status}`);
      
      if (currentRideId && acceptedDriver && data.driverId === acceptedDriver.driverId) {
        console.log('Keeping accepted driver status as onTheWay');
        return;
      }
      
      if (data.status === "offline") {
        setNearbyDrivers(prev => prev.filter(driver => driver.driverId !== data.driverId));
        setNearbyDriversCount(prev => Math.max(0, prev - 1));
        return;
      }
      setNearbyDrivers(prev => prev.map(driver => 
        driver.driverId === data.driverId ? { ...driver, status: data.status } : driver
      ));
    };
    
    socket.on("driverStatusUpdate", handleDriverStatusUpdate);
    return () => socket.off("driverStatusUpdate", handleDriverStatusUpdate);
  }, [currentRideId, acceptedDriver]);

  useEffect(() => {
    const recoverRideData = async () => {
      try {
        const savedRideId = await AsyncStorage.getItem('currentRideId');
        const savedDriverData = await AsyncStorage.getItem('acceptedDriver');
        
        if (savedRideId && !currentRideId) {
          console.log('🔄 Recovering ride data from storage:', savedRideId);
          setCurrentRideId(savedRideId);
          
          if (savedDriverData) {
            const driverData = JSON.parse(savedDriverData);
            setAcceptedDriver(driverData);
            setDriverName(driverData.name);
            setDriverMobile(driverData.driverMobile);
            setRideStatus("onTheWay");
          } else {
            setRideStatus("searching");
            const bookedStr = await AsyncStorage.getItem('bookedAt');
            setBookedAt(bookedStr ? new Date(bookedStr) : new Date());
            const pollInterval = setInterval(() => {
              if (currentRideId) {
                socket.emit('getRideStatus', { rideId: currentRideId });
              }
            }, 5000);
            AsyncStorage.setItem('statusPollInterval', pollInterval.toString());

            const acceptanceTimeout = setTimeout(() => {
              if (rideStatus === "searching") {
                Alert.alert(
                  "No Driver Available", 
                  "No driver has accepted your ride yet. Please try again or wait longer.",
                  [{ text: "OK", onPress: () => setRideStatus("idle") }]
                );
              }
            }, 60000);
            AsyncStorage.setItem('acceptanceTimeout', acceptanceTimeout.toString());
          }
          
          socket.emit('getRideStatus', { rideId: savedRideId });
        }
      } catch (error) {
        console.error('Error recovering ride data:', error);
      }
    };
    
    recoverRideData();
  }, []);

  const processRideAcceptance = useCallback((data: any) => {
    console.log('🎯 PROCESSING RIDE ACCEPTANCE:', JSON.stringify(data, null, 2));
    
    if (!data.rideId || !data.driverId) {
      console.error('❌ Invalid ride acceptance data:', data);
      return;
    }

    AsyncStorage.getItem('statusPollInterval').then(id => {
      if (id) {
        clearInterval(parseInt(id));
        AsyncStorage.removeItem('statusPollInterval');
      }
    });

    setRideStatus("onTheWay");
    setDriverId(data.driverId);
    setDriverName(data.driverName || 'Driver');
    setDriverMobile(data.driverMobile || 'N/A');
    setCurrentRideId(data.rideId);

    const acceptedDriverData: DriverType = {
      driverId: data.driverId,
      name: data.driverName || 'Driver',
      driverMobile: data.driverMobile || 'N/A',
      location: {
        coordinates: [data.driverLng || 0, data.driverLat || 0]
      },
      vehicleType: data.vehicleType || selectedRideType,
      status: "onTheWay"
    };

    console.log('👨‍💼 Setting accepted driver:', acceptedDriverData);
    
    setAcceptedDriver(acceptedDriverData);
    setNearbyDrivers([acceptedDriverData]);
    setNearbyDriversCount(1);

    if (data.driverLat && data.driverLng) {
      const driverLoc = {
        latitude: data.driverLat,
        longitude: data.driverLng
      };
      setDriverLocation(driverLoc);
      console.log('📍 Initial driver location set:', driverLoc);
    }

    AsyncStorage.setItem('currentRideId', data.rideId);
    AsyncStorage.setItem('acceptedDriver', JSON.stringify(acceptedDriverData));
    
    console.log('✅ Ride acceptance processed successfully for:', data.rideId);
  }, [selectedRideType]);

  useEffect(() => {
    console.log('🎯 Setting up GLOBAL ride acceptance listener');

    const handleRideAccepted = (data: any) => {
      console.log('🚨 ===== USER APP: RIDE ACCEPTED ====');
      console.log('📦 Acceptance data:', JSON.stringify(data, null, 2));
      console.log('🚨 ===== END ACCEPTANCE DATA ====');
      processRideAcceptance(data);
    };

    socket.on("rideAccepted", handleRideAccepted);
    
    socket.on("rideAcceptedBroadcast", async (data) => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (data.targetUserId === userId) {
          handleRideAccepted(data);
        }
      } catch (error) {
        console.error('Error checking user ID:', error);
      }
    });

    return () => {
      socket.off("rideAccepted", handleRideAccepted);
      socket.off("rideAcceptedBroadcast", handleRideAccepted);
    };
  }, [processRideAcceptance]);

  useEffect(() => {
    console.log('🔌 Setting up CRITICAL socket event handlers');

    const handleDriverDataResponse = (data: any) => {
      console.log('🚗 Driver data received:', data);
      if (data.success) {
        processRideAcceptance(data);
      }
    };

    const handleRideStatusResponse = (data: any) => {
      console.log('📋 Ride status received:', data);
      if (data.driverId) {
        processRideAcceptance(data);
      }
    };

    const handleBackupRideAccepted = (data: any) => {
      console.log('🔄 Backup ride acceptance:', data);
      processRideAcceptance(data);
    };

    socket.on("driverDataResponse", handleDriverDataResponse);
    socket.on("rideStatusResponse", handleRideStatusResponse);
    socket.on("backupRideAccepted", handleBackupRideAccepted);

    return () => {
      socket.off("driverDataResponse", handleDriverDataResponse);
      socket.off("rideStatusResponse", handleRideStatusResponse);
      socket.off("backupRideAccepted", handleBackupRideAccepted);
    };
  }, [selectedRideType]);

  useEffect(() => {
    console.log('🔍 Starting comprehensive socket debugging');
    
    const debugAllEvents = (eventName: string, data: any) => {
      if (eventName.includes('ride') || eventName.includes('driver') || eventName.includes('Room')) {
        console.log(`📡 SOCKET EVENT [${eventName}]:`, data);
      }
    };

    const debugRideAccepted = (data: any) => {
      console.log('🚨🚨🚨 RIDE ACCEPTED EVENT RECEIVED 🚨🚨🚨');
      console.log('📦 Data:', JSON.stringify(data, null, 2));
      console.log('🔍 Current state:', {
        currentRideId,
        rideStatus,
        hasAcceptedDriver: !!acceptedDriver
      });
      
      processRideAcceptance(data);
    };

    const handleConnect = () => {
      console.log('✅ Socket connected - ID:', socket.id);
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setSocketConnected(false);
    };

    socket.onAny(debugAllEvents);
    socket.on("rideAccepted", debugRideAccepted);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    console.log('🔍 Socket debuggers activated');

    return () => {
      socket.offAny(debugAllEvents);
      socket.off("rideAccepted", debugRideAccepted);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [currentRideId, rideStatus, acceptedDriver, processRideAcceptance]);

  useEffect(() => {
    if (currentRideId && rideStatus === "searching") {
      console.log('🔄 Starting backup polling for ride:', currentRideId);
      
      const pollInterval = setInterval(() => {
        console.log('📡 Polling ride status for:', currentRideId);
        socket.emit('getRideStatus', { rideId: currentRideId }, (data) => {
          if (data.driverId) {
            processRideAcceptance(data);
          } else if (bookedAt && (new Date().getTime() - bookedAt.getTime() > 60000) && rideStatus === "searching") {
            console.log('⏰ No driver found after 60s');
            Alert.alert(
              "No Driver Available",
              "No driver has accepted your ride yet. Please try again or wait longer.",
              [{ text: "OK", onPress: () => setRideStatus("idle") }]
            );
            clearInterval(pollInterval);
            AsyncStorage.removeItem('statusPollInterval');
          }
        });
      }, 3000);

      AsyncStorage.setItem('statusPollInterval', pollInterval.toString());

      return () => {
        clearInterval(pollInterval);
        AsyncStorage.removeItem('statusPollInterval');
      };
    }
  }, [currentRideId, rideStatus, bookedAt]);

  useEffect(() => {
    const registerUserRoom = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId && socket.connected) {
          console.log('👤 Registering user with socket room:', userId);
          socket.emit('registerUser', { userId });
          socket.emit('joinRoom', { userId });
        }
      } catch (error) {
        console.error('Error registering user room:', error);
      }
    };

    socket.on('connect', registerUserRoom);
    registerUserRoom();

    const interval = setInterval(registerUserRoom, 5000);

    return () => {
      socket.off('connect', registerUserRoom);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleReconnect = async () => {
      console.log('🔌 Socket reconnected, recovering state...');
      setSocketConnected(true);
      
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          socket.emit('registerUser', { userId });
          console.log('👤 User re-registered after reconnect:', userId);
        }
        
        const currentRideId = await AsyncStorage.getItem('currentRideId');
        if (currentRideId) {
          socket.emit('getRideStatus', { rideId: currentRideId });
          console.log('🔄 Requesting status for current ride:', currentRideId);
        }
      } catch (error) {
        console.error('Error during socket recovery:', error);
      }
    };
    
    socket.on("connect", handleReconnect);
    
    return () => {
      socket.off("connect", handleReconnect);
    };
  }, []);

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    if (!pickupLocation) {
      setPickupLocation(coords);
      propHandlePickupChange("Pickup Selected");
      setIsPickupCurrent(false);
      fetchNearbyDrivers(coords.latitude, coords.longitude);
    } else if (!dropoffLocation) {
      setDropoffLocation(coords);
      propHandleDropoffChange("Dropoff Selected");
      fetchRoute(coords);
    } else {
      setPickupLocation(coords);
      propHandlePickupChange("Pickup Selected");
      setIsPickupCurrent(false);
      setDropoffLocation(null);
      propHandleDropoffChange("");
      setRouteCoords([]);
      fetchNearbyDrivers(coords.latitude, coords.longitude);
    }
  };

  const fetchRoute = async (dropCoord: LocationType) => {
    if (!pickupLocation) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pickupLocation.longitude},${pickupLocation.latitude};${dropCoord.longitude},${dropCoord.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === "Ok" && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => ({ latitude: lat, longitude: lng }));
        setRouteCoords(coords);
        setDistance((data.routes[0].distance / 1000).toFixed(2) + " km");
        setTravelTime(Math.round(data.routes[0].duration / 60) + " mins");
      } else {
        setApiError("Failed to fetch route");
        Alert.alert("Route Error", "Could not find route. Please try different locations.");
      }
    } catch (err) {
      console.error(err);
      setRouteCoords([]);
      setApiError("Network error fetching route");
      Alert.alert("Route Error", "Failed to fetch route. Please check your internet connection.");
    }
  };

  const fetchSuggestions = async (query: string, type: 'pickup' | 'dropoff'): Promise<SuggestionType[]> => {
    try {
      console.log(`Fetching suggestions for: ${query}`);
      const cache = type === 'pickup' ? pickupCache : dropoffCache;
      if (cache[query]) {
        console.log(`Returning cached suggestions for: ${query}`);
        return cache[query];
      }
      if (type === 'pickup') setPickupLoading(true);
      else setDropoffLoading(true);
      setSuggestionsError(null);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=IN`;
      console.log(`API URL: ${url}`);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'EAZYGOApp/1.0' },
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid response format');
      
      const suggestions: SuggestionType[] = data.map((item: any) => ({
        id: item.place_id || `${item.lat}-${item.lon}`,
        name: item.display_name,
        address: extractAddress(item),
        lat: item.lat,
        lon: item.lon,
        type: item.type || 'unknown',
        importance: item.importance || 0,
      }));
      if (type === 'pickup') setPickupCache(prev => ({ ...prev, [query]: suggestions }));
      else setDropoffCache(prev => ({ ...prev, [query]: suggestions }));
      return suggestions;
    } catch (error: any) {
      console.error('Suggestions fetch error:', error);
      setSuggestionsError(error.message || 'Failed to fetch suggestions');
      return [];
    } finally {
      if (type === 'pickup') setPickupLoading(false);
      else setDropoffLoading(false);
    }
  };

  const extractAddress = (item: any): string => {
    if (item.address) {
      const parts = [];
      if (item.address.road) parts.push(item.address.road);
      if (item.address.suburb) parts.push(item.address.suburb);
      if (item.address.city || item.address.town || item.address.village) parts.push(item.address.city || item.address.town || item.address.village);
      if (item.address.state) parts.push(item.address.state);
      if (item.address.postcode) parts.push(item.address.postcode);
      return parts.join(', ');
    }
    return item.display_name;
  };

  const handlePickupChange = (text: string) => {
    console.log(`handlePickupChange called with: "${text}"`);
    propHandlePickupChange(text);
    if (pickupDebounceTimer.current) {
      clearTimeout(pickupDebounceTimer.current);
      pickupDebounceTimer.current = null;
    }
    if (text.length > 2) {
      setPickupLoading(true);
      setShowPickupSuggestions(true);
      pickupDebounceTimer.current = setTimeout(async () => {
        const sugg = await fetchSuggestions(text, 'pickup');
        setPickupSuggestions(sugg);
        setPickupLoading(false);
      }, 500);
    } else {
      setShowPickupSuggestions(false);
      setPickupSuggestions([]);
    }
  };

  const handleDropoffChange = (text: string) => {
    console.log(`handleDropoffChange called with: "${text}"`);
    propHandleDropoffChange(text);
    if (dropoffDebounceTimer.current) {
      clearTimeout(dropoffDebounceTimer.current);
      dropoffDebounceTimer.current = null;
    }
    if (text.length > 2) {
      setDropoffLoading(true);
      setShowDropoffSuggestions(true);
      dropoffDebounceTimer.current = setTimeout(async () => {
        const sugg = await fetchSuggestions(text, 'dropoff');
        setDropoffSuggestions(sugg);
        setDropoffLoading(false);
      }, 500);
    } else {
      setShowDropoffSuggestions(false);
      setDropoffSuggestions([]);
    }
  };

  const selectPickupSuggestion = (suggestion: SuggestionType) => {
    propHandlePickupChange(suggestion.name);
    setPickupLocation({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
    setShowPickupSuggestions(false);
    setIsPickupCurrent(false);
    if (dropoffLocation) fetchRoute({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
    fetchNearbyDrivers(parseFloat(suggestion.lat), parseFloat(suggestion.lon));
  };

  const selectDropoffSuggestion = (suggestion: SuggestionType) => {
    propHandleDropoffChange(suggestion.name);
    setDropoffLocation({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
    setShowDropoffSuggestions(false);
    if (pickupLocation) fetchRoute({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
  };

  const calculatePrice = () => {
    if (!pickupLocation || !dropoffLocation || !distance) return null;
    const distanceKm = parseFloat(distance);
    let baseFare = 0;
    let perKm = 0;
    switch (selectedRideType) {
      case 'bike': baseFare = 20; perKm = 8; break;
      case 'taxi': baseFare = 50; perKm = 15; break;
      case 'port': baseFare = 80; perKm = 25; break;
      default: baseFare = 50; perKm = 15;
    }
    const multiplier = wantReturn ? 2 : 1;
    return Math.round((baseFare + (distanceKm * perKm)) * multiplier);
  };

  useEffect(() => {
    if (pickupLocation && dropoffLocation && distance) {
      const price = calculatePrice();
      setEstimatedPrice(price);
    }
  }, [pickupLocation, dropoffLocation, selectedRideType, wantReturn, distance]);

  useEffect(() => {
    if (showPricePanel) {
      Animated.timing(panelAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(panelAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showPricePanel]);

  const handleRideTypeSelect = (type: string) => {
    if (selectedRideType === type) return;
    setSelectedRideType(type);
    setShowPricePanel(true);
    if (pickupLocation && dropoffLocation) {
      const price = calculatePrice();
      setEstimatedPrice(price);
    }
    if (location) {
      fetchNearbyDrivers(location.latitude, location.longitude);
    }
  };

  const handleBookRide = async () => {
    if (isBooking) {
      console.log('⏭️ Ride booking already in progress, skipping duplicate');
      return;
    }
    
    try {
      setIsBooking(true);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in to book a ride');
        setIsBooking(false);
        return;
      }

      if (!pickupLocation || !dropoffLocation) {
        Alert.alert('Error', 'Please select both pickup and dropoff locations');
        setIsBooking(false);
        return;
      }

      if (!estimatedPrice) {
        Alert.alert('Error', 'Price calculation failed. Please try again.');
        setIsBooking(false);
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      const customerId = (await AsyncStorage.getItem('customerId')) || 'U001';
      const userName = await AsyncStorage.getItem('userName');
      const userMobile = await AsyncStorage.getItem('userMobile');

      let otp;
      if (customerId && customerId.length >= 4) {
        otp = customerId.slice(-4);
      } else {
        otp = Math.floor(1000 + Math.random() * 9000).toString();
      }

      setRideStatus('searching');
      setBookedAt(new Date());

      console.log('📋 User Details:', {
        userId,
        customerId,
        userName,
        userMobile,
        pickup,
        dropoff,
        selectedRideType,
        otp
      });

      const rideData = {
        userId,
        customerId,
        userName,
        userMobile,
        pickup: { 
          lat: pickupLocation.latitude, 
          lng: pickupLocation.longitude, 
          address: pickup,
        },
        drop: { 
          lat: dropoffLocation.latitude, 
          lng: dropoffLocation.longitude, 
          address: dropoff,
        },
        vehicleType: selectedRideType,
        otp,
        estimatedPrice,
        distance,
        travelTime,
        wantReturn,
        token
      };

      socket.emit('bookRide', rideData, (response) => {
        setIsBooking(false);
        
        if (response && response.success) {
          setCurrentRideId(response.rideId);
          AsyncStorage.setItem('bookedAt', new Date().toISOString());
          setBookingOTP(response.otp);
          setShowConfirmModal(true);
          setRideStatus('searching');
          console.log('✅ Ride booked successfully:', response);
        } else {
          Alert.alert('Booking Failed', response?.message || 'Failed to book ride');
          setRideStatus('idle');
          setCurrentRideId(null);
        }
      });

    } catch (error) {
      setIsBooking(false);
      console.error('Booking error:', error);
      Alert.alert('Booking Failed', 'An unexpected error occurred. Please try again.');
      setRideStatus('idle');
      setCurrentRideId(null);
    }
  };

  useEffect(() => {
    console.log('🎯 Setting up real-time event listeners');
    
    const handler = (eventName: string, ...args: any[]) => {
      if (eventName.includes('driver') || eventName.includes('location')) {
        console.log('📡 Socket event:', eventName, args);
      }
    };

    socket.onAny(handler);

    return () => {
      socket.offAny(handler);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;

        const backendUrl = getBackendUrl();
        const response = await axios.get(`${backendUrl}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userProfile = response.data;
        
        console.log('📋 User Profile:', userProfile);
        
        const userMobile = userProfile.mobile || 
                           userProfile.phone || 
                           userProfile.phoneNumber || 
                           userProfile.mobileNumber || 
                           '';

        await AsyncStorage.setItem('userId', userProfile._id);
        await AsyncStorage.setItem('customerId', userProfile.customerId || userProfile._id);
        await AsyncStorage.setItem('userName', userProfile.name || userProfile.username);
        await AsyncStorage.setItem('userMobile', userProfile.phoneNumber);
        await AsyncStorage.setItem('userAddress', userProfile.address || '');
        
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleRideCreated = (data) => {
      console.log('Ride created event received:', data);
      if (data.success) {

        if (data.rideId && !currentRideId) {
          setCurrentRideId(data.rideId);
        }
        
        AsyncStorage.setItem('lastRideId', data.rideId || currentRideId || '');
        
        setBookingOTP(data.otp);
        setShowConfirmModal(true);
        setRideStatus("searching");
      } else if (data.message) {
        Alert.alert("Booking Failed", data.message || "Failed to book ride");
        setRideStatus("idle");
        setCurrentRideId(null);
      }
    };

    socket.on("rideCreated", handleRideCreated);

    return () => {
      socket.off("rideCreated", handleRideCreated);
    };
  }, [currentRideId]);

  const handleConfirmBooking = async () => {
    console.log('Confirming booking with OTP:', bookingOTP);
    console.log('Current Ride ID:', currentRideId);

    let rideIdToUse = currentRideId;
    
    if (!rideIdToUse) {
      rideIdToUse = await AsyncStorage.getItem('currentRideId');
      console.log('🔄 Using rideId from storage:', rideIdToUse);
    }
    
    if (!rideIdToUse) {
      Alert.alert("Error", "Invalid booking state. Please try booking again.");
      setShowConfirmModal(false);
      return;
    }
    
    setCurrentRideId(rideIdToUse);
    setRideStatus("searching");
    setShowConfirmModal(false);
    
    console.log('🚀 Waiting for driver to accept ride:', rideIdToUse);
    
    const statusPollInterval = setInterval(() => {
      if (currentRideId) {
        socket.emit('getRideStatus', { rideId: currentRideId });
      }
    }, 5000);
    
    AsyncStorage.setItem('statusPollInterval', statusPollInterval.toString());
  };

  const renderVehicleIcon = (type: 'bike' | 'taxi' | 'port', size: number = 24, color: string = '#000000') => {
    try {
      switch (type) {
        case 'bike': 
          return <BikeIcon width={size} height={size} fill={color} />;
        case 'taxi': 
          return <TaxiIcon width={size} height={size} fill={color} />;
        case 'port': 
          return <LorryIcon width={size} height={size} fill={color} />;
        default: 
          return <TaxiIcon width={size} height={size} fill={color} />;
      }
    } catch (error) {
      console.error('Error rendering vehicle icon:', error);
      return <TaxiIcon width={size} height={size} fill={color} />;
    }
  };

  const renderPersonIcon = (size: number = 30, color: string = '#4285F4') => {
    try {
      return <PersonIcon width={size} height={size} fill={color} />;
    } catch (error) {
      console.error('Error rendering person icon:', error);
      return (
        <MaterialIcons name="person" size={size} color={color} />
      );
    }
  };

  const renderSuggestionItem = (item: SuggestionType, onSelect: () => void, key: string) => {
    let iconName = 'location-on';
    let iconColor = '#A9A9A9';
    if (item.type.includes('railway') || item.type.includes('station')) { iconName = 'train'; iconColor = '#3F51B5'; }
    else if (item.type.includes('airport')) { iconName = 'flight'; iconColor = '#2196F3'; }
    else if (item.type.includes('bus')) { iconName = 'directions-bus'; iconColor = '#FF9800'; }
    else if (item.type.includes('hospital')) { iconName = 'local-hospital'; iconColor = '#F44336'; }
    else if (item.type.includes('school') || item.type.includes('college')) { iconName = 'school'; iconColor = '#4CAF50'; }
    else if (item.type.includes('place_of_worship')) { iconName = 'church'; iconColor = '#9C27B0'; }
    else if (item.type.includes('shop') || item.type.includes('mall')) { iconName = 'shopping-mall'; iconColor = '#E91E63'; }
    else if (item.type.includes('park')) { iconName = 'park'; iconColor = '#4CAF50'; }
    
    return (
      <TouchableOpacity key={key} style={styles.suggestionItem} onPress={onSelect}>
        <MaterialIcons name={iconName as any} size={20} color={iconColor} style={styles.suggestionIcon} />
        <View style={styles.suggestionTextContainer}>
          <Text style={styles.suggestionMainText} numberOfLines={1}>{extractMainName(item.name)}</Text>
          <Text style={styles.suggestionSubText} numberOfLines={1}>{item.address}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  const extractMainName = (fullName: string): string => {
    const parts = fullName.split(',');
    return parts[0].trim();
  };
  
  const isBookRideButtonEnabled = pickup && dropoff && selectedRideType && estimatedPrice !== null;
  
  const RideTypeSelector = ({ selectedRideType, setSelectedRideType, estimatedPrice, distance }) => {
    return (
      <View style={styles.rideTypeContainer}>
        {/* Porter Button */}
        <TouchableOpacity
          style={[
            styles.rideTypeButton,
            selectedRideType === 'port' && styles.selectedRideTypeButton,
          ]}
          onPress={() => setSelectedRideType('port')}
        >
          <View style={styles.rideIconContainer}>
            {renderVehicleIcon('port', 24, selectedRideType === 'port' ? '#FFFFFF' : '#333333')}
          </View>
          <View style={styles.rideInfoContainer}>
            <Text style={[
              styles.rideTypeText,
              selectedRideType === 'port' && styles.selectedRideTypeText,
            ]}>CarGo Porter</Text>
            <Text style={[
              styles.rideDetailsText,
              selectedRideType === 'port' && styles.selectedRideDetailsText,
            ]}>Max 5 ton</Text>
            <Text style={styles.ridePriceText}>
              {selectedRideType === 'port' && estimatedPrice ? `₹${estimatedPrice}` : 'Price'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Taxi Button */}
        <TouchableOpacity
          style={[
            styles.rideTypeButton,
            selectedRideType === 'taxi' && styles.selectedRideTypeButton,
          ]}
          onPress={() => setSelectedRideType('taxi')}
        >
          <View style={styles.rideIconContainer}>
            {renderVehicleIcon('taxi', 24)}
          </View>
          <View style={styles.rideInfoContainer}>
            <Text style={[
              styles.rideTypeText,
              selectedRideType === 'taxi' && styles.selectedRideTypeText,
            ]}>Taxi</Text>
            <Text style={[
              styles.rideDetailsText,
              selectedRideType === 'taxi' && styles.selectedRideDetailsText,
            ]}>4 seats</Text>
            <Text style={styles.ridePriceText}>
              {selectedRideType === 'taxi' && estimatedPrice ? `₹${estimatedPrice}` : 'Price'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Bike Button */}
        <TouchableOpacity
          style={[
            styles.rideTypeButton,
            selectedRideType === 'bike' && styles.selectedRideTypeButton,
          ]}
          onPress={() => setSelectedRideType('bike')}
        >
          <View style={styles.rideIconContainer}>
            {renderVehicleIcon('bike', 24, selectedRideType === 'bike' ? '#FFFFFF' : '#333333')}
          </View>
          <View style={styles.rideInfoContainer}>
            <Text style={[
              styles.rideTypeText,
              selectedRideType === 'bike' && styles.selectedRideTypeText,
            ]}>Motorcycle</Text>
            <Text style={[
              styles.rideDetailsText,
              selectedRideType === 'bike' && styles.selectedRideDetailsText,
            ]}>1 person</Text>
            <Text style={styles.ridePriceText}>
              {selectedRideType === 'bike' && estimatedPrice ? `₹${estimatedPrice}` : 'Price'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {isLoadingLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Fetching your location...</Text>
        </View>
      ) : (
        <>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={{
                latitude: location?.latitude || 11.018,
                longitude: location?.longitude || 77.012,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
              }}
              onPress={handleMapPress}
            >
              {/* User location marker - Always visible */}
              {location && (
                <Marker 
                  coordinate={location} 
                  title="Your Location"
                  description="Current location"
                  key={`user-location-${location.latitude}-${location.longitude}`}
                >
                  <View style={styles.userLocationMarker}>
                    {renderPersonIcon(30, '#4285F4')}
                  </View>
                </Marker>
              )}
              
              {/* Blue pickup marker - Shows after first click/input */}
              {pickupLocation && (
                <Marker 
                  coordinate={pickupLocation} 
                  title="Pickup"
                  pinColor="blue"
                  key={`pickup-${pickupLocation.latitude}-${pickupLocation.longitude}`}
                />
              )}
              
              {/* Red dropoff marker - Shows after second click/input */}
              {dropoffLocation && (
                <Marker 
                  coordinate={dropoffLocation} 
                  title="Dropoff"
                  pinColor="red"
                  key={`dropoff-${dropoffLocation.latitude}-${dropoffLocation.longitude}`}
                />
              )}
              
              {/* Driver marker without background */}
              {driverLocation && (
                <Marker 
                  coordinate={driverLocation} 
                  title="Driver"
                  key={`driver-${driverLocation.latitude}-${driverLocation.longitude}-${Date.now()}`}
                >
                  <View style={styles.driverMarkerContainer}>
                    {renderVehicleIcon(selectedRideType as 'bike' | 'taxi' | 'port', 30, '#000000')}
                  </View>
                </Marker>
              )}

              {/* Nearby drivers of selected vehicle type only */}
              {(rideStatus === "idle" || rideStatus === "searching") && nearbyDrivers.map((driver) => (
                <Marker
                  key={`nearby-${driver.driverId}-${driver.location.coordinates[1]}-${driver.location.coordinates[0]}-${Date.now()}`}
                  coordinate={{
                    latitude: driver.location.coordinates[1],
                    longitude: driver.location.coordinates[0],
                  }}
                  title={`${driver.name} (${driver.status || 'Live'})`}
                >
                  <View style={styles.driverMarkerContainer}>
                    {renderVehicleIcon(driver.vehicleType as 'bike' | 'taxi' | 'port', 30, '#000000')}
                  </View>
                </Marker>
              ))}

              {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#4CAF50" />}
            </MapView>
            
            {/* Professional driver status display */}
            {(rideStatus === "idle" || rideStatus === "searching") && (
              <View style={styles.driversCountOverlay}>
                <View style={styles.statusCard}>
                  <View style={styles.statusIconContainer}>
                    <MaterialIcons name="directions-car" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusMainText}>
                      {nearbyDriversCount} {selectedRideType === 'bike' ? 'Motorcycles' : selectedRideType === 'taxi' ? 'Taxis' : 'Porters'} nearby
                    </Text>
                    <Text style={styles.statusSubText}>
                      {nearbyDriversCount > 0 ? 'Available now' : 'No vehicles available'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ACTIVE RIDE: Show driver status */}
            {(rideStatus === "onTheWay" || rideStatus === "arrived" || rideStatus === "started") && (
              <View style={styles.driversCountOverlay}>
                <View style={[styles.statusCard, rideStatus === "arrived" && styles.arrivedStatusCard]}>
                  <View style={styles.statusIconContainer}>
                    {rideStatus === "onTheWay" && <MaterialIcons name="directions-car" size={20} color="#FF9800" />}
                    {rideStatus === "arrived" && <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />}
                    {rideStatus === "started" && <MaterialIcons name="navigation" size={20} color="#4CAF50" />}
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text style={[styles.statusMainText, rideStatus === "arrived" && styles.arrivedStatusText]}>
                      {rideStatus === "onTheWay" && "Driver is on the way"}
                      {rideStatus === "arrived" && "Driver has arrived"}
                      {rideStatus === "started" && "Ride in progress"}
                    </Text>
                    {rideStatus === "onTheWay" && driverLocation && pickupLocation && (
                      <Text style={styles.statusSubText}>
                        {calculateDistance(
                          pickupLocation.latitude,
                          pickupLocation.longitude,
                          driverLocation.latitude,
                          driverLocation.longitude
                        ).toFixed(1)} km away
                      </Text>
                    )}
                    {rideStatus === "arrived" && (
                      <Text style={[styles.statusSubText, styles.arrivedSubText]}>
                        Share OTP with driver
                      </Text>
                    )}
                    {rideStatus === "started" && (
                      <Text style={styles.statusSubText}>
                        Heading to destination
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Driver Info Section */}
          {acceptedDriver && (
            <View style={styles.driverInfoContainer}>
              <View style={styles.driverInfoHeader}>
                <Text style={styles.driverInfoTitle}>Your Driver</Text>
                <View style={styles.vehicleBadge}>
                  {renderVehicleIcon(selectedRideType as 'bike' | 'taxi' | 'port', 16, '#FFFFFF')}
                </View>
              </View>
              <View style={styles.driverDetailsRow}>
                <MaterialIcons name="person" size={20} color="#4CAF50" />
                <Text style={styles.driverDetailText}>{acceptedDriver.name}</Text>
              </View>
              <View style={styles.driverDetailsRow}>
                <MaterialIcons name="phone" size={20} color="#4CAF50" />
                <Text style={styles.driverDetailText}>{acceptedDriver.driverMobile || 'N/A'}</Text>
              </View>
              <View style={styles.driverDetailsRow}>
                <MaterialIcons name="directions-car" size={20} color="#4CAF50" />
                <Text style={styles.driverDetailText}>
                  {selectedRideType === 'bike' ? 'Motorcycle' : selectedRideType === 'taxi' ? 'Taxi' : 'Porter'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <MaterialIcons name="my-location" size={20} color="#4CAF50" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Pickup Location"
                value={pickup}
                onChangeText={handlePickupChange}
                placeholderTextColor="#999"
              />
            </View>
            
            {showPickupSuggestions && (
              <View style={styles.suggestionsContainer}>
                {pickupLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading suggestions...</Text>
                  </View>
                ) : suggestionsError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{suggestionsError}</Text>
                  </View>
                ) : pickupSuggestions.length > 0 ? (
                  pickupSuggestions.map((item) => (
                    renderSuggestionItem(item, () => selectPickupSuggestion(item), item.id)
                  ))
                ) : (
                  <View style={styles.noSuggestionsContainer}>
                    <Text style={styles.noSuggestionsText}>No suggestions found</Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <MaterialIcons name="place" size={20} color="#F44336" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Dropoff Location"
                value={dropoff}
                onChangeText={handleDropoffChange}
                placeholderTextColor="#999"
              />
            </View>
            
            {showDropoffSuggestions && (
              <View style={styles.suggestionsContainer}>
                {dropoffLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading suggestions...</Text>
                  </View>
                ) : suggestionsError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{suggestionsError}</Text>
                  </View>
                ) : dropoffSuggestions.length > 0 ? (
                  dropoffSuggestions.map((item) => (
                    renderSuggestionItem(item, () => selectDropoffSuggestion(item), item.id)
                  ))
                ) : (
                  <View style={styles.noSuggestionsContainer}>
                    <Text style={styles.noSuggestionsText}>No suggestions found</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          
          {(distance || travelTime) && (
            <View style={styles.distanceTimeContainer}>
              <View style={styles.distanceTimeItem}>
                <MaterialIcons name="route" size={18} color="#757575" />
                <Text style={styles.distanceTimeLabel}>DISTANCE:</Text>
                <Text style={styles.distanceTimeValue}>{distance || '---'}</Text>
              </View>
              <View style={styles.distanceTimeItem}>
                <MaterialIcons name="schedule" size={18} color="#757575" />
                <Text style={styles.distanceTimeLabel}>TRAVEL TIME:</Text>
                <Text style={styles.distanceTimeValue}>{travelTime || '---'}</Text>
              </View>
            </View>
          )}
          
          {apiError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}
          
          <RideTypeSelector
            selectedRideType={selectedRideType}
            setSelectedRideType={handleRideTypeSelect}
            estimatedPrice={estimatedPrice}
            distance={distance}
          />
          
          <View style={styles.bookRideButtonContainer}>
            <TouchableOpacity
              style={[
                styles.bookRideButton,
                isBookRideButtonEnabled ? styles.enabledBookRideButton : styles.disabledBookRideButton,
              ]}
              onPress={handleBookRide}
              disabled={!isBookRideButtonEnabled}
            >
              <Text style={styles.bookRideButtonText}>BOOK RIDE</Text>
            </TouchableOpacity>
          </View>
          
          {showPricePanel && selectedRideType && (
            <Animated.View
              style={[
                styles.pricePanel,
                {
                  transform: [{
                    translateY: panelAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Ride Details</Text>
                <TouchableOpacity onPress={() => setShowPricePanel(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.priceDetailsContainer}>
                <View style={styles.vehicleIconContainer}>
                  {renderVehicleIcon(selectedRideType as 'bike' | 'taxi' | 'port', 40, '#000000')}
                </View>
                <View style={styles.priceInfoContainer}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Pickup:</Text>
                    <Text style={styles.priceValue} numberOfLines={1}>{pickup || 'Not selected'}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Drop-off:</Text>
                    <Text style={styles.priceValue} numberOfLines={1}>{dropoff || 'Not selected'}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Distance:</Text>
                    <Text style={styles.priceValue}>{distance || '---'}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Price:</Text>
                    <Text style={styles.priceValue}>₹{estimatedPrice || '---'}</Text>
                  </View>
                  <View style={styles.returnTripRow}>
                    <Text style={styles.priceLabel}>Return trip:</Text>
                    <Switch
                      value={wantReturn}
                      onValueChange={setWantReturn}
                      trackColor={{ false: '#767577', true: '#4CAF50' }}
                      thumbColor={wantReturn ? '#FFFFFF' : '#FFFFFF'}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.bookButtonContainer}>
                <TouchableOpacity
                  style={styles.bookMyRideButton}
                  onPress={handleBookRide}
                >
                  <Text style={styles.bookMyRideButtonText}>BOOK MY RIDE</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
          
          <Modal
            animationType="slide"
            transparent={true}
            visible={showConfirmModal}
            onRequestClose={() => setShowConfirmModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Booking</Text>
                  <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                    <MaterialIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalContent}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                  </View>
                  <Text style={styles.modalMessage}>
                    Thank you for choosing EAZY GO!
                  </Text>
                  <Text style={styles.modalSubMessage}>
                    Your ride has been successfully booked.
                  </Text>
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>Your pickup OTP is:</Text>
                    <Text style={styles.otpValue}>{bookingOTP}</Text>
                  </View>
                  <Text style={styles.otpWarning}>
                    Please don't share it with anyone. Only share with our driver.
                  </Text>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowConfirmModal(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={handleConfirmBooking}
                  >
                    <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#757575', fontSize: 16, marginTop: 10 },
  mapContainer: { 
    height: Dimensions.get('window').height * 0.4, 
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  map: { ...StyleSheet.absoluteFillObject },
  userLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  driversCountOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  arrivedStatusCard: {
    backgroundColor: '#4CAF50',
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  arrivedStatusText: {
    color: '#FFFFFF',
  },
  statusSubText: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  arrivedSubText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  driverInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  driverInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  driverInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  vehicleBadge: {
    backgroundColor: '#4CAF50',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  driverDetailText: {
    fontSize: 14,
    color: '#555555',
    marginLeft: 10
  },
  inputContainer: { 
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE'
  },
  inputIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, color: '#333' },
  suggestionsContainer: { 
    marginTop: 5,
    marginHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200
  },
  suggestionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 15,
    borderBottomWidth: 1, 
    borderBottomColor: '#EEEEEE' 
  },
  suggestionIcon: { marginRight: 12 },
  suggestionTextContainer: { flex: 1 },
  suggestionMainText: { fontSize: 16, fontWeight: '500', color: '#333333' },
  suggestionSubText: { fontSize: 12, color: '#757575', marginTop: 2 },
  noSuggestionsContainer: { paddingVertical: 12, alignItems: 'center' },
  noSuggestionsText: { fontSize: 14, color: '#666666' },
  distanceTimeContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  distanceTimeItem: { flexDirection: 'row', alignItems: 'center' },
  distanceTimeLabel: { fontSize: 14, fontWeight: '600', color: '#757575', marginLeft: 8 },
  distanceTimeValue: { fontSize: 14, fontWeight: 'bold', color: '#333333', marginLeft: 5 },
  rideTypeContainer: { 
    marginHorizontal: 20, 
    marginBottom: 15,
  },
  rideTypeButton: { 
    width: '100%', 
    flexDirection: 'row',
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 5,
    marginBottom: 10,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  selectedRideTypeButton: { 
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#4caf50'
  },
  rideIconContainer: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rideInfoContainer: {
    flex: 1,
  },
  rideTypeText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333333',
    marginBottom: 4,
  },
  selectedRideTypeText: { 
    color: '#FFFFFF' 
  },
  rideDetailsText: { 
    fontSize: 14, 
    color: '#757575',
    marginBottom: 6,
  },
  selectedRideDetailsText: {
    color: '#FFFFFF'
  },
  ridePriceText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#333333',
  },
  bookRideButtonContainer: { 
    marginHorizontal: 20, 
    marginBottom: 20 
  },
  bookRideButton: { 
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  enabledBookRideButton: { backgroundColor: '#4caf50' },
  disabledBookRideButton: { backgroundColor: '#BDBDBD' },
  bookRideButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  errorContainer: { 
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#FFEBEE', 
    borderRadius: 12, 
    padding: 15, 
    borderLeftWidth: 4, 
    borderLeftColor: '#F44336' 
  },
  errorText: { 
    color: '#D32F2F', 
    fontSize: 14, 
    textAlign: 'center' 
  },
  pricePanel: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    maxHeight: Dimensions.get('window').height * 0.5, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -3 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 6 
  },
  panelHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15, 
    paddingBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEEEEE' 
  },
  panelTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333333' 
  },
  driverMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceDetailsContainer: { 
    flexDirection: 'row', 
    marginBottom: 8 
  },
  priceInfoContainer: { 
    flex: 1 
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  priceLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#757575', 
    flex: 1 
  },
  priceValue: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: '#333333', 
    flex: 2, 
    textAlign: 'right' 
  },
  returnTripRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 5 
  },
  bookButtonContainer: { 
    marginTop: 10 
  },
  bookMyRideButton: { 
    backgroundColor: '#4CAF50', 
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 4 
  },
  bookMyRideButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContainer: { 
    width: '85%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 20, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 6 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333333' 
  },
  modalContent: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalIconContainer: { 
    marginBottom: 15 
  },
  modalMessage: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333333', 
    textAlign: 'center', 
    marginBottom: 5 
  },
  modalSubMessage: { 
    fontSize: 16, 
    color: '#666666', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  otpContainer: { 
    backgroundColor: '#F5F5F5', 
    borderRadius: 10, 
    padding: 15, 
    alignItems: 'center', 
    marginBottom: 15, 
    width: '100%' 
  },
  otpLabel: { 
    fontSize: 14, 
    color: '#666666', 
    marginBottom: 5 
  },
  otpValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#4caf50' 
  },
  otpWarning: { 
    fontSize: 12, 
    color: '#F44336', 
    textAlign: 'center', 
    fontStyle: 'italic' 
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  modalCancelButton: { 
    flex: 1, 
    backgroundColor: '#F5F5F5', 
    paddingVertical: 12, 
    borderRadius: 10, 
    marginRight: 10, 
    alignItems: 'center' 
  },
  modalCancelButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#666666' 
  },
  modalConfirmButton: { 
    flex: 1, 
    backgroundColor: '#4CAF50', 
    paddingVertical: 12, 
    borderRadius: 10, 
    marginLeft: 10, 
    alignItems: 'center' 
  },
  modalConfirmButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFFFFF' 
  },
});

export default TaxiContent;






































































































// import React, { useState, useEffect, useRef, useCallback } from 'react';

// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   Dimensions,
//   Alert,
//   ActivityIndicator,
//   Animated,
//   Switch,
//   Modal,
//   TextInput,
//   PermissionsAndroid,
//   Platform,
//   Image
// } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';
// import socket from '../../socket';
// import haversine from 'haversine-distance';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getBackendUrl } from '../../util/backendConfig';

// // Import your custom icons
// import BikeIcon from '../../../assets001/bike.svg';
// import LorryIcon from '../../../assets001/lorry.svg';
// import TaxiIcon from '../../../assets001/taxi.svg'; // Updated TaxiIcon import
// import PersonIcon from '../../../assets001/person.svg'; // Added person icon

// interface LocationType {
//   latitude: number;
//   longitude: number;
// }

// interface SuggestionType {
//   id: string;
//   name: string;
//   address: string;
//   lat: string;
//   lon: string;
//   type: string;
//   importance: number;
// }

// interface DriverType {
//   driverId: string;
//   name: string;
//   location: {
//     coordinates: [number, number]; // [longitude, latitude]
//   };
//   vehicleType: string;
//   status?: string;
//   driverMobile?: string;
// }

// interface TaxiContentProps {
//   loadingLocation?: boolean;
//   currentLocation: LocationType | null;
//   lastSavedLocation: LocationType | null;
//   pickup: string;
//   dropoff: string;
//   handlePickupChange: (text: string) => void;
//   handleDropoffChange: (text: string) => void;
// }

// const TaxiContent: React.FC<TaxiContentProps> = ({
//   loadingLocation: propLoadingLocation,
//   currentLocation: propCurrentLocation,
//   lastSavedLocation: propLastSavedLocation,
//   pickup,
//   dropoff,
//   handlePickupChange: propHandlePickupChange,
//   handleDropoffChange: propHandleDropoffChange,
// }) => {
//   const [isLoadingLocation, setIsLoadingLocation] = useState(true);
//   const [selectedRideType, setSelectedRideType] = useState<string>('taxi');
//   const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
//   const [showPricePanel, setShowPricePanel] = useState(false);
//   const [wantReturn, setWantReturn] = useState(false);
//   const [distance, setDistance] = useState<string>('');
//   const [travelTime, setTravelTime] = useState<string>('');
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [bookingOTP, setBookingOTP] = useState<string>('');
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [location, setLocation] = useState<LocationType | null>(null);
//   const [pickupLocation, setPickupLocation] = useState<LocationType | null>(null);
//   const [dropoffLocation, setDropoffLocation] = useState<LocationType | null>(null);
//   const [routeCoords, setRouteCoords] = useState<LocationType[]>([]);
//   const [currentRideId, setCurrentRideId] = useState<string | null>(null);
//   const [rideStatus, setRideStatus] = useState<"idle" | "searching" | "onTheWay" | "arrived" | "started" | "completed">("idle");
//   const [driverId, setDriverId] = useState<string | null>(null);
//   const [driverLocation, setDriverLocation] = useState<LocationType | null>(null);
//   const [travelledKm, setTravelledKm] = useState(0);
//   const [lastCoord, setLastCoord] = useState<LocationType | null>(null);
//   const [nearbyDrivers, setNearbyDrivers] = useState<DriverType[]>([]);
//   const [nearbyDriversCount, setNearbyDriversCount] = useState<number>(0);
  
//   const [pickupSuggestions, setPickupSuggestions] = useState<SuggestionType[]>([]);
//   const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
//   const [dropoffSuggestions, setDropoffSuggestions] = useState<SuggestionType[]>([]);
//   const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  
//   const [pickupLoading, setPickupLoading] = useState(false);
//   const [dropoffLoading, setDropoffLoading] = useState(false);
//   const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
//   const [pickupCache, setPickupCache] = useState<Record<string, SuggestionType[]>>({});
//   const [dropoffCache, setDropoffCache] = useState<Record<string, SuggestionType[]>>({});
  
//   const [isPickupCurrent, setIsPickupCurrent] = useState(false);
//   const [socketConnected, setSocketConnected] = useState(false);
//   const [driverArrivedAlertShown, setDriverArrivedAlertShown] = useState(false);
//   const [rideCompletedAlertShown, setRideCompletedAlertShown] = useState(false);
//   const [acceptedDriver, setAcceptedDriver] = useState<DriverType | null>(null);
//   const [isBooking, setIsBooking] = useState(false);
  
//   const [driverName, setDriverName] = useState<string | null>(null);
//   const [driverMobile, setDriverMobile] = useState<string | null>(null);
//   const [bookedAt, setBookedAt] = useState<Date | null>(null);
  
//   const pickupDebounceTimer = useRef<NodeJS.Timeout | null>(null);
//   const dropoffDebounceTimer = useRef<NodeJS.Timeout | null>(null);
//   const driverArrivalCheckInterval = useRef<NodeJS.Timeout | null>(null); // ✅ NEW: Interval for checking driver arrival

//   const panelAnimation = useRef(new Animated.Value(0)).current;
//   const mapRef = useRef<MapView | null>(null);

//   const fallbackLocation: LocationType = {
//     latitude: 11.3312971,
//     longitude: 77.7167303,
//   };

//   // ✅ IMPROVED: Accurate distance calculation
//   const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//     const R = 6371; // Earth's radius in kilometers
//     const dLat = (lat2 - lat1) * Math.PI / 180;
//     const dLon = (lon2 - lon1) * Math.PI / 180;
    
//     const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
//               Math.sin(dLon/2) * Math.sin(dLon/2);
    
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     const distance = R * c;
    
//     console.log(`📍 Distance calculation: (${lat1},${lon1}) to (${lat2},${lon2}) = ${distance.toFixed(4)} km`);
    
//     return distance;
//   };

//   const calculateDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//     const R = 6371;
//     const dLat = (lat2 - lat1) * Math.PI / 180;
//     const dLon = (lon2 - lon1) * Math.PI / 180;
//     const a = 
//       Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
//       Math.sin(dLon/2) * Math.sin(dLon/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     const distanceKm = R * c;
//     return distanceKm * 1000;
//   };

//   // ✅ CORRECTED: Nearby drivers filtering logic
//   const fetchNearbyDrivers = (latitude: number, longitude: number) => {
//     console.log(`Fetching nearby drivers for lat: ${latitude}, lng: ${longitude}`);
//     if (socket && socketConnected) {
//       socket.emit("requestNearbyDrivers", { 
//         latitude, 
//         longitude, 
//         radius: 10000,
//         vehicleType: selectedRideType 
//       });
//       console.log("Emitted requestNearbyDrivers event");
//     } else {
//       console.log("Socket not connected, attempting to reconnect...");
//       socket.connect();
//       socket.once("connect", () => {
//         console.log("Socket reconnected, emitting requestNearbyDrivers");
//         socket.emit("requestNearbyDrivers", { 
//           latitude, 
//           longitude, 
//           radius: 10000,
//           vehicleType: selectedRideType 
//         });
//       });
//     }
//   };

//   // ✅ CORRECTED: Nearby drivers response handler with DEBUG
//   useEffect(() => {
//     const handleNearbyDriversResponse = (data: { drivers: DriverType[] }) => {
//       console.log('📍 Received nearby drivers response:', JSON.stringify(data, null, 2));
//       if (!location) {
//         console.log("❌ No location available, can't process drivers");
//         return;
//       }
      
//       console.log('📍 User current location:', location);
//       console.log('📍 Number of drivers received:', data.drivers.length);
      
//       // ✅ ACTIVE RIDE: Show only accepted driver
//       if (currentRideId && acceptedDriver) {
//         console.log('🚗 Active ride - Showing only accepted driver');
//         const acceptedDriverData = data.drivers.find(d => d.driverId === acceptedDriver.driverId);
//         if (acceptedDriverData) {
//           setNearbyDrivers([acceptedDriverData]);
//           setNearbyDriversCount(1);
//           console.log('✅ Accepted driver found and displayed');
//         } else {
//           setNearbyDrivers([]);
//           setNearbyDriversCount(0);
//           console.log('❌ Accepted driver not found in response');
//         }
//         return;
//       }
      
//       // ✅ NO ACTIVE RIDE: Show all online drivers with DEBUG
//       const filteredDrivers = data.drivers
//         .filter(driver => {
//           console.log(`🔍 Processing driver: ${driver.driverId} (${driver.name})`);
//           console.log(`📍 Driver location: ${driver.location.coordinates[1]}, ${driver.location.coordinates[0]}`);
          
//           // Check driver status
//           if (driver.status && !["Live", "online", "onRide", "available"].includes(driver.status)) {
//             console.log(`❌ Driver ${driver.driverId} filtered out by status: ${driver.status}`);
//             return false;
//           }
          
//           // Calculate distance
//           const distance = calculateDistance(
//             location.latitude,
//             location.longitude,
//             driver.location.coordinates[1],
//             driver.location.coordinates[0]
//           );
//           console.log(`📏 Driver ${driver.driverId} distance: ${distance.toFixed(2)} km`);
          
//           const isWithinRange = distance <= 10;
//           console.log(`✅ Driver ${driver.driverId} within 10km: ${isWithinRange}`);
          
//           return isWithinRange;
//         })
//         .sort((a, b) => {
//           const distA = calculateDistance(location.latitude, location.longitude, a.location.coordinates[1], a.location.coordinates[0]);
//           const distB = calculateDistance(location.latitude, location.longitude, b.location.coordinates[1], b.location.coordinates[0]);
//           return distA - distB;
//         })
//         .slice(0, 10);
      
//       console.log('✅ Filtered drivers count:', filteredDrivers.length);
//       console.log('📍 Final drivers to display:', filteredDrivers);
      
//       setNearbyDrivers(filteredDrivers);
//       setNearbyDriversCount(filteredDrivers.length);
//     };

//     socket.on("nearbyDriversResponse", handleNearbyDriversResponse);
//     return () => socket.off("nearbyDriversResponse", handleNearbyDriversResponse);
//   }, [location, socketConnected, currentRideId, acceptedDriver]);

//   useEffect(() => {
//     const requestLocation = async () => {
//       setIsLoadingLocation(true);

//       if (propCurrentLocation) {
//         console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Using current location from props:`, propCurrentLocation);
//         setLocation(propCurrentLocation);
//         global.currentLocation = propCurrentLocation;
//         fetchNearbyDrivers(propCurrentLocation.latitude, propCurrentLocation.longitude);
//         setIsLoadingLocation(false);
//         return;
//       }

//       if (propLastSavedLocation) {
//         console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Using last saved location from props:`, propLastSavedLocation);
//         setLocation(propLastSavedLocation);
//         global.currentLocation = propLastSavedLocation;
//         fetchNearbyDrivers(propLastSavedLocation.latitude, propLastSavedLocation.longitude);
//         setIsLoadingLocation(false);
//         return;
//       }

//       console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Using fallback location:`, fallbackLocation);
//       setLocation(fallbackLocation);
//       global.currentLocation = fallbackLocation;
//       fetchNearbyDrivers(fallbackLocation.latitude, fallbackLocation.longitude);
//       setIsLoadingLocation(false);

//       if (Platform.OS === "android") {
//         const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
//         if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//           console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Location permission denied`);
//           Alert.alert("Permission Denied", "Location permission is required to proceed.");
//           return;
//         }
//       }
//       Geolocation.getCurrentPosition(
//         (pos) => {
//           const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
//           console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Live location fetched successfully:`, loc);
//           setLocation(loc);
//           global.currentLocation = loc;
//           fetchNearbyDrivers(loc.latitude, loc.longitude);
//         },
//         (err) => {
//           console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] Location error:`, err.code, err.message);
//           Alert.alert("Location Error", "Could not fetch location. Please try again or check your GPS settings.");
//         },
//         { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000, distanceFilter: 10 }
//       );
//     };
//     requestLocation();
//   }, [propCurrentLocation, propLastSavedLocation]);

//   useEffect(() => {
//     const handleConnect = async () => { 
//       console.log("Socket connected"); 
//       setSocketConnected(true); 
//       if (location) fetchNearbyDrivers(location.latitude, location.longitude);
      
//       try {
//         const userId = await AsyncStorage.getItem('userId');
//         if (userId) {
//           socket.emit('registerUser', { userId });
//           console.log('👤 User registered with socket:', userId);
//         }
//       } catch (error) {
//         console.error('Error registering user with socket:', error);
//       }
//     };
    
//     const handleDisconnect = () => { console.log("Socket disconnected"); setSocketConnected(false); };
//     const handleConnectError = (error: Error) => { console.error("Socket connection error:", error); setSocketConnected(false); };
    
//     socket.on("connect", handleConnect);
//     socket.on("disconnect", handleDisconnect);
//     socket.on("connect_error", handleConnectError);
//     setSocketConnected(socket.connected);
    
//     return () => {
//       socket.off("connect", handleConnect);
//       socket.off("disconnect", handleDisconnect);
//       socket.off("connect_error", handleConnectError);
//     };
//   }, [location]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (location && (rideStatus === "idle" || rideStatus === "searching")) {
//         Geolocation.getCurrentPosition(
//           (pos) => {
//             const newLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
//             setLocation(newLoc);
//             if (isPickupCurrent && pickupLocation && dropoffLocation) {
//               setPickupLocation(newLoc);
//               fetchRoute(newLoc);
//             }
//             fetchNearbyDrivers(newLoc.latitude, newLoc.longitude);
//           },
//           (err) => { console.error("Live location error:", err); },
//           { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
//         );
//       }
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [rideStatus, isPickupCurrent, dropoffLocation, location, socketConnected]);

//   // ✅ CRITICAL FIX: Driver live location updates with proper state management
//   useEffect(() => {
//     const handleDriverLiveLocationUpdate = (data: { driverId: string; lat: number; lng: number; status?: string }) => {
//       console.log('📍 Received driver location update:', data);
      
//       // If we have an active ride and this is the accepted driver
//       if (currentRideId && acceptedDriver && data.driverId === acceptedDriver.driverId) {
//         console.log('📍 Updating accepted driver location during active ride');
        
//         // CRITICAL: Update driver location state
//         const driverCoords = { latitude: data.lat, longitude: data.lng };
//         setDriverLocation(driverCoords);
        
//         // Update the driver in nearbyDrivers
//         setNearbyDrivers(prev => {
//           if (prev.length > 0 && prev[0].driverId === data.driverId) {
//             return [{
//               ...prev[0],
//               location: { coordinates: [data.lng, data.lat] },
//               status: data.status || "onTheWay"
//             }];
//           }
//           return prev;
//         });
        
//         // Calculate distance if needed
//         if (lastCoord) {
//           const dist = haversine(lastCoord, driverCoords);
//           setTravelledKm(prev => prev + dist / 1000);
//         }
//         setLastCoord(driverCoords);
        
//         // ✅ FIXED: Check if driver is near pickup location - ALWAYS SHOW ALERT
//         if (pickupLocation && rideStatus === "onTheWay") {
//           const distanceToPickup = calculateDistanceInMeters(
//             driverCoords.latitude, 
//             driverCoords.longitude, 
//             pickupLocation.latitude, 
//             pickupLocation.longitude
//           );
          
//           console.log(`📍 Driver distance to pickup: ${distanceToPickup.toFixed(1)} meters`);
          
//           // ✅ FIXED: Always show alert when driver is within 50m, regardless of flag
//           if (distanceToPickup <= 50) {
//             console.log('🚨 DRIVER ARRIVED ALERT TRIGGERED');
//             setRideStatus("arrived");
//             setDriverArrivedAlertShown(true);
            
//             // ✅ Immediately update UI state
//             setNearbyDrivers(prev => {
//               if (prev.length > 0 && prev[0].driverId === data.driverId) {
//                 return [{
//                   ...prev[0],
//                   status: "arrived"
//                 }];
//               }
//               return prev;
//             });
            
//             // Get customer ID for OTP
//             AsyncStorage.getItem('customerId').then(customerId => {
//               const otp = customerId ? customerId.slice(-4) : '1234';
//               Alert.alert(
//                 "🎉 Driver Arrived!",
//                 `Our driver (${acceptedDriver.name}) has reached your pickup location.\n\nPlease share your OTP: ${otp}`,
//                 [{ text: "OK", onPress: () => {
//                   console.log('✅ User acknowledged driver arrival');
//                 }}]
//               );
//             });
//           }
//         }
        
//         // Check if driver is near dropoff location
//         if (dropoffLocation && rideStatus === "started") {
//           const distanceToDropoff = calculateDistanceInMeters(
//             driverCoords.latitude, 
//             driverCoords.longitude, 
//             dropoffLocation.latitude, 
//             dropoffLocation.longitude
//           );
          
//           if (distanceToDropoff <= 50 && !rideCompletedAlertShown) {
//             // Instead of immediately completing the ride, just notify the backend
//             // The backend will handle the actual ride completion
//             socket.emit('driverReachedDestination', {
//               rideId: currentRideId,
//               driverId: data.driverId,
//               distance: travelledKm.toFixed(2)
//             });
            
//             // Set a flag to prevent multiple notifications
//             setRideCompletedAlertShown(true);
//           }
//         }
//         return; // Ignore other drivers during active ride
//       }
      
//       // If no active ride, update all drivers
//       setNearbyDrivers((prev) => {
//         const existingIndex = prev.findIndex(d => d.driverId === data.driverId);
//         if (existingIndex >= 0) {
//           const updated = [...prev];
//           updated[existingIndex] = {
//             ...updated[existingIndex],
//             location: { coordinates: [data.lng, data.lat] },
//             status: data.status || "Live"
//           };
//           return updated;
//         } else {
//           if (data.status && !["Live", "online", "onRide", "available"].includes(data.status)) return prev;
//           return [
//             ...prev,
//             {
//               driverId: data.driverId,
//               name: `Driver ${data.driverId}`,
//               location: { coordinates: [data.lng, data.lat] },
//               vehicleType: "taxi",
//               status: data.status || "Live"
//             }
//           ];
//         }
//       });
//     };
    
//     socket.on("driverLiveLocationUpdate", handleDriverLiveLocationUpdate);
//     return () => socket.off("driverLiveLocationUpdate", handleDriverLiveLocationUpdate);
//   }, [location, currentRideId, acceptedDriver, lastCoord, pickupLocation, dropoffLocation, rideStatus, driverArrivedAlertShown, rideCompletedAlertShown]);

//   // ✅ NEW: Dedicated driver arrival checker interval
//   useEffect(() => {
//     // Clear any existing interval
//     if (driverArrivalCheckInterval.current) {
//       clearInterval(driverArrivalCheckInterval.current);
//     }

//     // Start checking driver arrival when ride is onTheWay
//     if (rideStatus === "onTheWay" && driverLocation && pickupLocation && !driverArrivedAlertShown) {
//       console.log('🔍 Starting driver arrival checker interval');
      
//       driverArrivalCheckInterval.current = setInterval(() => {
//         if (driverLocation && pickupLocation && rideStatus === "onTheWay" && !driverArrivedAlertShown) {
//           const distanceToPickup = calculateDistanceInMeters(
//             driverLocation.latitude,
//             driverLocation.longitude,
//             pickupLocation.latitude,
//             pickupLocation.longitude
//           );
          
//           console.log(`🔍 Interval check - Driver distance to pickup: ${distanceToPickup.toFixed(1)} meters`);
          
//           if (distanceToPickup <= 50) {
//             console.log('🚨 DRIVER ARRIVED ALERT TRIGGERED FROM INTERVAL CHECKER');
//             setRideStatus("arrived");
//             setDriverArrivedAlertShown(true);
            
//             // Clear the interval
//             if (driverArrivalCheckInterval.current) {
//               clearInterval(driverArrivalCheckInterval.current);
//               driverArrivalCheckInterval.current = null;
//             }
            
//             // Show alert
//             AsyncStorage.getItem('customerId').then(customerId => {
//               const otp = customerId ? customerId.slice(-4) : '1234';
//               Alert.alert(
//                 "🎉 Driver Arrived!",
//                 `Our driver (${acceptedDriver?.name || 'Driver'}) has reached your pickup location.\n\nPlease share your OTP: ${otp}`,
//                 [{ text: "OK", onPress: () => {
//                   console.log('✅ User acknowledged driver arrival');
//                 }}]
//               );
//             });
//           }
//         }
//       }, 2000); // Check every 2 seconds
//     }

//     return () => {
//       if (driverArrivalCheckInterval.current) {
//         clearInterval(driverArrivalCheckInterval.current);
//         driverArrivalCheckInterval.current = null;
//       }
//     };
//   }, [rideStatus, driverLocation, pickupLocation, driverArrivedAlertShown, acceptedDriver]);

//   // ✅ NEW: Ride completion event handler
//   useEffect(() => {
//     const handleRideCompleted = (data: any) => {
//       console.log('🎉 Ride completed event received:', data);
      
//       // Update ride status to completed
//       setRideStatus("completed");
      
//       // Calculate final distance and time if not provided
//       const finalDistance = data.distance || travelledKm.toFixed(2);
//       const finalTime = data.travelTime || travelTime;
//       const finalCharge = data.charge || estimatedPrice;
      
//       // Show completion alert
//       Alert.alert(
//         "Ride Completed",
//         `Thank you for choosing EAZYGO!\n\nDistance: ${finalDistance} km\nTravel Time: ${finalTime}\nCharge: ₹${finalCharge}`,
//         [
//           { 
//             text: "OK", 
//             onPress: () => {
//               // Reset ride state after completion
//               setTimeout(() => {
//                 setCurrentRideId(null);
//                 setDriverId(null);
//                 setDriverLocation(null);
//                 setAcceptedDriver(null);
//                 setRouteCoords([]);
//                 setPickupLocation(null);
//                 setDropoffLocation(null);
//                 propHandlePickupChange("");
//                 propHandleDropoffChange("");
//                 setRideStatus("idle");
//                 setDriverArrivedAlertShown(false);
//                 setRideCompletedAlertShown(false);
                
//                 // Fetch all drivers again after ride completion
//                 if (location) {
//                   fetchNearbyDrivers(location.latitude, location.longitude);
//                 }
//               }, 2000);
//             }
//           }
//         ]
//       );
      
//       // Clear ride data from storage
//       AsyncStorage.removeItem('currentRideId');
//       AsyncStorage.removeItem('acceptedDriver');
//       AsyncStorage.removeItem('bookedAt');
//       setBookedAt(null);
//     };
    
//     socket.on("rideCompleted", handleRideCompleted);
    
//     return () => {
//       socket.off("rideCompleted", handleRideCompleted);
//     };
//   }, [travelledKm, travelTime, estimatedPrice, location]);

//   // ✅ NEW: Ride status update handler
//   useEffect(() => {
//     const handleRideStatusUpdate = (data: any) => {
//       console.log('📋 Ride status update received:', data);
      
//       if (data.rideId === currentRideId) {
//         if (data.status === 'completed') {
//           // Handle ride completion
//           setRideStatus("completed");
          
//           // Calculate final distance and time if not provided
//           const finalDistance = data.distance || travelledKm.toFixed(2);
//           const finalTime = data.travelTime || travelTime;
//           const finalCharge = data.charge || estimatedPrice;
          
//           // Show completion alert
//           Alert.alert(
//             "Ride Completed",
//             `Thank you for choosing EAZYGO!\n\nDistance: ${finalDistance} km\nTravel Time: ${finalTime}\nCharge: ₹${finalCharge}`,
//             [
//               { 
//                 text: "OK", 
//                 onPress: () => {
//                   // Reset ride state after completion
//                   setTimeout(() => {
//                     setCurrentRideId(null);
//                     setDriverId(null);
//                     setDriverLocation(null);
//                     setAcceptedDriver(null);
//                     setRouteCoords([]);
//                     setPickupLocation(null);
//                     setDropoffLocation(null);
//                     propHandlePickupChange("");
//                     propHandleDropoffChange("");
//                     setRideStatus("idle");
//                     setDriverArrivedAlertShown(false);
//                     setRideCompletedAlertShown(false);
                    
//                     // Fetch all drivers again after ride completion
//                     if (location) {
//                       fetchNearbyDrivers(location.latitude, location.longitude);
//                     }
//                   }, 2000);
//                 }
//               }
//             ]
//           );
          
//           // Clear ride data from storage
//           AsyncStorage.removeItem('currentRideId');
//           AsyncStorage.removeItem('acceptedDriver');
//           AsyncStorage.removeItem('bookedAt');
//           setBookedAt(null);
//         }
//       }
//     };
    
//     socket.on("rideStatusUpdate", handleRideStatusUpdate);
    
//     return () => {
//       socket.off("rideStatusUpdate", handleRideStatusUpdate);
//     };
//   }, [currentRideId, travelledKm, travelTime, estimatedPrice, location]);

//   useEffect(() => {
//     const handleDriverOffline = (data: { driverId: string }) => {
//       console.log(`Driver ${data.driverId} went offline`);
      
//       // ✅ Don't remove accepted driver during active ride
//       if (currentRideId && acceptedDriver && data.driverId === acceptedDriver.driverId) {
//         console.log('⚠️ Accepted driver went offline during active ride');
//         return;
//       }
      
//       setNearbyDrivers(prev => prev.filter(driver => driver.driverId !== data.driverId));
//       setNearbyDriversCount(prev => Math.max(0, prev - 1));
//     };
    
//     socket.on("driverOffline", handleDriverOffline);
//     return () => socket.off("driverOffline", handleDriverOffline);
//   }, [currentRideId, acceptedDriver]);

//   useEffect(() => {
//     const handleDriverStatusUpdate = (data: { driverId: string; status: string }) => {
//       console.log(`Driver ${data.driverId} status updated to: ${data.status}`);
      
//       // ✅ Don't update accepted driver status during active ride
//       if (currentRideId && acceptedDriver && data.driverId === acceptedDriver.driverId) {
//         console.log('Keeping accepted driver status as onTheWay');
//         return;
//       }
      
//       if (data.status === "offline") {
//         setNearbyDrivers(prev => prev.filter(driver => driver.driverId !== data.driverId));
//         setNearbyDriversCount(prev => Math.max(0, prev - 1));
//         return;
//       }
//       setNearbyDrivers(prev => prev.map(driver => 
//         driver.driverId === data.driverId ? { ...driver, status: data.status } : driver
//       ));
//     };
    
//     socket.on("driverStatusUpdate", handleDriverStatusUpdate);
//     return () => socket.off("driverStatusUpdate", handleDriverStatusUpdate);
//   }, [currentRideId, acceptedDriver]);

//   // ✅ BACKUP: Recover ride acceptance data on component mount
//   useEffect(() => {
//     const recoverRideData = async () => {
//       try {
//         const savedRideId = await AsyncStorage.getItem('currentRideId');
//         const savedDriverData = await AsyncStorage.getItem('acceptedDriver');
        
//         if (savedRideId && !currentRideId) {
//           console.log('🔄 Recovering ride data from storage:', savedRideId);
//           setCurrentRideId(savedRideId);
          
//           if (savedDriverData) {
//             const driverData = JSON.parse(savedDriverData);
//             setAcceptedDriver(driverData);
//             setDriverName(driverData.name);
//             setDriverMobile(driverData.driverMobile);
//             setRideStatus("onTheWay");
//           } else {
//             setRideStatus("searching");
//             const bookedStr = await AsyncStorage.getItem('bookedAt');
//             setBookedAt(bookedStr ? new Date(bookedStr) : new Date());
//             // Restart polling
//             const pollInterval = setInterval(() => {
//               if (currentRideId) {
//                 socket.emit('getRideStatus', { rideId: currentRideId });
//               }
//             }, 5000);
//             AsyncStorage.setItem('statusPollInterval', pollInterval.toString());

//             // Restart timeout (increased to 60s)
//             const acceptanceTimeout = setTimeout(() => {
//               if (rideStatus === "searching") {
//                 Alert.alert(
//                   "No Driver Available", 
//                   "No driver has accepted your ride yet. Please try again or wait longer.",
//                   [{ text: "OK", onPress: () => setRideStatus("idle") }]
//                 );
//               }
//             }, 60000);
//             AsyncStorage.setItem('acceptanceTimeout', acceptanceTimeout.toString());
//           }
          
//           // Request ride status from server
//           socket.emit('getRideStatus', { rideId: savedRideId });
//         }
//       } catch (error) {
//         console.error('Error recovering ride data:', error);
//       }
//     };
    
//     recoverRideData();
//   }, []);

//   const processRideAcceptance = useCallback((data: any) => {
//     console.log('🎯 PROCESSING RIDE ACCEPTANCE:', JSON.stringify(data, null, 2));
    
//     // Validate required data
//     if (!data.rideId || !data.driverId) {
//       console.error('❌ Invalid ride acceptance data:', data);
//       return;
//     }

//     // Clear existing timeouts and intervals
//     AsyncStorage.getItem('statusPollInterval').then(id => {
//       if (id) {
//         clearInterval(parseInt(id));
//         AsyncStorage.removeItem('statusPollInterval');
//       }
//     });

//     // Update ride status immediately
//     setRideStatus("onTheWay");
//     setDriverId(data.driverId);
//     setDriverName(data.driverName || 'Driver');
//     setDriverMobile(data.driverMobile || 'N/A');
//     setCurrentRideId(data.rideId);

//     // Create accepted driver object
//     const acceptedDriverData: DriverType = {
//       driverId: data.driverId,
//       name: data.driverName || 'Driver',
//       driverMobile: data.driverMobile || 'N/A',
//       location: {
//         coordinates: [data.driverLng || 0, data.driverLat || 0]
//       },
//       vehicleType: data.vehicleType || selectedRideType,
//       status: "onTheWay"
//     };

//     console.log('👨‍💼 Setting accepted driver:', acceptedDriverData);
    
//     // Update state
//     setAcceptedDriver(acceptedDriverData);
//     setNearbyDrivers([acceptedDriverData]);
//     setNearbyDriversCount(1);

//     // Set initial driver location
//     if (data.driverLat && data.driverLng) {
//       const driverLoc = {
//         latitude: data.driverLat,
//         longitude: data.driverLng
//       };
//       setDriverLocation(driverLoc);
//       console.log('📍 Initial driver location set:', driverLoc);
//     }

//     // Store in AsyncStorage for recovery
//     AsyncStorage.setItem('currentRideId', data.rideId);
//     AsyncStorage.setItem('acceptedDriver', JSON.stringify(acceptedDriverData));
    
//     console.log('✅ Ride acceptance processed successfully for:', data.rideId);
//   }, [selectedRideType]);

//   // Global ride acceptance listener
//   useEffect(() => {
//     console.log('🎯 Setting up GLOBAL ride acceptance listener');

//     const handleRideAccepted = (data: any) => {
//       console.log('🚨 ===== USER APP: RIDE ACCEPTED ====');
//       console.log('📦 Acceptance data:', JSON.stringify(data, null, 2));
//       console.log('🚨 ===== END ACCEPTANCE DATA ====');
//       processRideAcceptance(data);
//     };

//     // Listen on multiple channels
//     socket.on("rideAccepted", handleRideAccepted);
    
//     // Fixed: Proper async handling
//     socket.on("rideAcceptedBroadcast", async (data) => {
//       try {
//         const userId = await AsyncStorage.getItem('userId');
//         if (data.targetUserId === userId) {
//           handleRideAccepted(data);
//         }
//       } catch (error) {
//         console.error('Error checking user ID:', error);
//       }
//     });

//     return () => {
//       socket.off("rideAccepted", handleRideAccepted);
//       socket.off("rideAcceptedBroadcast", handleRideAccepted);
//     };
//   }, [processRideAcceptance]);

//   // ✅ CRITICAL: Add these missing socket event handlers
//   useEffect(() => {
//     console.log('🔌 Setting up CRITICAL socket event handlers');

//     // Handle getDriverData response
//     const handleDriverDataResponse = (data: any) => {
//       console.log('🚗 Driver data received:', data);
//       if (data.success) {
//         processRideAcceptance(data);
//       }
//     };

//     // Handle getRideStatus response  
//     const handleRideStatusResponse = (data: any) => {
//       console.log('📋 Ride status received:', data);
//       if (data.driverId) {
//         processRideAcceptance(data);
//       }
//     };

//     // Handle backup ride acceptance
//     const handleBackupRideAccepted = (data: any) => {
//       console.log('🔄 Backup ride acceptance:', data);
//       processRideAcceptance(data);
//     };

//     socket.on("driverDataResponse", handleDriverDataResponse);
//     socket.on("rideStatusResponse", handleRideStatusResponse);
//     socket.on("backupRideAccepted", handleBackupRideAccepted);

//     return () => {
//       socket.off("driverDataResponse", handleDriverDataResponse);
//       socket.off("rideStatusResponse", handleRideStatusResponse);
//       socket.off("backupRideAccepted", handleBackupRideAccepted);
//     };
//   }, [selectedRideType]);

//   // ✅ COMPREHENSIVE SOCKET DEBUGGER
//   useEffect(() => {
//     console.log('🔍 Starting comprehensive socket debugging');
    
//     // Debug all socket events
//     const debugAllEvents = (eventName: string, data: any) => {
//       if (eventName.includes('ride') || eventName.includes('driver') || eventName.includes('Room')) {
//         console.log(`📡 SOCKET EVENT [${eventName}]:`, data);
//       }
//     };

//     // Specific debug for rideAccepted
//     const debugRideAccepted = (data: any) => {
//       console.log('🚨🚨🚨 RIDE ACCEPTED EVENT RECEIVED 🚨🚨🚨');
//       console.log('📦 Data:', JSON.stringify(data, null, 2));
//       console.log('🔍 Current state:', {
//         currentRideId,
//         rideStatus,
//         hasAcceptedDriver: !!acceptedDriver
//       });
      
//       // Process immediately
//       processRideAcceptance(data);
//     };

//     // Debug connection
//     const handleConnect = () => {
//       console.log('✅ Socket connected - ID:', socket.id);
//       setSocketConnected(true);
//     };

//     const handleDisconnect = () => {
//       console.log('❌ Socket disconnected');
//       setSocketConnected(false);
//     };

//     // Add all listeners
//     socket.onAny(debugAllEvents);
//     socket.on("rideAccepted", debugRideAccepted);
//     socket.on("connect", handleConnect);
//     socket.on("disconnect", handleDisconnect);

//     console.log('🔍 Socket debuggers activated');

//     return () => {
//       socket.offAny(debugAllEvents);
//       socket.off("rideAccepted", debugRideAccepted);
//       socket.off("connect", handleConnect);
//       socket.off("disconnect", handleDisconnect);
//     };
//   }, [currentRideId, rideStatus, acceptedDriver, processRideAcceptance]);

//   // ✅ BACKUP: Manual ride status polling
//   useEffect(() => {
//     if (currentRideId && rideStatus === "searching") {
//       console.log('🔄 Starting backup polling for ride:', currentRideId);
      
//       const pollInterval = setInterval(() => {
//         console.log('📡 Polling ride status for:', currentRideId);
//         socket.emit('getRideStatus', { rideId: currentRideId }, (data) => {
//           if (data.driverId) {
//             processRideAcceptance(data);
//           } else if (bookedAt && (new Date().getTime() - bookedAt.getTime() > 60000) && rideStatus === "searching") {
//             console.log('⏰ No driver found after 60s');
//             Alert.alert(
//               "No Driver Available",
//               "No driver has accepted your ride yet. Please try again or wait longer.",
//               [{ text: "OK", onPress: () => setRideStatus("idle") }]
//             );
//             clearInterval(pollInterval);
//             AsyncStorage.removeItem('statusPollInterval');
//           }
//         });
//       }, 3000); // Poll every 3 seconds

//       // Store interval ID
//       AsyncStorage.setItem('statusPollInterval', pollInterval.toString());

//       return () => {
//         clearInterval(pollInterval);
//         AsyncStorage.removeItem('statusPollInterval');
//       };
//     }
//   }, [currentRideId, rideStatus, bookedAt]);

//   // ✅ CRITICAL: Ensure user joins their room on socket connection
//   useEffect(() => {
//     const registerUserRoom = async () => {
//       try {
//         const userId = await AsyncStorage.getItem('userId');
//         if (userId && socket.connected) {
//           console.log('👤 Registering user with socket room:', userId);
//           socket.emit('registerUser', { userId });
          
//           // Also join the room manually
//           socket.emit('joinRoom', { userId });
//         }
//       } catch (error) {
//         console.error('Error registering user room:', error);
//       }
//     };

//     // Register on connect and every 5 seconds to ensure room membership
//     socket.on('connect', registerUserRoom);
//     registerUserRoom();

//     // Re-register periodically to ensure room membership
//     const interval = setInterval(registerUserRoom, 5000);

//     return () => {
//       socket.off('connect', registerUserRoom);
//       clearInterval(interval);
//     };
//   }, []);

//   // ✅ SOCKET RECOVERY: Handle reconnection and missed events
//   useEffect(() => {
//     const handleReconnect = async () => {
//       console.log('🔌 Socket reconnected, recovering state...');
//       setSocketConnected(true);
      
//       // Re-register user
//       try {
//         const userId = await AsyncStorage.getItem('userId');
//         if (userId) {
//           socket.emit('registerUser', { userId });
//           console.log('👤 User re-registered after reconnect:', userId);
//         }
        
//         // Request current ride status if we have a ride ID
//         const currentRideId = await AsyncStorage.getItem('currentRideId');
//         if (currentRideId) {
//           socket.emit('getRideStatus', { rideId: currentRideId });
//           console.log('🔄 Requesting status for current ride:', currentRideId);
//         }
//       } catch (error) {
//         console.error('Error during socket recovery:', error);
//       }
//     };
    
//     socket.on("connect", handleReconnect);
    
//     return () => {
//       socket.off("connect", handleReconnect);
//     };
//   }, []);

//   const handleMapPress = (e: any) => {
//     const coords = e.nativeEvent.coordinate;
//     if (!pickupLocation) {
//       setPickupLocation(coords);
//       propHandlePickupChange("Pickup Selected");
//       setIsPickupCurrent(false);
//       fetchNearbyDrivers(coords.latitude, coords.longitude);
//     } else if (!dropoffLocation) {
//       setDropoffLocation(coords);
//       propHandleDropoffChange("Dropoff Selected");
//       fetchRoute(coords);
//     } else {
//       setPickupLocation(coords);
//       propHandlePickupChange("Pickup Selected");
//       setIsPickupCurrent(false);
//       setDropoffLocation(null);
//       propHandleDropoffChange("");
//       setRouteCoords([]);
//       fetchNearbyDrivers(coords.latitude, coords.longitude);
//     }
//   };

//   const fetchRoute = async (dropCoord: LocationType) => {
//     if (!pickupLocation) return;
//     try {
//       const url = `https://router.project-osrm.org/route/v1/driving/${pickupLocation.longitude},${pickupLocation.latitude};${dropCoord.longitude},${dropCoord.latitude}?overview=full&geometries=geojson`;
//       const res = await fetch(url);
//       const data = await res.json();
//       if (data.code === "Ok" && data.routes.length > 0) {
//         const coords = data.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => ({ latitude: lat, longitude: lng }));
//         setRouteCoords(coords);
//         setDistance((data.routes[0].distance / 1000).toFixed(2) + " km");
//         setTravelTime(Math.round(data.routes[0].duration / 60) + " mins");
//       } else {
//         setApiError("Failed to fetch route");
//         Alert.alert("Route Error", "Could not find route. Please try different locations.");
//       }
//     } catch (err) {
//       console.error(err);
//       setRouteCoords([]);
//       setApiError("Network error fetching route");
//       Alert.alert("Route Error", "Failed to fetch route. Please check your internet connection.");
//     }
//   };

//   const fetchSuggestions = async (query: string, type: 'pickup' | 'dropoff'): Promise<SuggestionType[]> => {
//     try {
//       console.log(`Fetching suggestions for: ${query}`);
//       const cache = type === 'pickup' ? pickupCache : dropoffCache;
//       if (cache[query]) {
//         console.log(`Returning cached suggestions for: ${query}`);
//         return cache[query];
//       }
//       if (type === 'pickup') setPickupLoading(true);
//       else setDropoffLoading(true);
//       setSuggestionsError(null);
//       const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=IN`;
//       console.log(`API URL: ${url}`);
      
//       const response = await fetch(url, {
//         headers: { 'User-Agent': 'EAZYGOApp/1.0' },
//       });
      
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//       const data = await response.json();
//       if (!Array.isArray(data)) throw new Error('Invalid response format');
      
//       const suggestions: SuggestionType[] = data.map((item: any) => ({
//         id: item.place_id || `${item.lat}-${item.lon}`,
//         name: item.display_name,
//         address: extractAddress(item),
//         lat: item.lat,
//         lon: item.lon,
//         type: item.type || 'unknown',
//         importance: item.importance || 0,
//       }));
//       if (type === 'pickup') setPickupCache(prev => ({ ...prev, [query]: suggestions }));
//       else setDropoffCache(prev => ({ ...prev, [query]: suggestions }));
//       return suggestions;
//     } catch (error: any) {
//       console.error('Suggestions fetch error:', error);
//       setSuggestionsError(error.message || 'Failed to fetch suggestions');
//       return [];
//     } finally {
//       if (type === 'pickup') setPickupLoading(false);
//       else setDropoffLoading(false);
//     }
//   };

//   const extractAddress = (item: any): string => {
//     if (item.address) {
//       const parts = [];
//       if (item.address.road) parts.push(item.address.road);
//       if (item.address.suburb) parts.push(item.address.suburb);
//       if (item.address.city || item.address.town || item.address.village) parts.push(item.address.city || item.address.town || item.address.village);
//       if (item.address.state) parts.push(item.address.state);
//       if (item.address.postcode) parts.push(item.address.postcode);
//       return parts.join(', ');
//     }
//     return item.display_name;
//   };

//   const handlePickupChange = (text: string) => {
//     console.log(`handlePickupChange called with: "${text}"`);
//     propHandlePickupChange(text);
//     if (pickupDebounceTimer.current) {
//       clearTimeout(pickupDebounceTimer.current);
//       pickupDebounceTimer.current = null;
//     }
//     if (text.length > 2) {
//       setPickupLoading(true);
//       setShowPickupSuggestions(true);
//       pickupDebounceTimer.current = setTimeout(async () => {
//         const sugg = await fetchSuggestions(text, 'pickup');
//         setPickupSuggestions(sugg);
//         setPickupLoading(false);
//       }, 500);
//     } else {
//       setShowPickupSuggestions(false);
//       setPickupSuggestions([]);
//     }
//   };

//   const handleDropoffChange = (text: string) => {
//     console.log(`handleDropoffChange called with: "${text}"`);
//     propHandleDropoffChange(text);
//     if (dropoffDebounceTimer.current) {
//       clearTimeout(dropoffDebounceTimer.current);
//       dropoffDebounceTimer.current = null;
//     }
//     if (text.length > 2) {
//       setDropoffLoading(true);
//       setShowDropoffSuggestions(true);
//       dropoffDebounceTimer.current = setTimeout(async () => {
//         const sugg = await fetchSuggestions(text, 'dropoff');
//         setDropoffSuggestions(sugg);
//         setDropoffLoading(false);
//       }, 500);
//     } else {
//       setShowDropoffSuggestions(false);
//       setDropoffSuggestions([]);
//     }
//   };

//   const selectPickupSuggestion = (suggestion: SuggestionType) => {
//     propHandlePickupChange(suggestion.name);
//     setPickupLocation({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
//     setShowPickupSuggestions(false);
//     setIsPickupCurrent(false);
//     if (dropoffLocation) fetchRoute({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
//     fetchNearbyDrivers(parseFloat(suggestion.lat), parseFloat(suggestion.lon));
//   };

//   const selectDropoffSuggestion = (suggestion: SuggestionType) => {
//     propHandleDropoffChange(suggestion.name);
//     setDropoffLocation({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
//     setShowDropoffSuggestions(false);
//     if (pickupLocation) fetchRoute({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
//   };

//   const calculatePrice = () => {
//     if (!pickupLocation || !dropoffLocation || !distance) return null;
//     const distanceKm = parseFloat(distance);
//     let baseFare = 0;
//     let perKm = 0;
//     switch (selectedRideType) {
//       case 'bike': baseFare = 20; perKm = 8; break;
//       case 'taxi': baseFare = 50; perKm = 15; break;
//       case 'port': baseFare = 80; perKm = 25; break;
//       default: baseFare = 50; perKm = 15;
//     }
//     const multiplier = wantReturn ? 2 : 1;
//     return Math.round((baseFare + (distanceKm * perKm)) * multiplier);
//   };

//   useEffect(() => {
//     if (pickupLocation && dropoffLocation && distance) {
//       const price = calculatePrice();
//       setEstimatedPrice(price);
//     }
//   }, [pickupLocation, dropoffLocation, selectedRideType, wantReturn, distance]);

//   useEffect(() => {
//     if (showPricePanel) {
//       Animated.timing(panelAnimation, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(panelAnimation, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     }
//   }, [showPricePanel]);

//   const handleRideTypeSelect = (type: string) => {
//     if (selectedRideType === type) return;
//     setSelectedRideType(type);
//     setShowPricePanel(true);
//     if (pickupLocation && dropoffLocation) {
//       const price = calculatePrice();
//       setEstimatedPrice(price);
//     }
//     if (location) {
//       fetchNearbyDrivers(location.latitude, location.longitude);
//     }
//   };

//   const handleBookRide = async () => {
//     if (isBooking) {
//       console.log('⏭️ Ride booking already in progress, skipping duplicate');
//       return;
//     }
    
//     try {
//       setIsBooking(true);
      
//       const token = await AsyncStorage.getItem('authToken');
//       if (!token) {
//         Alert.alert('Authentication Error', 'Please log in to book a ride');
//         setIsBooking(false);
//         return;
//       }

//       if (!pickupLocation || !dropoffLocation) {
//         Alert.alert('Error', 'Please select both pickup and dropoff locations');
//         setIsBooking(false);
//         return;
//       }

//       if (!estimatedPrice) {
//         Alert.alert('Error', 'Price calculation failed. Please try again.');
//         setIsBooking(false);
//         return;
//       }

//       const userId = await AsyncStorage.getItem('userId');
//       const customerId = (await AsyncStorage.getItem('customerId')) || 'U001';
//       const userName = await AsyncStorage.getItem('userName');
//       const userMobile = await AsyncStorage.getItem('userMobile');

//       let otp;
//       if (customerId && customerId.length >= 4) {
//         otp = customerId.slice(-4);
//       } else {
//         otp = Math.floor(1000 + Math.random() * 9000).toString();
//       }

//       setRideStatus('searching');
//       setBookedAt(new Date());

//       console.log('📋 User Details:', {
//         userId,
//         customerId,
//         userName,
//         userMobile,
//         pickup,
//         dropoff,
//         selectedRideType,
//         otp
//       });

//       const rideData = {
//         userId,
//         customerId,
//         userName,
//         userMobile,
//         pickup: { 
//           lat: pickupLocation.latitude, 
//           lng: pickupLocation.longitude, 
//           address: pickup,
//         },
//         drop: { 
//           lat: dropoffLocation.latitude, 
//           lng: dropoffLocation.longitude, 
//           address: dropoff,
//         },
//         vehicleType: selectedRideType,
//         otp,
//         estimatedPrice,
//         distance,
//         travelTime,
//         wantReturn,
//         token
//       };

//       socket.emit('bookRide', rideData, (response) => {
//         setIsBooking(false);
        
//         if (response && response.success) {
//           setCurrentRideId(response.rideId);
//           AsyncStorage.setItem('bookedAt', new Date().toISOString());
//           setBookingOTP(response.otp);
//           setShowConfirmModal(true);
//           setRideStatus('searching');
//           console.log('✅ Ride booked successfully:', response);
//         } else {
//           Alert.alert('Booking Failed', response?.message || 'Failed to book ride');
//           setRideStatus('idle');
//           setCurrentRideId(null);
//         }
//       });

//     } catch (error) {
//       setIsBooking(false);
//       console.error('Booking error:', error);
//       Alert.alert('Booking Failed', 'An unexpected error occurred. Please try again.');
//       setRideStatus('idle');
//       setCurrentRideId(null);
//     }
//   };

//   // Add this useEffect to debug real-time events
//   useEffect(() => {
//     console.log('🎯 Setting up real-time event listeners');
    
//     // Listen for all socket events for debugging
//     const handler = (eventName: string, ...args: any[]) => {
//       if (eventName.includes('driver') || eventName.includes('location')) {
//         console.log('📡 Socket event:', eventName, args);
//       }
//     };

//     socket.onAny(handler);

//     return () => {
//       socket.offAny(handler);
//     };
//   }, []);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const token = await AsyncStorage.getItem('authToken');
//         if (!token) return;

//         const backendUrl = getBackendUrl();
//         const response = await axios.get(`${backendUrl}/api/users/profile`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
        
//         const userProfile = response.data;
        
//         console.log('📋 User Profile:', userProfile);
        
//         const userMobile = userProfile.mobile || 
//                            userProfile.phone || 
//                            userProfile.phoneNumber || 
//                            userProfile.mobileNumber || 
//                            '';

//         await AsyncStorage.setItem('userId', userProfile._id);
//         await AsyncStorage.setItem('customerId', userProfile.customerId || userProfile._id);
//         await AsyncStorage.setItem('userName', userProfile.name || userProfile.username);
//         await AsyncStorage.setItem('userMobile', userProfile.phoneNumber);
//         await AsyncStorage.setItem('userAddress', userProfile.address || '');
        
//       } catch (error) {
//         console.error('Error fetching user data:', error);
//       }
//     };

//     fetchUserData();
//   }, []);

//   useEffect(() => {
//     const handleRideCreated = (data) => {
//       console.log('Ride created event received:', data);
//       if (data.success) {

//         if (data.rideId && !currentRideId) {
//           setCurrentRideId(data.rideId);
//         }
        
//         AsyncStorage.setItem('lastRideId', data.rideId || currentRideId || '');
        
//         setBookingOTP(data.otp);
//         setShowConfirmModal(true);
//         setRideStatus("searching");
//       } else if (data.message) {
//         Alert.alert("Booking Failed", data.message || "Failed to book ride");
//         setRideStatus("idle");
//         setCurrentRideId(null);
//       }
//     };

//     socket.on("rideCreated", handleRideCreated);

//     return () => {
//       socket.off("rideCreated", handleRideCreated);
//     };
//   }, [currentRideId]);

//   const handleConfirmBooking = async () => {
//     console.log('Confirming booking with OTP:', bookingOTP);
//     console.log('Current Ride ID:', currentRideId);

//     let rideIdToUse = currentRideId;
    
//     if (!rideIdToUse) {
//       rideIdToUse = await AsyncStorage.getItem('currentRideId');
//       console.log('🔄 Using rideId from storage:', rideIdToUse);
//     }
    
//     if (!rideIdToUse) {
//       Alert.alert("Error", "Invalid booking state. Please try booking again.");
//       setShowConfirmModal(false);
//       return;
//     }
    
//     setCurrentRideId(rideIdToUse);
//     setRideStatus("searching"); // Change to "searching" first
//     setShowConfirmModal(false);
    
//     console.log('🚀 Waiting for driver to accept ride:', rideIdToUse);
    
//     // Start polling for ride status updates
//     const statusPollInterval = setInterval(() => {
//       if (currentRideId) {
//         socket.emit('getRideStatus', { rideId: currentRideId });
//       }
//     }, 5000); // Poll every 5 seconds
    
//     AsyncStorage.setItem('statusPollInterval', statusPollInterval.toString());
//   };

//   // ✅ UPDATED: Custom vehicle icon renderer with updated TaxiIcon
//   const renderVehicleIcon = (type: 'bike' | 'taxi' | 'port', size: number = 24, color: string = '#000000') => {
//     try {
//       switch (type) {
//         case 'bike': 
//           return <BikeIcon width={size} height={size} fill={color} />;
//         case 'taxi': 
//           return <TaxiIcon width={size} height={size} fill={color} />; // Updated to use TaxiIcon SVG
//         case 'port': 
//           return <LorryIcon width={size} height={size} fill={color} />;
//         default: 
//           return <TaxiIcon width={size} height={size} fill={color} />;
//       }
//     } catch (error) {
//       console.error('Error rendering vehicle icon:', error);
//       return <TaxiIcon width={size} height={size} fill={color} />;
//     }
//   };

//   // ✅ NEW: Custom person icon renderer
//   const renderPersonIcon = (size: number = 30, color: string = '#4285F4') => {
//     try {
//       return <PersonIcon width={size} height={size} fill={color} />;
//     } catch (error) {
//       console.error('Error rendering person icon:', error);
//       return (
//         <MaterialIcons name="person" size={size} color={color} />
//       );
//     }
//   };

//   const renderSuggestionItem = (item: SuggestionType, onSelect: () => void, key: string) => {
//     let iconName = 'location-on';
//     let iconColor = '#A9A9A9';
//     if (item.type.includes('railway') || item.type.includes('station')) { iconName = 'train'; iconColor = '#3F51B5'; }
//     else if (item.type.includes('airport')) { iconName = 'flight'; iconColor = '#2196F3'; }
//     else if (item.type.includes('bus')) { iconName = 'directions-bus'; iconColor = '#FF9800'; }
//     else if (item.type.includes('hospital')) { iconName = 'local-hospital'; iconColor = '#F44336'; }
//     else if (item.type.includes('school') || item.type.includes('college')) { iconName = 'school'; iconColor = '#4CAF50'; }
//     else if (item.type.includes('place_of_worship')) { iconName = 'church'; iconColor = '#9C27B0'; }
//     else if (item.type.includes('shop') || item.type.includes('mall')) { iconName = 'shopping-mall'; iconColor = '#E91E63'; }
//     else if (item.type.includes('park')) { iconName = 'park'; iconColor = '#4CAF50'; }
    
//     return (
//       <TouchableOpacity key={key} style={styles.suggestionItem} onPress={onSelect}>
//         <MaterialIcons name={iconName as any} size={20} color={iconColor} style={styles.suggestionIcon} />
//         <View style={styles.suggestionTextContainer}>
//           <Text style={styles.suggestionMainText} numberOfLines={1}>{extractMainName(item.name)}</Text>
//           <Text style={styles.suggestionSubText} numberOfLines={1}>{item.address}</Text>
//         </View>
//       </TouchableOpacity>
//     );
//   };
  
//   const extractMainName = (fullName: string): string => {
//     const parts = fullName.split(',');
//     return parts[0].trim();
//   };
  
//   const isBookRideButtonEnabled = pickup && dropoff && selectedRideType && estimatedPrice !== null;
  
//   // ✅ UPDATED: RideTypeSelector component with custom icons
//   const RideTypeSelector = ({ selectedRideType, setSelectedRideType, estimatedPrice, distance }) => {
//     return (
//       <View style={styles.rideTypeContainer}>
//         {/* Porter Button */}
//         <TouchableOpacity
//           style={[
//             styles.rideTypeButton,
//             selectedRideType === 'port' && styles.selectedRideTypeButton,
//           ]}
//           onPress={() => setSelectedRideType('port')}
//         >
//           <View style={styles.rideIconContainer}>
//             {renderVehicleIcon('port', 24, selectedRideType === 'port' ? '#FFFFFF' : '#333333')}
//           </View>
//           <View style={styles.rideInfoContainer}>
//             <Text style={[
//               styles.rideTypeText,
//               selectedRideType === 'port' && styles.selectedRideTypeText,
//             ]}>CarGo Porter</Text>
//             <Text style={[
//               styles.rideDetailsText,
//               selectedRideType === 'port' && styles.selectedRideDetailsText,
//             ]}>Max 5 ton</Text>
//             <Text style={styles.ridePriceText}>Price</Text>
//           </View>
//         </TouchableOpacity>
        
//         {/* Taxi Button */}
//         <TouchableOpacity
//           style={[
//             styles.rideTypeButton,
//             selectedRideType === 'taxi' && styles.selectedRideTypeButton,
//           ]}
//           onPress={() => setSelectedRideType('taxi')}
//         >
//           <View style={styles.rideIconContainer}>
//             {renderVehicleIcon('taxi', 24, selectedRideType === 'taxi' ? '#FFFFFF' : '#333333')}
//           </View>
//           <View style={styles.rideInfoContainer}>
//             <Text style={[
//               styles.rideTypeText,
//               selectedRideType === 'taxi' && styles.selectedRideTypeText,
//             ]}>Taxi</Text>
//             <Text style={[
//               styles.rideDetailsText,
//               selectedRideType === 'taxi' && styles.selectedRideDetailsText,
//             ]}>4 seats</Text>
//             <Text style={styles.ridePriceText}>
//               {selectedRideType === 'taxi' && estimatedPrice ? `₹${estimatedPrice}` : 'Price'}
//             </Text>
//           </View>
//         </TouchableOpacity>
        
//         {/* Bike Button */}
//         <TouchableOpacity
//           style={[
//             styles.rideTypeButton,
//             selectedRideType === 'bike' && styles.selectedRideTypeButton,
//           ]}
//           onPress={() => setSelectedRideType('bike')}
//         >
//           <View style={styles.rideIconContainer}>
//             {renderVehicleIcon('bike', 24, selectedRideType === 'bike' ? '#FFFFFF' : '#333333')}
//           </View>
//           <View style={styles.rideInfoContainer}>
//             <Text style={[
//               styles.rideTypeText,
//               selectedRideType === 'bike' && styles.selectedRideTypeText,
//             ]}>Motorcycle</Text>
//             <Text style={[
//               styles.rideDetailsText,
//               selectedRideType === 'bike' && styles.selectedRideDetailsText,
//             ]}>1 person</Text>
//             <Text style={styles.ridePriceText}>
//               {selectedRideType === 'bike' && estimatedPrice ? `₹${estimatedPrice}` : 'Price'}
//             </Text>
//           </View>
//         </TouchableOpacity>
//       </View>
//     );
//   };
  
//   return (
//     <View style={styles.container}>
//       {isLoadingLocation ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#4CAF50" />
//           <Text style={styles.loadingText}>Fetching your location...</Text>
//         </View>
//       ) : (
//         <>
//           <View style={styles.mapContainer}>
//             <MapView
//               ref={mapRef}
//               style={styles.map}
//               region={{
//                 latitude: location?.latitude || 11.018,
//                 longitude: location?.longitude || 77.012,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01
//               }}
//               // ✅ REMOVED: showsUserLocation prop to remove default blue dot
//               onPress={handleMapPress}
//             >
//               {/* ✅ NEW: User location marker - Always visible */}
//               {location && (
//                 <Marker 
//                   coordinate={location} 
//                   title="Your Location"
//                   description="Current location"
//                   key={`user-location-${location.latitude}-${location.longitude}`}
//                 >
//                   <View style={styles.userLocationMarker}>
//                     {renderPersonIcon(30, '#4285F4')}
//                   </View>
//                 </Marker>
//               )}
              
//               {/* ✅ UPDATED: Blue pickup marker - Shows after first click/input */}
//               {pickupLocation && (
//                 <Marker 
//                   coordinate={pickupLocation} 
//                   title="Pickup"
//                   pinColor="blue"
//                   key={`pickup-${pickupLocation.latitude}-${pickupLocation.longitude}`}
//                 />
//               )}
              
//               {/* ✅ UPDATED: Red dropoff marker - Shows after second click/input */}
//               {dropoffLocation && (
//                 <Marker 
//                   coordinate={dropoffLocation} 
//                   title="Dropoff"
//                   pinColor="red"
//                   key={`dropoff-${dropoffLocation.latitude}-${dropoffLocation.longitude}`}
//                 />
//               )}
              
//               {/* ✅ UPDATED: Driver marker without background */}
//               {driverLocation && (
//                 <Marker 
//                   coordinate={driverLocation} 
//                   title="Driver"
//                   key={`driver-${driverLocation.latitude}-${driverLocation.longitude}-${Date.now()}`}
//                 >
//                   <View style={styles.driverMarkerContainer}>
//                     {renderVehicleIcon(selectedRideType as 'bike' | 'taxi' | 'port', 30, '#000000')}
//                   </View>
//                 </Marker>
//               )}

//               {/* ✅ UPDATED: Nearby drivers without background */}
//               {(rideStatus === "idle" || rideStatus === "searching") && nearbyDrivers.map((driver) => (
//                 <Marker
//                   key={`nearby-${driver.driverId}-${driver.location.coordinates[1]}-${driver.location.coordinates[0]}-${Date.now()}`}
//                   coordinate={{
//                     latitude: driver.location.coordinates[1],
//                     longitude: driver.location.coordinates[0],
//                   }}
//                   title={`${driver.name} (${driver.status || 'Live'})`}
//                 >
//                   <View style={styles.driverMarkerContainer}>
//                     {renderVehicleIcon(selectedRideType as 'bike' | 'taxi' | 'port', 30, '#000000')}
//                   </View>
//                 </Marker>
//               ))}

//               {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#4CAF50" />}
//             </MapView>
            
//             {/* ✅ CORRECTED: Driver count display based on ride status */}
//             {(rideStatus === "idle" || rideStatus === "searching") && (
//               <View style={styles.driversCountOverlay}>
//                 <Text style={styles.driversCountText}>
//                   Available {selectedRideType.toUpperCase()}s Nearby: {nearbyDriversCount}
//                 </Text>
//               </View>
//             )}

//             {/* ✅ ACTIVE RIDE: Show driver status */}
//             {(rideStatus === "onTheWay" || rideStatus === "arrived" || rideStatus === "started") && (
//               <View style={styles.driversCountOverlay}>
//                 <Text style={styles.driversCountText}>
//                   Your {selectedRideType.toUpperCase()} Driver is on the way
//                 </Text>
//               </View>
//             )}
//           </View>

//           {/* Driver Info Section */}
//           {acceptedDriver && (
//             <View style={styles.driverInfoContainer}>
//               <Text style={styles.driverInfoTitle}>Your Driver</Text>
//               <View style={styles.driverDetailsRow}>
//                 <MaterialIcons name="person" size={20} color="#4CAF50" />
//                 <Text style={styles.driverDetailText}>{acceptedDriver.name}</Text>
//               </View>
//               <View style={styles.driverDetailsRow}>
//                 <MaterialIcons name="phone" size={20} color="#4CAF50" />
//                 <Text style={styles.driverDetailText}>{acceptedDriver.driverMobile || 'N/A'}</Text>
//               </View>
//               <View style={styles.driverDetailsRow}>
//                 <MaterialIcons name="directions-car" size={20} color="#4CAF50" />
//                 <Text style={styles.driverDetailText}>{acceptedDriver.vehicleType}</Text>
//               </View>
//             </View>
//           )}

//           {/* Status Indicator */}
//           {/* ✅ ACTIVE RIDE: Show driver status based on actual ride status */}
//           {rideStatus === "onTheWay" && (
//             <View style={styles.driversCountOverlay}>
//               <Text style={styles.driversCountText}>
//                 Driver is on the way
//                 {driverLocation && pickupLocation && (
//                   <Text style={styles.distanceText}>
//                     {"\n"}Estimated arrival: {calculateDistance(
//                       pickupLocation.latitude,
//                       pickupLocation.longitude,
//                       driverLocation.latitude,
//                       driverLocation.longitude
//                     ).toFixed(1)} km away
//                   </Text>
//                 )}
//               </Text>
//             </View>
//           )}

//           {rideStatus === "arrived" && (
//             <View style={[styles.driversCountOverlay, { backgroundColor: '#4CAF50' }]}>
//               <Text style={[styles.driversCountText, { color: '#FFFFFF' }]}>
//                 🎉 Driver Has Arrived!
//               </Text>
//             </View>
//           )}

//           {rideStatus === "started" && (
//             <View style={styles.driversCountOverlay}>
//               <Text style={styles.driversCountText}>
//                 Ride in Progress...
//               </Text>
//             </View>
//           )}

//           <View style={styles.inputContainer}>
//             <View style={styles.inputWrapper}>
//               <View style={styles.inputIconContainer}>
//                 <MaterialIcons name="my-location" size={20} color="#4CAF50" />
//               </View>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Pickup Location"
//                 value={pickup}
//                 onChangeText={handlePickupChange}
//                 placeholderTextColor="#999"
//               />
//             </View>
            
//             {showPickupSuggestions && (
//               <View style={styles.suggestionsContainer}>
//                 {pickupLoading ? (
//                   <View style={styles.loadingContainer}>
//                     <ActivityIndicator size="small" color="#4CAF50" />
//                     <Text style={styles.loadingText}>Loading suggestions...</Text>
//                   </View>
//                 ) : suggestionsError ? (
//                   <View style={styles.errorContainer}>
//                     <Text style={styles.errorText}>{suggestionsError}</Text>
//                   </View>
//                 ) : pickupSuggestions.length > 0 ? (
//                   pickupSuggestions.map((item) => (
//                     renderSuggestionItem(item, () => selectPickupSuggestion(item), item.id)
//                   ))
//                 ) : (
//                   <View style={styles.noSuggestionsContainer}>
//                     <Text style={styles.noSuggestionsText}>No suggestions found</Text>
//                   </View>
//                 )}
//               </View>
//             )}
            
//             <View style={styles.inputWrapper}>
//               <View style={styles.inputIconContainer}>
//                 <MaterialIcons name="place" size={20} color="#F44336" />
//               </View>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Dropoff Location"
//                 value={dropoff}
//                 onChangeText={handleDropoffChange}
//                 placeholderTextColor="#999"
//               />
//             </View>
            
//             {showDropoffSuggestions && (
//               <View style={styles.suggestionsContainer}>
//                 {dropoffLoading ? (
//                   <View style={styles.loadingContainer}>
//                     <ActivityIndicator size="small" color="#4CAF50" />
//                     <Text style={styles.loadingText}>Loading suggestions...</Text>
//                   </View>
//                 ) : suggestionsError ? (
//                   <View style={styles.errorContainer}>
//                     <Text style={styles.errorText}>{suggestionsError}</Text>
//                   </View>
//                 ) : dropoffSuggestions.length > 0 ? (
//                   dropoffSuggestions.map((item) => (
//                     renderSuggestionItem(item, () => selectDropoffSuggestion(item), item.id)
//                   ))
//                 ) : (
//                   <View style={styles.noSuggestionsContainer}>
//                     <Text style={styles.noSuggestionsText}>No suggestions found</Text>
//                   </View>
//                 )}
//               </View>
//             )}
//           </View>
          
//           {(distance || travelTime) && (
//             <View style={styles.distanceTimeContainer}>
//               <View style={styles.distanceTimeItem}>
//                 <MaterialIcons name="route" size={18} color="#757575" />
//                 <Text style={styles.distanceTimeLabel}>DISTANCE:</Text>
//                 <Text style={styles.distanceTimeValue}>{distance || '---'}</Text>
//               </View>
//               <View style={styles.distanceTimeItem}>
//                 <MaterialIcons name="schedule" size={18} color="#757575" />
//                 <Text style={styles.distanceTimeLabel}>TRAVEL TIME:</Text>
//                 <Text style={styles.distanceTimeValue}>{travelTime || '---'}</Text>
//               </View>
//             </View>
//           )}
          
//           {apiError && (
//             <View style={styles.errorContainer}>
//               <Text style={styles.errorText}>{apiError}</Text>
//             </View>
//           )}
          
//           <RideTypeSelector
//             selectedRideType={selectedRideType}
//             setSelectedRideType={handleRideTypeSelect}
//             estimatedPrice={estimatedPrice}
//             distance={distance}
//           />
          
//           <View style={styles.bookRideButtonContainer}>
//             <TouchableOpacity
//               style={[
//                 styles.bookRideButton,
//                 isBookRideButtonEnabled ? styles.enabledBookRideButton : styles.disabledBookRideButton,
//               ]}
//               onPress={handleBookRide}
//               disabled={!isBookRideButtonEnabled}
//             >
//               <Text style={styles.bookRideButtonText}>BOOK RIDE</Text>
//             </TouchableOpacity>
//           </View>
          
//           {showPricePanel && selectedRideType && (
//             <Animated.View
//               style={[
//                 styles.pricePanel,
//                 {
//                   transform: [{
//                     translateY: panelAnimation.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [300, 0],
//                     }),
//                   }],
//                 },
//               ]}
//             >
//               <View style={styles.panelHeader}>
//                 <Text style={styles.panelTitle}>Ride Details</Text>
//                 <TouchableOpacity onPress={() => setShowPricePanel(false)}>
//                   <MaterialIcons name="close" size={24} color="#666" />
//                 </TouchableOpacity>
//               </View>
//               <View style={styles.priceDetailsContainer}>
//                 <View style={styles.vehicleIconContainer}>
//                   {renderVehicleIcon(selectedRideType as 'bike' | 'taxi' | 'port', 40, '#000000')}
//                 </View>
//                 <View style={styles.priceInfoContainer}>
//                   <View style={styles.priceRow}>
//                     <Text style={styles.priceLabel}>Pickup:</Text>
//                     <Text style={styles.priceValue} numberOfLines={1}>{pickup || 'Not selected'}</Text>
//                   </View>
//                   <View style={styles.priceRow}>
//                     <Text style={styles.priceLabel}>Drop-off:</Text>
//                     <Text style={styles.priceValue} numberOfLines={1}>{dropoff || 'Not selected'}</Text>
//                   </View>
//                   <View style={styles.priceRow}>
//                     <Text style={styles.priceLabel}>Distance:</Text>
//                     <Text style={styles.priceValue}>{distance || '---'}</Text>
//                   </View>
//                   <View style={styles.priceRow}>
//                     <Text style={styles.priceLabel}>Price:</Text>
//                     <Text style={styles.priceValue}>₹{estimatedPrice || '---'}</Text>
//                   </View>
//                   <View style={styles.returnTripRow}>
//                     <Text style={styles.priceLabel}>Return trip:</Text>
//                     <Switch
//                       value={wantReturn}
//                       onValueChange={setWantReturn}
//                       trackColor={{ false: '#767577', true: '#4CAF50' }}
//                       thumbColor={wantReturn ? '#FFFFFF' : '#FFFFFF'}
//                     />
//                   </View>
//                 </View>
//               </View>
//               <View style={styles.bookButtonContainer}>
//                 <TouchableOpacity
//                   style={styles.bookMyRideButton}
//                   onPress={handleBookRide}
//                 >
//                   <Text style={styles.bookMyRideButtonText}>BOOK MY RIDE</Text>
//                 </TouchableOpacity>
//               </View>
//             </Animated.View>
//           )}
          
//           <Modal
//             animationType="slide"
//             transparent={true}
//             visible={showConfirmModal}
//             onRequestClose={() => setShowConfirmModal(false)}
//           >
//             <View style={styles.modalOverlay}>
//               <View style={styles.modalContainer}>
//                 <View style={styles.modalHeader}>
//                   <Text style={styles.modalTitle}>Confirm Booking</Text>
//                   <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
//                     <MaterialIcons name="close" size={24} color="#666" />
//                   </TouchableOpacity>
//                 </View>
//                 <View style={styles.modalContent}>
//                   <View style={styles.modalIconContainer}>
//                     <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
//                   </View>
//                   <Text style={styles.modalMessage}>
//                     Thank you for choosing EAZY GO!
//                   </Text>
//                   <Text style={styles.modalSubMessage}>
//                     Your ride has been successfully booked.
//                   </Text>
//                   <View style={styles.otpContainer}>
//                     <Text style={styles.otpLabel}>Your pickup OTP is:</Text>
//                     <Text style={styles.otpValue}>{bookingOTP}</Text>
//                   </View>
//                   <Text style={styles.otpWarning}>
//                     Please don't share it with anyone. Only share with our driver.
//                   </Text>
//                 </View>
//                 <View style={styles.modalButtons}>
//                   <TouchableOpacity
//                     style={styles.modalCancelButton}
//                     onPress={() => setShowConfirmModal(false)}
//                   >
//                     <Text style={styles.modalCancelButtonText}>Cancel</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={styles.modalConfirmButton}
//                     onPress={handleConfirmBooking}
//                   >
//                     <Text style={styles.modalConfirmButtonText}>Confirm</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             </View>
//           </Modal>
//         </>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F8F9FA' },
//   loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   loadingText: { color: '#6C757D', fontSize: 16, marginTop: 10, fontWeight: '500' },
//   mapContainer: { 
//     height: Dimensions.get('window').height * 0.45, 
//     width: '100%',
//     borderRadius: 20,
//     overflow: 'hidden',
//     marginBottom: 20,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     borderWidth: 1,
//     borderColor: '#E9ECEF'
//   },
//   map: { ...StyleSheet.absoluteFillObject },
//   // ✅ UPDATED: Style for user location marker - Always visible
//   userLocationMarker: {

//   },
//   driversCountOverlay: {
//     position: 'absolute',
//     bottom: 15,
//     left: 15,
//     backgroundColor: 'rgba(33, 37, 41, 0.85)',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 25,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4
//   },
//   driversCountText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
//   driverInfoContainer: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     marginHorizontal: 20,
//     marginBottom: 20,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     borderWidth: 1,
//     borderColor: '#E9ECEF'
//   },
//   driverInfoTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#212529',
//     marginBottom: 15
//   },
//   driverDetailsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12
//   },
//   driverDetailText: {
//     fontSize: 16,
//     color: '#495057',
//     marginLeft: 12,
//     fontWeight: '500'
//   },
//   statusContainer: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     marginHorizontal: 20,
//     marginBottom: 20,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     borderWidth: 1,
//     borderColor: '#E9ECEF'
//   },
//   statusIndicator: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10
//   },
//   statusText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#4CAF50',
//     marginLeft: 12
//   },
//   statusSubText: {
//     fontSize: 14,
//     color: '#6C757D',
//     textAlign: 'center'
//   },
//   inputContainer: { 
//     marginHorizontal: 20,
//     marginBottom: 20,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     borderWidth: 1,
//     borderColor: '#E9ECEF'
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#DEE2E6'
//   },
//   inputIconContainer: {
//     marginRight: 12,
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   distanceText: {
//     fontSize: 12,
//     fontWeight: 'normal',
//     color: '#666666',
//   },
//   input: { flex: 1, fontSize: 16, paddingVertical: 12, color: '#212529', fontWeight: '500' },
//   suggestionsContainer: { 
//     marginTop: 8,
//     marginHorizontal: 20,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     maxHeight: 220,
//     borderWidth: 1,
//     borderColor: '#E9ECEF'
//   },
//   suggestionItem: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     paddingVertical: 14, 
//     paddingHorizontal: 16,
//     borderBottomWidth: 1, 
//     borderBottomColor: '#DEE2E6' 
//   },
//   suggestionIcon: { marginRight: 14 },
//   suggestionTextContainer: { flex: 1 },
//   suggestionMainText: { fontSize: 16, fontWeight: '600', color: '#212529' },
//   suggestionSubText: { fontSize: 13, color: '#6C757D', marginTop: 4 },
//   noSuggestionsContainer: { paddingVertical: 14, alignItems: 'center' },
//   noSuggestionsText: { fontSize: 14, color: '#6C757D', fontWeight: '500' },
//   distanceTimeContainer: { 
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginHorizontal: 20,
//     marginBottom: 20,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     borderWidth: 1,
//     borderColor: '#E9ECEF'
//   },
//   distanceTimeItem: { flexDirection: 'row', alignItems: 'center' },
//   distanceTimeLabel: { fontSize: 14, fontWeight: '600', color: '#6C757D', marginLeft: 10 },
//   distanceTimeValue: { fontSize: 14, fontWeight: '700', color: '#212529', marginLeft: 6 },
//   rideTypeContainer: { 
//     marginHorizontal: 20, 
//     marginBottom: 20,
//   },
//   rideTypeButton: { 
//     width: '100%', 
//     flexDirection: 'row',
//     alignItems: 'center', 
//     backgroundColor: '#FFFFFF', 
//     borderRadius: 16, 
//     padding: 16,
//     marginBottom: 12,
//     elevation: 4, 
//     shadowColor: '#000', 
//     shadowOffset: { width: 0, height: 2 }, 
//     shadowOpacity: 0.1, 
//     shadowRadius: 6,
//     borderWidth: 1,
//     borderColor: '#E9ECEF'
//   },
//   selectedRideTypeButton: { 
//     backgroundColor: '#4caf50',
//     borderWidth: 2,
//     borderColor: '#4caf50'
//   },
//   rideIconContainer: {
//     marginRight: 16,
//     justifyContent: 'center',
//     alignItems: 'center'
//   },
//   rideInfoContainer: {
//     flex: 1,
//   },
//   rideTypeText: { 
//     fontSize: 18, 
//     fontWeight: '700', 
//     color: '#212529',
//     marginBottom: 4,
//   },
//   selectedRideTypeText: { 
//     color: '#FFFFFF' 
//   },
//   rideDetailsText: { 
//     fontSize: 14, 
//     color: '#6C757D',
//     marginBottom: 6,
//   },
//   selectedRideDetailsText: {
//     color: '#FFFFFF'
//   },
//   ridePriceText: { 
//     fontSize: 14, 
//     fontWeight: '700', 
//     color: '#212529',
//   },
//   bookRideButtonContainer: { 
//     marginHorizontal: 20, 
//     marginBottom: 30 
//   },
//   bookRideButton: { 
//     paddingVertical: 16, 
//     borderRadius: 16, 
//     alignItems: 'center',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8
//   },
//   enabledBookRideButton: { backgroundColor: '#4caf50' },
//   disabledBookRideButton: { backgroundColor: '#ADB5BD' },
//   bookRideButtonText: { 
//     color: '#FFFFFF', 
//     fontSize: 18, 
//     fontWeight: '700' 
//   },
//   errorContainer: { 
//     marginHorizontal: 20,
//     marginBottom: 20,
//     backgroundColor: '#FFEBEE', 
//     borderRadius: 16, 
//     padding: 20, 
//     borderLeftWidth: 4, 
//     borderLeftColor: '#F44336' 
//   },
//   errorText: { 
//     color: '#D32F2F', 
//     fontSize: 14, 
//     textAlign: 'center',
//     fontWeight: '500' 
//   },
//   pricePanel: { 
//     position: 'absolute', 
//     bottom: 0, 
//     left: 0, 
//     right: 0, 
//     backgroundColor: '#FFFFFF', 
//     borderTopLeftRadius: 24, 
//     borderTopRightRadius: 24, 
//     padding: 24, 
//     maxHeight: Dimensions.get('window').height * 0.5, 
//     elevation: 12, 
//     shadowColor: '#000', 
//     shadowOffset: { width: 0, height: -4 }, 
//     shadowOpacity: 0.2, 
//     shadowRadius: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#E9ECEF'
//   },
//   panelHeader: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     marginBottom: 20, 
//     paddingBottom: 20, 
//     borderBottomWidth: 1, 
//     borderBottomColor: '#DEE2E6' 
//   },
//   panelTitle: { 
//     fontSize: 20, 
//     fontWeight: '700', 
//     color: '#212529' 
//   },
//   priceDetailsContainer: { 
//     flexDirection: 'row', 
//     marginBottom: 20 
//   },
//   // ✅ UPDATED: Driver marker styles - No background
//   driverMarkerContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     // Removed background color and styling
//   },
//   vehicleIconContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   priceInfoContainer: { 
//     flex: 1 
//   },
//   priceRow: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     marginBottom: 12 
//   },
//   priceLabel: { 
//     fontSize: 16, 
//     fontWeight: '600', 
//     color: '#6C757D', 
//     flex: 1 
//   },
//   priceValue: { 
//     fontSize: 16, 
//     fontWeight: '700', 
//     color: '#212529', 
//     flex: 2, 
//     textAlign: 'right' 
//   },
//   returnTripRow: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     marginTop: 8 
//   },
//   bookButtonContainer: { 
//     marginTop: 12 
//   },
//   bookMyRideButton: { 
//     backgroundColor: '#4CAF50', 
//     paddingVertical: 16, 
//     borderRadius: 16, 
//     alignItems: 'center', 
//     elevation: 5, 
//     shadowColor: '#000', 
//     shadowOffset: { width: 0, height: 4 }, 
//     shadowOpacity: 0.15, 
//     shadowRadius: 8 
//   },
//   bookMyRideButtonText: { 
//     color: '#FFFFFF', 
//     fontSize: 18, 
//     fontWeight: '700' 
//   },
//   modalOverlay: { 
//     flex: 1, 
//     backgroundColor: 'rgba(0, 0, 0, 0.5)', 
//     justifyContent: 'center', 
//     alignItems: 'center' 
//   },
//   modalContainer: { 
//     width: '90%', 
//     backgroundColor: '#FFFFFF', 
//     borderRadius: 24, 
//     padding: 24, 
//     elevation: 12, 
//     shadowColor: '#000', 
//     shadowOffset: { width: 0, height: 4 }, 
//     shadowOpacity: 0.2, 
//     shadowRadius: 8 
//   },
//   modalHeader: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     marginBottom: 24 
//   },
//   modalTitle: { 
//     fontSize: 22, 
//     fontWeight: '700', 
//     color: '#212529' 
//   },
//   modalContent: { 
//     alignItems: 'center', 
//     marginBottom: 24 
//   },
//   modalIconContainer: { 
//     marginBottom: 20 
//   },
//   modalMessage: { 
//     fontSize: 20, 
//     fontWeight: '700', 
//     color: '#212529', 
//     textAlign: 'center', 
//     marginBottom: 8 
//   },
//   modalSubMessage: { 
//     fontSize: 16, 
//     color: '#495057', 
//     textAlign: 'center', 
//     marginBottom: 24 
//   },
//   otpContainer: { 
//     backgroundColor: '#F8F9FA', 
//     borderRadius: 12, 
//     padding: 20, 
//     alignItems: 'center', 
//     marginBottom: 20, 
//     width: '100%',
//     borderWidth: 1,
//     borderColor: '#DEE2E6'
//   },
//   otpLabel: { 
//     fontSize: 16, 
//     color: '#6C757D', 
//     marginBottom: 8,
//     fontWeight: '500'
//   },
//   otpValue: { 
//     fontSize: 28, 
//     fontWeight: '800', 
//     color: '#4caf50' 
//   },
//   otpWarning: { 
//     fontSize: 13, 
//     color: '#DC3545', 
//     textAlign: 'center', 
//     fontStyle: 'italic',
//     fontWeight: '500' 
//   },
//   modalButtons: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between' 
//   },
//   modalCancelButton: { 
//     flex: 1, 
//     backgroundColor: '#F8F9FA', 
//     paddingVertical: 14, 
//     borderRadius: 12, 
//     marginRight: 12, 
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#DEE2E6'
//   },
//   modalCancelButtonText: { 
//     fontSize: 16, 
//     fontWeight: '600', 
//     color: '#6C757D' 
//   },
//   modalConfirmButton: { 
//     flex: 1, 
//     backgroundColor: '#4CAF50', 
//     paddingVertical: 14, 
//     borderRadius: 12, 
//     marginLeft: 12, 
//     alignItems: 'center' 
//   },
//   modalConfirmButtonText: { 
//     fontSize: 16, 
//     fontWeight: '600', 
//     color: '#FFFFFF' 
//   },
//   vehicleMarkerContainer: { 
//     borderRadius: 20, 
//     padding: 5, 
//     elevation: 3, 
//     shadowColor: '#000', 
//     shadowOffset: { width: 0, height: 1 }, 
//     shadowOpacity: 0.3, 
//     shadowRadius: 2 
//   },
// });

// export default TaxiContent;











