import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal, StyleSheet, Share, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase/firebaseconfig';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import Checkbox from 'expo-checkbox';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const categories = [
  "Environment", "Education", "Health", "Community", "Sports",
  "Arts & Culture", "Animals", "Emergency Response", "Technology",
  "Science", "Other"
];

const predefinedLocations = ["East Lansing, MI", "Ann Arbor, MI", "Detroit, MI", "Grand Rapids, MI"];

const ExploreScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [location, setLocation] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const locationInputRef = useRef();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'events'));
        const eventsList = [];
        for (const document of querySnapshot.docs) {
          const data = document.data();
          if (!data.likes) {
            data.likes = 0;
            data.likedBy = {};
          }
          if (data.organizer) {
            const organizerDoc = await getDoc(doc(db, 'users', data.organizer));
            data.organizerName = organizerDoc.exists() ? `${organizerDoc.data().name} ${organizerDoc.data().lastName}` : 'Unknown';
          }
          eventsList.push({ id: document.id, ...data });
        }
        setEvents(eventsList);
        setFilteredEvents(eventsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events: ", error);
      }
    };

    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: currentUser.uid, ...userDoc.data() });
        }
      }
    };

    fetchEvents();
    fetchUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, selectedCategories, location, selectedDate]);

  const applyFilters = () => {
    let filtered = events;

    if (searchText) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchText.toLowerCase()) ||
        event.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (event.categories && event.categories.some(category => category.toLowerCase().includes(searchText.toLowerCase())))
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event =>
        event.categories && selectedCategories.every(category => event.categories.includes(category))
      );
    }

    if (location) {
      filtered = filtered.filter(event => event.location.toLowerCase().includes(location.toLowerCase()));
    }

    if (selectedDate) {
      filtered = filtered.filter(event => new Date(event.date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString());
    }

    setFilteredEvents(filtered);
  };

  const toggleCategorySelection = (category) => {
    setSelectedCategories(prevSelectedCategories =>
      prevSelectedCategories.includes(category)
        ? prevSelectedCategories.filter(item => item !== category)
        : [...prevSelectedCategories, category]
    );
  };

  const handleLike = async (eventId, likes, userLiked) => {
    if (!user) {
      alert("Please log in to like events.");
      return;
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      if (userLiked) {
        await updateDoc(eventRef, {
          likes: likes - 1,
          [`likedBy.${user.uid}`]: false
        });
        setFilteredEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId ? { ...event, likes: likes - 1, likedBy: { ...event.likedBy, [user.uid]: false } } : event
          )
        );
      } else {
        await updateDoc(eventRef, {
          likes: likes + 1,
          [`likedBy.${user.uid}`]: true
        });
        setFilteredEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId ? { ...event, likes: likes + 1, likedBy: { ...event.likedBy, [user.uid]: true } } : event
          )
        );
      }
    } catch (error) {
      console.error("Error liking event: ", error);
    }
  };

  const handleShare = async (eventId) => {
    try {
      await Share.share({
        message: `Check out this volunteer event: https://example.com/events/${eventId}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

  const renderItem = ({ item }) => {
    const userLiked = item.likedBy && item.likedBy[user?.uid];

    return (
      <TouchableOpacity onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}>
        <View style={styles.postCard}>
          <View>
            <Image source={{ uri: item.coverPhoto }} style={styles.postImage} />
            <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item.id)}>
              <View style={styles.shareButtonSquare}>
                <MaterialCommunityIcons name="share" size={24} color="#06038D" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.postContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id, item.likes || 0, userLiked)}>
                <MaterialCommunityIcons
                  name={userLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={userLiked ? 'red' : 'gray'}
                />
                {item.likes > 0 && (
                  <Text style={[styles.likeButtonText, userLiked && { color: 'red' }]}>{item.likes}</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              <View style={styles.tagContainer}>
                <Text style={styles.tag}>{item.category}</Text>
              </View>
            </View>
            <View style={styles.authorContainer}>
              <MaterialCommunityIcons name="account-supervisor-circle" size={24} color="#06038D" />
              <Text style={styles.authorName}>{item.organizerName || 'Unknown'}</Text>
            </View>
            <Text style={styles.postDate}>{new Date(item.date).toLocaleDateString()} at {new Date(item.time).toLocaleTimeString()}</Text>
            <Text style={styles.postLocation}>Location: {item.location}</Text>
            <Text style={styles.postDescription}>{item.description.slice(0, 100)}...</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setLocation('');
    setSelectedDate(null);
    if (locationInputRef.current) {
      locationInputRef.current.clear();
    }
  };

  const handlePredefinedLocationPress = (loc) => {
    setLocation(prevLocation => (prevLocation === loc ? '' : loc));
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredEvents}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEvent')}>
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <View style={styles.clearContainer}>
                <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="#06038D" />
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              ListHeaderComponent={
                <>
                  <Text style={styles.filterLabel}>Location</Text>
                  <View style={{ marginBottom: 10 }}>
                    <GooglePlacesAutocomplete
                      ref={locationInputRef}
                      placeholder='Search for a location'
                      onPress={(data, details = null) => {
                        setLocation(data.description);
                      }}
                      query={{
                        key: 'AIzaSyChZuO8bU5yIndByodLwETLKFXKS4kJmSA',
                        language: 'en',
                      }}
                      styles={{
                        textInputContainer: {
                          backgroundColor: 'white',
                          paddingHorizontal: 0,
                        },
                        textInput: {
                          height: 38,
                          color: '#5d5d5d',
                          fontSize: 16,
                          paddingLeft: 10,
                        },
                        predefinedPlacesDescription: {
                          color: '#1faadb',
                        },
                      }}
                      textInputProps={{
                        style: { height: 38, color: '#5d5d5d', fontSize: 16 },
                        onFocus: () => setIsModalVisible(true),
                      }}
                      enablePoweredByContainer={false}
                    />
                  </View>
                  <View style={styles.locationTagsContainer}>
                    {predefinedLocations.map((loc, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.locationTag,
                          location === loc && styles.selectedLocationTag
                        ]}
                        onPress={() => handlePredefinedLocationPress(loc)}
                      >
                        <Text style={[
                          styles.locationTagText,
                          location === loc && styles.selectedLocationTagText
                        ]}>{loc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.filterLabel}>Date</Text>
                  <TouchableOpacity onPress={showDatePicker} style={styles.input}>
                    <Text>{selectedDate ? selectedDate.toDateString() : "Select Date"}</Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmDate}
                    onCancel={hideDatePicker}
                  />
                  <Text style={styles.filterLabel}>Categories</Text>
                </>
              }
              data={categories}
              renderItem={({ item: category }) => (
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    value={selectedCategories.includes(category)}
                    onValueChange={() => toggleCategorySelection(category)}
                    color={selectedCategories.includes(category) ? '#06038D' : undefined}
                    style={styles.checkbox}
                  />
                  <Text style={styles.checkboxLabel}>{category}</Text>
                </View>
              )}
              keyExtractor={(item) => item}
              ListFooterComponent={<View style={{ height: 200 }} />}
            />
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#06038D',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  filterButton: {
    backgroundColor: '#06038D',
    padding: 10,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    borderColor: '#06038D',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 150,
  },
  shareButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  shareButtonSquare: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#06038D',
  },
  postContent: {
    padding: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06038D',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButtonText: {
    fontSize: 16,
    marginLeft: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  tagContainer: {
    backgroundColor: '#06038D',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 5,
    marginBottom: 5,
  },
  tag: {
    color: '#fff',
    fontSize: 14,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorName: {
    marginLeft: 10,
    fontSize: 18,
    color: '#06038D',
  },
  postDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  postLocation: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  postDescription: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#06038D',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    borderColor: '#06038D',
    borderWidth: 2,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  clearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: 'transparent',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  checkbox: {
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 5,
    width: 20,
    height: 20,
  },
  applyButton: {
    backgroundColor: '#06038D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  locationTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  locationTag: {
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 5,
    marginBottom: 5,
  },
  selectedLocationTag: {
    backgroundColor: '#06038D',
  },
  locationTagText: {
    color: '#06038D',
  },
  selectedLocationTagText: {
    color: '#fff',
  },
});

export default ExploreScreen;
