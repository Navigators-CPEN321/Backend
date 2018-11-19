const functions = require('firebase-functions');
const firebase = require("firebase-admin");
firebase.initializeApp(functions.config().firebase);


const settings = {/* your settings... */ timestampsInSnapshots: true};
firebase.firestore().settings(settings);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });



/***********************OUR FUNCTIONS************************/

// global variables for preferences
var group_category;

var extra_categories = {
	0:null,
	1:null
};
var extra_categories_size = 2; // how many categories we will allow after the main

var group_cost_max=0;
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

exports.selectEvents = functions.https.onCall((parameter) => {
    // reset the global variables
	category_map = {
		"nightlife":0,
		"charities":0,
		"other":0,
		"food-and-drink":0,
		"sports-active-life":0,
		"festivals-fair":0,
		"visual-arts":0,
		"performing-arts":0
		};
	 group_cost_max=0;

	var j;
	for(j=0; j<extra_categories_size; j++){
		extra_categories[j] = null;
	}
	var group = firebase.firestore().collection("groups").doc(parameter.group);

	group.get().then(function(doc) {
	var group_data = doc.data();
	var i;
	
	// go through each pref doc and 'average' out the prefs
	for(i=1; i<=group_data.size; i++){
		group.collection("prefs").doc("pref".concat(i.toString())).get().then(function(doc) {
		var pref_data = doc.data();
		// we only sum the costs for now, later we will average
		group_cost_max += pref_data.cost_max;
		category_map[pref_data.category]++;
	})
}
})
});

exports.writePrefs = functions.https.onCall((parameter) => {
    firebase.firestore().collection("groups").doc("hi").set({yes:"works"});
	var group = firebase.firestore().collection("groups").doc(parameter.group);
	group.get().then(function(doc) {
	var group_data = doc.data();
	// get the most popular category
	group_category = geth(category_map);
	
	/* loop through and select more categories
	var i;
	var best_category = group_category;
	for(i=0; i<extra_categories_size; i++){
		category_map[best_category] = 0;
		extra_categories[i] = geth(category_map);
		best_category = extra_categories[i];
	}
	*/

	// average the cost_max 
	group_cost_max /= group_data.size;

	// write the new found preferences to the group doc
	var setWithMerge = group.set({
		category: group_category,
		cost_max: group_cost_max
	}, { merge: true });
	})

});

exports.findGroupEvents = functions.https.onCall((parameter) => {
	var group = firebase.firestore().collection("groups").doc(parameter.group);
	var events_pool = firebase.firestore().collection("events");
	var sel_events = group.collection("sel_events");

	group.get().then(function(doc) {
		var group_data = doc.data();
		var i = 0;
		// query for the events
		var query = events_pool.where('category', '==', group_data.category).get()
    		.then(snapshot => {
     		 snapshot.forEach(event_doc => {
				// write the events found to sel_events collection
				sel_events.doc("event".concat(i.toString())).set(event_doc.data());
				i++;
      });
    })
	
	
	})
});


/* Function found online to return the key with max value
geth({hi:0, hello:1, devi:2, avi:5}) would return avi */

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