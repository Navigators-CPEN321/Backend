document.addEventListener("DOMContentLoaded", event => {
    const app = firebase.app();
	const db = firebase.firestore();
	const settings = {timestampsInSnapshots: true};
	db.settings(settings);
    const users = db.collection("users");
	const groups = db.collection("groups");
	

});


function googleLogin(){
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
}

function yelpAPI(){
var rapid = new RapidAPI("default-application_5bc03cd1e4b085e3f4089782", "9981cbba-80fd-41b4-b5bb-d76e8ee35535");
rapid.call('YelpAPI', 'searchEvent', { 
	'startDate': '2018-10-31 00:00:00',
	'coordinates': '49.254336, -123.082367',
	'accessToken': 'kI2t_FjvbnaP1MWJJ4HJipvZw0qWAWCUojI2djViwUgOvlnLGfDneZwZITiHqWiKgtmsusyrp-o_jSG1wAPwZbcxkMiXyD8BC_ISajmEvJuYUPBZMrl6IiULzQTAW3Yx',
	'locale': 'en_CA',
	'limit': '50',
	'sortBy': 'desc',
	'sortOn': 'time_start',
	'location': 'Vancouver',
	'radius': '40000'

}).on('success', function (payload) {
	var i;
	eventsColl =firebase.firestore().collection("events");
	for(i=0; i< payload.events.length; i++){
		eventsColl.doc("event".concat(i.toString())).set(payload.events[i]);
	}
}).on('error', function (payload) {
	console.log('errrrrorrrr');
});
}

////////////////////////////////////////////////////////////////////////

function selectEvents(callback){
	var category;
	var max_cost=0;
	var category_map = {
	"nightlife":0,
	"charities":0,
	"other":0,
	"food-and-drink":0,
	"sports-active-life":0,
	"festivals-fair":0,
	"visual-arts":0,
	"performing-arts":0
};
	var group1 = firebase.firestore().collection("groups").doc("group1");
	console.log("first function");
	group1.get().then(function(doc) {
	var data = doc.data();
	var i;
		
	for(i=0; i<data.size; i++){
		console.log("for loop");
		data.members[i].get().then(function(doc) {
		var data1 = doc.data();
		max_cost = max_cost + data1.cost_max;
		category_map[data1.category]++;
	})
}
})
callback();
}

function callBackEvent(){
	console.log("callback function");
	var group1 = firebase.firestore().collection("groups").doc("group1");
	group1.get().then(function(doc) {
	var data = doc.data();
	category = geth(category_map);
	max_cost = max_cost/data.members.length;
	console.log(category_map);
	console.log(max_cost);
	console.log(category);
	var setWithMerge = group1.set({
		category: category,
		cost_max: max_cost
	}, { merge: true });
	})
}



function geth(o){
    var vals = [];    
    for(var i in o){
       vals.push(o[i]);
    }

    var max = Math.max.apply(null, vals);

     for(var i in o){
        if(o[i] == max){
            return i;
        }
    }
}