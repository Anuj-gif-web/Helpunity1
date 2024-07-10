import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Image } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../../firebase/firebaseconfig';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useRoute } from '@react-navigation/native';

const categories = [
  "Environment", "Education", "Health", "Community", "Animal Welfare",
  "Human Rights", "Arts & Culture", "Sports", "Technology", "Disaster Relief"
];

const AddEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { event, isEdit } = route.params || {};
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(event ? new Date(event.date) : null);
  const [time, setTime] = useState(event ? new Date(event.time) : null);
  const [location, setLocation] = useState(event?.location || '');
  const [category, setCategory] = useState(event?.category || '');
  const [coverPhoto, setCoverPhoto] = useState(event?.coverPhoto || null);
  const [imageUrl, setImageUrl] = useState(event?.coverPhoto || '');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const storage = getStorage();

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setDate(new Date(event.date));
      setTime(new Date(event.time));
      setLocation(event.location);
      setCategory(event.category);
      setCoverPhoto(event.coverPhoto);
      setImageUrl(event.coverPhoto);
    }
  }, [event]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      setCoverPhoto(uri);
      await uploadImage(uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You need to be logged in to upload an image.');
        return;
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `eventPosts/${user.uid}/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
    } catch (error) {
      Alert.alert('Error', 'Error uploading image: ' + error.message);
    }
  };

  const handleSaveEvent = async () => {
    if (!title || !description || !date || !time || !location || !category || !imageUrl) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      const user = auth.currentUser;

      if (isEdit && event?.id) {
        await updateDoc(doc(db, 'events', event.id), {
          title,
          description,
          date: date.toISOString(),
          time: time.toISOString(),
          location,
          category,
          coverPhoto: imageUrl,
        });
        Alert.alert('Success', 'Event updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addDoc(collection(db, 'events'), {
          title,
          description,
          date: date.toISOString(),
          time: time.toISOString(),
          location,
          category,
          coverPhoto: imageUrl,
          organizer: user.uid,
          participants: [],
          likes: 0,
          likedBy: {}
        });
        Alert.alert('Success', 'Event added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Error saving event: ' + error.message);
    }
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (selectedDate) => {
    setDate(selectedDate);
    hideDatePicker();
  };

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleConfirmTime = (selectedTime) => {
    setTime(selectedTime);
    hideTimePicker();
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter event title"
      />
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Enter event description"
      />
      <Text style={styles.label}>Date</Text>
      <TouchableOpacity onPress={showDatePicker} style={styles.input}>
        <Text>{date ? date.toDateString() : "Select Date"}</Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
      />
      <Text style={styles.label}>Time</Text>
      <TouchableOpacity onPress={showTimePicker} style={styles.input}>
        <Text>{time ? time.toLocaleTimeString() : "Select Time"}</Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={hideTimePicker}
      />
      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter event location"
      />
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoriesContainer}>
        {categories.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryItem,
              category === item && styles.categoryItemSelected
            ]}
            onPress={() => setCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                category === item && styles.categoryTextSelected
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Cover Photo</Text>
      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Pick an image</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleSaveEvent}>
        <Text style={styles.buttonText}>{isEdit ? "Update Event" : "Add Event"}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0f4f7',
  },
  label: {
    fontSize: 16,
    color: '#06038D',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 15,
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
  },
  imagePicker: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  imageText: {
    color: '#06038D',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#06038D',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryItem: {
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: '#06038D',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  categoryItemSelected: {
    backgroundColor: '#06038D',
  },
  categoryText: {
    color: '#06038D',
  },
  categoryTextSelected: {
    color: '#fff',
  },
});

export default AddEventScreen;
