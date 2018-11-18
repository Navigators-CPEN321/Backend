document.addEventListener("DOMContentLoaded", event => {
    const app = firebase.app();
	const db = firebase.firestore();
	const settings = {timestampsInSnapshots: true};
	db.settings(settings);
});

const functions = require('firebase-functions');

exports.yelpAPI = functions.https.onCall((parameter) => {
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
    // loop through all events in payload and name them event0, event1 ...
	for(i=0; i< payload.events.length; i++){
		eventsColl.doc("event".concat(i.toString())).set(payload.events[i]);
	}
}).on('error', function (payload) {
	throw new functions.https.HttpsError('unknown');
});
	
}); // end of yelpAPI function

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

