const firebaseConfig = {
    apiKey: "AIzaSyDDbL0FAz_qayw5H8mhgmSPmBK1pHUWdCE",
    authDomain: "prox-f7f71.firebaseapp.com",
    databaseURL: "https://prox-f7f71-default-rtdb.firebaseio.com",
    projectId: "prox-f7f71",
    storageBucket: "prox-f7f71.appspot.com",
    messagingSenderId: "211025205379",
    appId: "1:211025205379:web:8323530cfb097891ee63b6",
    measurementId: "G-X0F0F56B1F"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);


  const auth =  firebase.auth();
  var database = firebase.database();


function getData(folder, selectval, requirement){
    var user_ref = database.ref([folder]+ "/" + [selectval])
    user_ref.once("value", function(snapshot) {
    var data = snapshot.val();
    console.log(data.requirement);
    return data.requirement;
  })
}

function setData(folder, folder2, value, oldval){
    //alert('hi')
    database.ref([folder] + '/folder2/').set({
        [oldval] : value
    })
    //alert("coin val saved");

}


function deviceValidation(value){
    var user_ref = database.ref('id'+ "/" + [selectval])
    user_ref.once("value", function(snapshot) {
    var data = snapshot.val();
    console.log(data.requirement);
    return data.requirement;
  })
}