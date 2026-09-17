import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  message: string;
  type?: 'info' | 'encouragement' | 'recovery';
}

export const ShameResilientBanner: React.FC<Props> = ({ message, type = 'encouragement' }) => {
  return (
    <View style={[styles.container, styles[type]]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
  },
  encouragement: {
    backgroundColor: '#F4C542',
    borderColor: '#F4C542',
    borderWidth: 1,
  },
  info: {
    backgroundColor: '#EEF3F9',
    borderColor: '#9FB2C8',
    borderWidth: 1,
  },
  recovery: {
    backgroundColor: '#EEF3F9',
    borderColor: '#9FB2C8',
    borderWidth: 1,
  },
  text: {
    color: '#132c4d',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
});