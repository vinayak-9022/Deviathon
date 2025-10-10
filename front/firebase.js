// <!-- firebase.js -->

  
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

  
  const firebaseConfig = {
    apiKey: "AIzaSyAePGpDRmz3R4UaxEeqiVTaaMsYx2s44qM",
            authDomain: "blitza-9fa4a.firebaseapp.com",
            projectId: "blitza-9fa4a",
            storageBucket: "blitza-9fa4a.firebasestorage.app",
            messagingSenderId: "818364742419",
            appId: "1:818364742419:web:bc34d1cb20d2b6216d38e6",
            measurementId: "G-QZ58N8V3XT"
                };


  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getFirestore(app);

