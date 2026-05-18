import AsyncStorage
  from '@react-native-async-storage/async-storage';


// ---------------------------------
// SAVE TOKEN
// ---------------------------------

export async function saveToken(
  token
) {

  try {

    await AsyncStorage.setItem(
      'token',
      token
    );

  } catch (error) {

    console.log(
      'SAVE TOKEN ERROR:',
      error
    );

  }

}


// ---------------------------------
// GET TOKEN
// ---------------------------------

export async function getToken() {

  try {

    return await AsyncStorage.getItem(
      'token'
    );

  } catch (error) {

    console.log(
      'GET TOKEN ERROR:',
      error
    );

    return null;

  }

}


// ---------------------------------
// REMOVE TOKEN
// ---------------------------------

export async function removeToken() {

  try {

    await AsyncStorage.removeItem(
      'token'
    );

  } catch (error) {

    console.log(
      'REMOVE TOKEN ERROR:',
      error
    );

  }

}