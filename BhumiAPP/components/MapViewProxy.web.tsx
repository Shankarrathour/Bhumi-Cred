import React from 'react';
import { View } from 'react-native';

export type Region = any;

const MapView = React.forwardRef((props: any, ref: any) => {
  return <View {...props} ref={ref} />;
});

export const Marker = (props: any) => {
  return <View {...props} />;
};

export const Polyline = (props: any) => {
  return <View {...props} />;
};

export default MapView;
