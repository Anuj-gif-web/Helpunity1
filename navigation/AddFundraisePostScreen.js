import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { db, auth } from '../firebase/firebaseconfig'; // Assuming you have imported auth for getting the current user
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Linking from 'expo-linking';

const categories = [
  "Animals", "Business", "Community", "Competitions", "Creative",
  "Education", "Emergencies", "Environment", "Events", "Faith",
  "Family", "Funerals & Memorials", "Medical", "Monthly Bills",
  "Newlyweds", "Other", "Sports", "Travel", "Ukraine Relief",
  "Volunteer", "Wishes"
];

const recipients = ["Yourself", "Someone Else", "Charity or Organization"];

const AddFundraisePostScreen = ({ navigation }) => {
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const storage = getStorage();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      console.log("Image picked successfully:", uri);
      setCoverPhoto(uri);
      await uploadImage(uri);
    } else {
      console.log("Image picking canceled");
    }
  };

  const uploadImage = async (uri) => {
    try {
      console.log("Starting image upload:", uri);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You need to be logged in to upload an image.');
        return;
      }

      const response = await fetch(uri);
      console.log("Fetched image blob successfully");
      const blob = await response.blob();
      console.log("Converted image to blob");

      const storageRef = ref(storage, `fundraisePosts/${user.uid}/${Date.now()}`);
      console.log("Storage reference created:", storageRef.fullPath);

      await uploadBytes(storageRef, blob);
      console.log("Image uploaded successfully to storage");

      const url = await getDownloadURL(storageRef);
      console.log("Image download URL fetched:", url);

      setImageUrl(url);
    } catch (error) {
      console.error("Error uploading image: ", error);
      Alert.alert('Error', 'Error uploading image: ' + error.message);
    }
  };

  const generateDynamicLink = async (postId, title) => {
    try {
      const link = await Linking.createURL(`/fundraisePost/${postId}`, {
        queryParams: { title },
      });
      return link;
    } catch (error) {
      console.error("Error generating dynamic link: ", error);
      Alert.alert('Error', 'There was an error generating the shareable link. Please try again.');
    }
  };

  const toggleCategorySelection = (category) => {
    setSelectedCategories((prevSelectedCategories) =>
      prevSelectedCategories.includes(category)
        ? prevSelectedCategories.filter((item) => item !== category)
        : [...prevSelectedCategories, category]
    );
  };

  const handleAddPost = async () => {
    console.log("Selected Recipient:", selectedRecipient);
    console.log("Selected Categories:", selectedCategories);
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Goal:", goal);
    console.log("Image URL:", imageUrl);

    if (!selectedRecipient || !selectedCategories.length || !title || description.split(' ').length < 100 || !goal || !imageUrl) {
      Alert.alert('Error', 'All fields are required, and the description must be at least 100 words.');
      return;
    }

    try {
      const user = auth.currentUser; // Get the current user
      const docRef = await addDoc(collection(db, 'fundraisePosts'), {
        recipient: selectedRecipient,
        categories: selectedCategories,
        title,
        description,
        goal,
        coverPhoto: imageUrl,
        createdAt: new Date(),
        userId: user.uid,  // Store the userId
        userName: user.displayName, // Store the userName if available
      });
      console.log("Post added successfully");

      const dynamicLink = await generateDynamicLink(docRef.id, title);
      await updateDoc(doc(db, 'fundraisePosts', docRef.id), {
        shareLink: dynamicLink,
      });

      // Fetch the newly added post data
      const newPostDoc = await getDoc(doc(db, 'fundraisePosts', docRef.id));
      const newPost = { id: newPostDoc.id, ...newPostDoc.data() };

      Alert.alert('Success', 'Fundraise post added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.reset({
            index: 0,
            routes: [
              { name: 'Fundraise' },
              { name: 'FundraisePostDetails', params: { post: newPost } }
            ]
          })
        }
      ]);
    } catch (error) {
      console.error("Error adding post:", error);
      Alert.alert('Error', "Error adding fundraise post: " + error.message);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Whom are you raising money for?</Text>
      <View style={styles.tagsContainer}>
        {recipients.map((recipient, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tag,
              selectedRecipient === recipient && styles.tagSelected,
            ]}
            onPress={() => setSelectedRecipient(recipient)}
          >
            <Text style={selectedRecipient === recipient ? styles.tagTextSelected : styles.tagText}>
              {recipient}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Categories</Text>
      <View style={styles.tagsContainer}>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tag,
              selectedCategories.includes(category) && styles.tagSelected,
            ]}
            onPress={() => toggleCategorySelection(category)}
          >
            <Text style={selectedCategories.includes(category) ? styles.tagTextSelected : styles.tagText}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter title"
      />

      <Text style={styles.label}>Description (at least 100 words)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Enter description"
      />

      <Text style={styles.label}>Cover Photo</Text>
      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {coverPhoto ? <Image source={{ uri: coverPhoto }} style={styles.image} /> : <Text style={styles.imageText}>Pick an image</Text>}
      </TouchableOpacity>

      <Text style={styles.label}>Goal ($)</Text>
      <TextInput
        style={styles.input}
        value={goal}
        onChangeText={setGoal}
        keyboardType="numeric"
        placeholder="Enter goal"
      />

      <TouchableOpacity style={styles.button} onPress={handleAddPost}>
        <Text style={styles.buttonText}>Add Post</Text>
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tag: {
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: '#06038D',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  tagSelected: {
    backgroundColor: '#06038D',
  },
  tagText: {
    color: '#06038D',
  },
  tagTextSelected: {
    color: '#fff',
  },
  input: {
    width: '100%',
    padding: 15,
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddFundraisePostScreen;
