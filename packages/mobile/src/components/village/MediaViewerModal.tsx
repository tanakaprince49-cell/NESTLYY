import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { NestMedia } from '@nestly/shared';

interface MediaViewerModalProps {
  media: NestMedia[] | null;
  index: number;
  onClose: () => void;
}

function VideoModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls
          contentFit="contain"
        />
        <TouchableOpacity
          onPress={onClose}
          accessibilityLabel="Close video"
          style={[styles.closeButton, { top: insets.top + 8 }]}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export function MediaViewerModal({ media, index, onClose }: MediaViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(index);

  useEffect(() => {
    setCurrentIndex(index);
  }, [index]);

  if (!media || media.length === 0) return null;

  const currentItem = media[currentIndex];
  const isVideo = currentItem?.type === 'video';

  const imageUris = media.map((m) => ({ uri: m.url }));

  if (isVideo) {
    return <VideoModal uri={currentItem.url} onClose={onClose} />;
  }

  return (
    <ImageViewing
      images={imageUris}
      imageIndex={currentIndex}
      visible
      onRequestClose={onClose}
      onImageIndexChange={setCurrentIndex}
      backgroundColor="#000"
      swipeToCloseEnabled
      doubleTapToZoomEnabled
    />
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
  },
});
