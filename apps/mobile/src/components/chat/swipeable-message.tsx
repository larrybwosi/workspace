import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onReply?: () => void;
  onReact?: () => void;
}

export function SwipeableMessage({ children, onReply, onReact }: SwipeableMessageProps) {
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={{ flex: 1, transform: [{ scale: trans }] }}>
          <RectButton style={[styles.rightAction, styles.replyAction]} onPress={onReply}>
            <MaterialIcons name="reply" size={24} color="white" />
          </RectButton>
        </Animated.View>
        <Animated.View style={{ flex: 1, transform: [{ scale: trans }] }}>
          <RectButton style={[styles.rightAction, styles.reactAction]} onPress={onReact}>
            <MaterialIcons name="add-reaction" size={24} color="white" />
          </RectButton>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2} leftThreshold={30} rightThreshold={40}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActionContainer: {
    width: 140,
    flexDirection: 'row',
  },
  rightAction: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  replyAction: {
    backgroundColor: '#34b7f1',
  },
  reactAction: {
    backgroundColor: '#5865F2',
  },
});
