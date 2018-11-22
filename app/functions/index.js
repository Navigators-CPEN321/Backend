const functions = require('firebase-functions');
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const settings = {/* your settings... */ timestampsInSnapshots: true };
admin.firestore().settings(settings);

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
	0: null,
	1: null
};
var extra_categories_size = 2; // how many categories we will allow after the main

var group_cost_max = 0;
var category_map = {
	"nightlife": 0,
	"charities": 0,
	"other": 0,
	"food-and-drink": 0,
	"sports-active-life": 0,
	"festivals-fair": 0,
	"visual-arts": 0,
	"performing-arts": 0
};



exports.selectEvents = functions.https.onRequest((req, res) => {
	// reset the global variables
	const req_group = req.query.text;

	category_map = {
		"nightlife": 0,
		"charities": 0,
		"other": 0,
		"food-and-drink": 0,
		"sports-active-life": 0,
		"festivals-fair": 0,
		"visual-arts": 0,
		"performing-arts": 0
	};
	group_cost_max = 0;

	var j;
	for (j = 0; j < extra_categories_size; j++) {
		extra_categories[j] = null;
	}
	var group = admin.firestore().collection("groups").doc(req_group);

	group.get().then(function (doc) {
		var group_data = doc.data();
		var i;

		// go through each pref doc and 'average' out the prefs
		for (i = 1; i <= group_data.size; i++) {
			group.collection("prefs").doc("pref".concat(i.toString())).get().then(function (doc) {
				var pref_data = doc.data();
				// we only sum the costs for now, later we will average
				console.log("cost ", pref_data.cost_max);
				console.log("category ", pref_data.category);
				group_cost_max += pref_data.cost_max;
				category_map[pref_data.category]++;
				group_category = geth(category_map);
				var setWithMerge = group.set({
					category: group_category,
					cost_max: group_cost_max
				}, { merge: true });
			})
		}
	})
	// delete the previous selected events for that group if any
	deleteSelEvents(req_group);
	res.send("Done select events");
});


exports.findGroupEvents = functions.https.onRequest((req, res) => {
	const req_group = req.query.text;
	var group = admin.firestore().collection("groups").doc(req_group);
	var events_pool = admin.firestore().collection("events");
	var sel_events = group.collection("sel_events");

	group.get().then(function (doc) {
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
	console.log("hiiiii");
	res.send("Done find group events");
});

function getParent(snapshot) {
	// You can get the reference (A Firebase object) from a snapshot
	// using .ref().
	console.log("Get Parent was called ")

	var ref = snapshot.ref;
	// Now simply find the parent and return the name.
	console.log("REFNAME:" + ref.parent.parent.id);
	return ref.parent.parent.id;
}

exports.onPrefUpdate =
	functions.firestore.document("groups/{group}/prefs/{pref}").onWrite(change => {

		console.log("ON PREF was called 1");
		const before = change.before;
		const req_group = getParent(before);
		console.log("groupName: ", req_group);

		//INITIALIZE CATEGORY MAP
		category_map = {
			"nightlife": 0,
			"charities": 0,
			"other": 0,
			"food-and-drink": 0,
			"sports-active-life": 0,
			"festivals-fair": 0,
			"visual-arts": 0,
			"performing-arts": 0
		};
		group_cost_max = 0;

		var j;
		for (j = 0; j < extra_categories_size; j++) {
			extra_categories[j] = null;
		}
		var group = admin.firestore().collection("groups").doc(req_group);

		group.get().then(function (doc) {
			var group_data = doc.data();
			var i;

			// go through each pref doc and 'average' out the prefs
			const promises = [];
			for (i = 1; i <= 3; i++) {
				console.log("attempting to find pref" + i);
				const p = group.collection("prefs").doc("pref".concat(i.toString())).get();
				console.log("found pref" + i);
				promises.push(p);
			}
			return Promise.all(promises);
		})
			.then(prefSnapshots => {
				prefSnapshots.forEach(prefSnap => { 
					console.log("pref: ", pref_data.id);	
					var pref_data = prefSnap.data();
					// we only sum the costs for now, later we will average
					console.log("cost ", pref_data.cost_max);
					console.log("category ", pref_data.category);
					group_cost_max += pref_data.cost_max;
					category_map[pref_data.category]++;
					group_category = geth(category_map);
				})
				return group.set({
					category: group_category,
					cost_max: group_cost_max
				}, { merge: true });
			})
			.catch(error=>{
				console.log("promisers didn't finish");
				return group.set({
					category: group_category,
					cost_max: group_cost_max
				}, { merge: true });
			})
	
	})
// delete the previous selected events for that group if any
//deleteSelEvents(req_group);
//REINITIALIZE CATEGORY MAP




/* Function found online to return the key with max value
geth({hi:0, hello:1, devi:2, avi:5}) would return avi */

function geth(o) {
	var vals = [];
	for (var i in o) {
		vals.push(o[i]);
	}

	var max = Math.max.apply(null, vals);

	for (var i in o) {
		if (o[i] == max) {
			return i;
		}
	}
}

function deleteSelEvents(group_name) {
	var jobskill_query = admin.firestore().collection('groups').doc(group_name).collection('sel_events');
	jobskill_query.get().then(function (querySnapshot) {
		querySnapshot.forEach(function (doc) {
			doc.ref.delete();
		});
	});

}

/**************************NOT USED RIGHT NOW *****************************/
/*
exports.writePrefs = functions.https.onRequest((req, res) => {
	const req_group = req.query.text;
	var group = admin.firestore().collection("groups").doc(req_group);
	group.get().then(function (doc) {
		var group_data = doc.data();
		// get the most popular category
		group_category = geth(category_map);

		// loop through and select more categories
		var i;
		var best_category = group_category;
		for(i=0; i<extra_categories_size; i++){
			category_map[best_category] = 0;
			extra_categories[i] = geth(category_map);
			best_category = extra_categories[i];
		}
		

		// average the cost_max 
		group_cost_max /= group_data.size;

		// write the new found preferences to the group doc
		var setWithMerge = group.set({
			category: group_category,
			cost_max: group_cost_max
		}, { merge: true });
	})
	console.log(" category is ", group_category, " cost_max is ", group_cost_max);
	res.send("Done write prefs");
}); */

