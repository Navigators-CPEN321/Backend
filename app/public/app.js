document.addEventListener("DOMContentLoaded", event => {
    const app = firebase.app();
    const db = firebase.firestore();
    const users = db.collection('users');
    const groups = db.collection('groups');
    const events = db.collection('events');
    var rapid = new RapidAPI("default-application_5bc03cd1e4b085e3f4089782", "9981cbba-80fd-41b4-b5bb-d76e8ee35535");
});


function googleLogin(){
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
}





rapid.call('YelpAPI', 'searchEvent', { 
	'startDate': '2018-10-12 00:00:00',
	'coordinates': '49.263633, -123.246195',
	'accessToken': 'kI2t_FjvbnaP1MWJJ4HJipvZw0qWAWCUojI2djViwUgOvlnLGfDneZwZITiHqWiKgtmsusyrp-o_jSG1wAPwZbcxkMiXyD8BC_ISajmEvJuYUPBZMrl6IiULzQTAW3Yx',
	'locale': 'en_CA',
	'limit': '50',
	'endDate': '2019-01-01 00:00:00',
	'location': 'Vancouver',
	'radius': '39991'

}).on('success', function (payload) {
	 /*YOUR CODE GOES HERE*/ 
}).on('error', function (payload) {
	 /*YOUR CODE GOES HERE*/ 
});