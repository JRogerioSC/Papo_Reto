import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Import the functions you need from the SDKs you need
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA9yFDYtrt4vDBSiA2rv4F0FsMUddQCpUE",
    authDomain: "paporeto-a7727.firebaseapp.com",
    projectId: "paporeto-a7727",
    storageBucket: "paporeto-a7727.appspot.com",
    messagingSenderId: "952785633903",
    appId: "1:952785633903:web:09c0b6eef083ffca3f039a",
    measurementId: "G-JLX5JEWWEY"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  export default app;