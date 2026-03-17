// src/components/MediaPicker.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/UserContext';

// LinkedIn limits
const MAX_IMAGES = 9;
const MAX_VIDEO = 1;

/**
 * MediaPicker Component
 *
 * Lets the user attach images or a video to their LinkedIn post.
 * Calls onMediaChange(attachments) whenever the list changes.
 * Each attachment: { uri, type ('image'|'video'), mimeType, fileName, assetUrn (after upload) }
 *
 * @param {Object}   props
 * @param {Array}    props.attachments        - Current list of attachments
 * @param {function} props.onMediaChange      - Called with updated attachments array
 * @param {function} props.onUploadMedia      - Called with (uri, type) → returns { assetUrn }
 * @param {boolean}  props.disabled           - Disable picker while publishing
 */
const MediaPicker = ({ attachments = [], onMediaChange, onUploadMedia, disabled = false }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme, isDarkMode);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const hasVideo = attachments.some((a) => a.mediaType === 'video');
  const canAddImage = !hasVideo && attachments.length < MAX_IMAGES;
  const canAddVideo = attachments.length === 0;
  const canAdd = (canAddImage || canAddVideo) && !disabled;

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (!await requestPermission()) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - attachments.length,
      quality: 0.85,
    });

    if (result.canceled) return;

    const newAttachments = result.assets.map((asset) => ({
      uri: asset.uri,
      mediaType: 'image',
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `image_${Date.now()}.jpg`,
      assetUrn: null,
      uploaded: false,
    }));

    const updated = [...attachments, ...newAttachments];
    onMediaChange(updated);
    // Upload each new one
    uploadAttachments(updated, attachments.length);
  };

  const pickVideo = async () => {
    if (!await requestPermission()) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      videoMaxDuration: 600, // 10 min LinkedIn max
      quality: 1,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const newAttachment = {
      uri: asset.uri,
      mediaType: 'video',
      mimeType: asset.mimeType || 'video/mp4',
      fileName: asset.fileName || `video_${Date.now()}.mp4`,
      assetUrn: null,
      uploaded: false,
    };

    const updated = [newAttachment];
    onMediaChange(updated);
    uploadAttachments(updated, 0);
  };

  const uploadAttachments = async (allAttachments, startIndex) => {
    if (!onUploadMedia) return;

    for (let i = startIndex; i < allAttachments.length; i++) {
      const attachment = allAttachments[i];
      if (attachment.uploaded) continue;

      setUploadingIndex(i);
      try {
        const { assetUrn } = await onUploadMedia(attachment.uri, attachment.mediaType, attachment.mimeType);
        allAttachments = allAttachments.map((a, idx) =>
          idx === i ? { ...a, assetUrn, uploaded: true } : a
        );
        onMediaChange([...allAttachments]);
      } catch (error) {
        Alert.alert('Upload Failed', `Failed to upload ${attachment.fileName}. It will be retried on publish.`);
      }
      setUploadingIndex(null);
    }
  };

  const removeAttachment = (index) => {
    const updated = attachments.filter((_, i) => i !== index);
    onMediaChange(updated);
  };

  const showOptions = () => {
    if (!canAdd) return;

    const options = [];
    if (canAddImage) options.push({ text: 'Add Photo', onPress: pickImage });
    if (canAddVideo) options.push({ text: 'Add Video', onPress: pickVideo });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Attach Media', '', options);
  };

  if (attachments.length === 0) {
    return (
      <TouchableOpacity
        onPress={showOptions}
        style={styles.emptyPicker}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <View style={styles.emptyPickerIcon}>
          {/* Image icon: rectangle with mountain/sun */}
          <View style={styles.imgIconFrame}>
            <View style={styles.imgIconMountain} />
            <View style={styles.imgIconSun} />
          </View>
        </View>
        <Text style={styles.emptyPickerTitle}>Add photo or video</Text>
        <Text style={styles.emptyPickerSub}>Up to 9 images or 1 video</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {/* Thumbnails */}
        {attachments.map((attachment, index) => (
          <View key={index} style={styles.thumb}>
            {attachment.mediaType === 'image' ? (
              <Image source={{ uri: attachment.uri }} style={styles.thumbImage} />
            ) : (
              <View style={styles.thumbVideo}>
                <Image source={{ uri: attachment.uri }} style={styles.thumbImage} />
                {/* Play icon overlay */}
                <View style={styles.videoOverlay}>
                  <View style={styles.playTriangle} />
                </View>
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>VID</Text>
                </View>
              </View>
            )}

            {/* Uploading spinner */}
            {uploadingIndex === index && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}

            {/* Uploaded tick */}
            {attachment.uploaded && uploadingIndex !== index && (
              <View style={styles.uploadedBadge}>
                <View style={styles.uploadedCheck1} />
                <View style={styles.uploadedCheck2} />
              </View>
            )}

            {/* Remove button */}
            {!disabled && (
              <TouchableOpacity
                onPress={() => removeAttachment(index)}
                style={styles.removeBtn}
                activeOpacity={0.8}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <View style={styles.removeLine1} />
                <View style={styles.removeLine2} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Add more button */}
        {canAdd && (
          <TouchableOpacity onPress={showOptions} style={styles.addMoreBtn} activeOpacity={0.7}>
            <View style={styles.addMoreIcon}>
              <View style={styles.addMoreH} />
              <View style={styles.addMoreV} />
            </View>
            <Text style={styles.addMoreText}>Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Caption row */}
      <View style={styles.caption}>
        <Text style={styles.captionText}>
          {hasVideo ? '1 video attached' : `${attachments.length} of ${MAX_IMAGES} images`}
        </Text>
        {attachments.some((a) => !a.uploaded) && (
          <Text style={styles.captionUploading}>Uploading...</Text>
        )}
        {attachments.every((a) => a.uploaded) && (
          <Text style={styles.captionReady}>Ready to post</Text>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  // Empty state
  emptyPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
    backgroundColor: theme.surface,
    gap: 12,
    marginBottom: 12,
  },
  emptyPickerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: theme.surfaceHigh,
    justifyContent: 'center', alignItems: 'center',
  },
  imgIconFrame: {
    width: 18, height: 14, borderRadius: 3,
    borderWidth: 2, borderColor: theme.textMuted,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  imgIconMountain: {
    position: 'absolute', bottom: 0,
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: theme.textMuted,
  },
  imgIconSun: {
    position: 'absolute', top: 2, right: 2,
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: theme.textMuted,
  },
  emptyPickerTitle: { fontSize: 13, fontWeight: '600', color: theme.text },
  emptyPickerSub: { fontSize: 11, color: theme.textMuted, flex: 1 },

  // Strip
  container: { marginBottom: 12 },
  strip: { flexDirection: 'row', gap: 8, paddingRight: 4 },

  thumb: {
    width: 80, height: 80, borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.surfaceHigh,
    borderWidth: 1, borderColor: theme.border,
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbVideo: { width: '100%', height: '100%' },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  playTriangle: {
    width: 0, height: 0,
    borderTopWidth: 8, borderBottomWidth: 8, borderLeftWidth: 14,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    marginLeft: 4,
  },
  videoBadge: {
    position: 'absolute', bottom: 4, left: 4,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  videoBadgeText: { fontSize: 8, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // Uploading overlay
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Uploaded badge
  uploadedBadge: {
    position: 'absolute', top: 4, left: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: theme.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  uploadedCheck1: { position: 'absolute', width: 5, height: 2, backgroundColor: '#fff', borderRadius: 1, transform: [{ rotate: '45deg' }, { translateX: -2 }, { translateY: 1 }] },
  uploadedCheck2: { position: 'absolute', width: 8, height: 2, backgroundColor: '#fff', borderRadius: 1, transform: [{ rotate: '-50deg' }, { translateX: 1 }] },

  // Remove button
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  removeLine1: { position: 'absolute', width: 10, height: 1.5, backgroundColor: '#fff', borderRadius: 1, transform: [{ rotate: '45deg' }] },
  removeLine2: { position: 'absolute', width: 10, height: 1.5, backgroundColor: '#fff', borderRadius: 1, transform: [{ rotate: '-45deg' }] },

  // Add more
  addMoreBtn: {
    width: 80, height: 80, borderRadius: 12,
    borderWidth: 1.5, borderColor: theme.border,
    borderStyle: 'dashed',
    backgroundColor: theme.surface,
    justifyContent: 'center', alignItems: 'center',
    gap: 4,
  },
  addMoreIcon: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  addMoreH: { position: 'absolute', width: 20, height: 2, backgroundColor: theme.textMuted, borderRadius: 1 },
  addMoreV: { position: 'absolute', width: 2, height: 20, backgroundColor: theme.textMuted, borderRadius: 1 },
  addMoreText: { fontSize: 10, color: theme.textMuted, fontWeight: '500' },

  // Caption
  caption: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8,
  },
  captionText: { fontSize: 11, color: theme.textMuted },
  captionUploading: { fontSize: 11, color: theme.warning },
  captionReady: { fontSize: 11, color: theme.accent, fontWeight: '600' },
});

export default MediaPicker;