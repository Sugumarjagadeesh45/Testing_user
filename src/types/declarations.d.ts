// /src/types/declarations.d.ts

declare module "react-native-google-places-autocomplete" {
  import * as React from "react";
  import { TextInputProps, StyleProp, TextStyle } from "react-native";

  export interface GooglePlaceData {
    description: string;
    place_id: string;
  }

  export interface GooglePlaceDetail {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }

  export interface GooglePlacesAutocompleteProps {
    placeholder?: string;
    onPress: (
      data: GooglePlaceData,
      details: GooglePlaceDetail | null
    ) => void;
    fetchDetails?: boolean;
    query: {
      key: string;
      language: string;
    };
    styles?: {
      textInput?: StyleProp<TextStyle>;
    };
    textInputProps?: TextInputProps;
  }

  export class GooglePlacesAutocomplete extends React.Component<
    GooglePlacesAutocompleteProps
  > {}

  export default GooglePlacesAutocomplete;
}

declare module "haversine-distance" {
  export default function haversine(
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
  ): number;
}
