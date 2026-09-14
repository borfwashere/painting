// Firebase Configuration
// Reemplaza estos valores con los de tu proyecto Firebase Console
// https://console.firebase.google.com

var db = null;

var firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

try {
    if (typeof firebase !== 'undefined' && firebase.initializeApp) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    }
} catch (e) {
    console.warn('Firebase no configurado. Los likes no estarán disponibles.', e.message);
}
