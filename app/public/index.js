document.addEventListener("DOMContentLoaded", event => {
    const app = firebase.app();
	const db = firebase.firestore();
	const settings = {timestampsInSnapshots: true};
	db.settings(settings);
});


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
    // loop through all events in payload and name them event0, event1 ...
	for(i=0; i< payload.events.length; i++){
		eventsColl.doc("event".concat(i.toString())).set(payload.events[i]);
	}
}).on('error', function (payload) {
	console.log("YELP Error");
});
	
} // end of yelpAPI function

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

function selectEvents(){
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
	var group = firebase.firestore().collection("groups").doc("group_test");

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
}

function writePrefs(){

	var group = firebase.firestore().collection("groups").doc("group_test");
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

}

function findGroupEvents(){
	var group = firebase.firestore().collection("groups").doc("group_test");
	var events_pool = firebase.firestore().collection("events_test");
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
}

function testFunctions(){
	var group = firebase.firestore().collection("groups").doc("group_test");
	var sel_events = group.collection("sel_events");
	
	group.get().then(function(doc) {
		var group_data = doc.data();
		console.log("Checking internal global variables");
		console.log("Expected cost_max: 80" ); // cost_max == 240/3
		console.log("Actual   cost_max:",group_cost_max);

		console.log("Expected category: food-and-drink");
		console.log("Actual   category:",group_category);

		console.log("Checking the group document values");
		console.log("Expected cost_max: 80" ); // cost_max == 240/3
		console.log("Actual   cost_max:",group_data.cost_max);

		console.log("Expected category: food-and-drink");
		console.log("Actual   category:",group_data.category); // category == food-and-drink
	
	})

	// seperately test max function
	
	var test_map = {
		"one":0,
		"two":1,
		"three":2
		};
	console.log("Checking the max map function");
	console.log("Expected max key: three");
	console.log("Actual   max key:",geth(test_map));

	test_map = {
		"one":0,
		"two":6,
		"three":2
		};
	console.log("Expected max key: two");
	console.log("Actual   max key:",geth(test_map));


	test_map = {
		"one":-1,
		"two":0,
		"three":-9
		};

		console.log("Expected max key: two");
		console.log("Actual   max key:",geth(test_map));

	var test_map1 = {
		"one":0,
		};
	console.log("Expected max key: one");
	console.log("Actual   max key:",geth(test_map1));


}
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

