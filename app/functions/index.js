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
var group_category1;
var group_category2;

var group_cost_max = 0;
var category_map = {
	"nightlife": 0,
	"food-and-drink": 0,
	"sports-active-life": 0,
	"festivals-fairs": 0,
	"arts": 0
};
var group_lat = 0;
var group_long = 0;


/**************************************************************************************************************************************************** */
function getParent(snapshot) {
	// You can get the reference (A Firebase object) from a snapshot
	// using .ref().


	var ref = snapshot.ref;
	// Now simply find the parent and return the name.

	return ref.parent.parent.id;
}

exports.onPrefUpdate =
	functions.firestore.document("groups/{group}/prefs/{pref}").onWrite(change => {

		const before = change.before;
		const req_group = getParent(before);

		category_map = {
			"nightlife": 0,
			"food-and-drink": 0,
			"sports-active-life": 0,
			"festivals-fairs": 0,
			"arts": 0
		};
		group_cost_max = 0;
		group_lat = 0;
		group_long = 0;

		var group = admin.firestore().collection("groups").doc(req_group);
		var location_count = 0;
		var group_size =1;
		group.get().then(function (doc) {
			var group_data = doc.data();
			location_count = group_data.size;
			group_size = group_data.size;
			var i;

			// go through each pref doc and 'average' out the prefs

			group.collection("prefs").get()
				.then(prefCol => {
					prefCol.docs.forEach(prefSnap => {
						if (prefSnap.exists) {
							var pref_data = prefSnap.data();

							// we only sum the costs for now, later we will average
							group_cost_max += pref_data.cost_max;
							if (pref_data.category != null) {
								category_map[pref_data.category]++;
							}
							group_category = geth(category_map);
							if (pref_data.longitude == 0) {
								location_count--;
							}
							else {
								group_lat += pref_data.latitude;
								group_long += pref_data.longitude;
							}
						}
					})
					group_cost_max /= group_size;
					if (location_count != 0) {
						group_long /= location_count;
						group_lat /= location_count;
					}
					return group.collection("groupprefs").doc("groupprefs").set({
						category: group_category,
						cost_max: group_cost_max,
						longitude: group_long,
						latitude: group_lat
					}, { merge: true });
				})
				.catch(error => {
					console.log(error);
					return null;
				})
		})

		return 0;
	})


exports.onGroupUpdate =
	functions.firestore.document("groups/{group}/groupprefs/{groupprefs}").onWrite(change => {
		const group_data = change.after.data();
		const group = getParent(change.after);
		var cost = group_data.cost_max;
		deleteSelEvents(group);
		var price;
		var event_dists = [];
		if (cost > 80) {
			price = "4";
		}
		else if (cost > 60) {
			price = "3";
		}
		else if (cost > 30) {
			price = "2";
		}
		else {
			price = "1";
		}
		var num_price = parseInt(price, 10);
		var promises = [];
		while (num_price >= 1) {
			const p = admin.firestore().collection(group_data.category).doc("events").collection(price).get()
			promises.push(p);
			num_price--;
			price = num_price.toString();
		}
		Promise.all(promises).then(eventSnapshots => {
			eventSnapshots.forEach(eventColSnap => {
				eventColSnap.docs.forEach(eventSnap => {
					var event_data = eventSnap.data();
					var lat1 = event_data.coordinates.latitude;
					var lon1 = event_data.coordinates.longitude;
					var lat2 = group_data.latitude;
					var lon2 = group_data.longitude;
					var dist = getDistance(lat1, lon1, lat2, lon2);
					var eventName = eventSnap.ref.id;
					var json = {};
					json["eventid"] = eventName;
					json["dist"] = dist;
					json["price"] = eventSnap.ref.parent.id;
					event_dists.push(json);
				})
			})
			event_dists.sort(compare);
			var k;
			var promises1 = [];
			var limit;
			if (event_dists.length < 10) {
				limit = event_dists.length;
			}
			else {
				limit = 10;
			}
			for (k = 0; k < limit; k++) {
				const p1 = admin.firestore().collection(group_data.category).doc("events").collection(event_dists[k].price).doc(event_dists[k].eventid).get()
				promises1.push(p1);
			}
			Promise.all(promises1).then(eventArr => {
				var h;
				for (h = 0; h < eventArr.length; h++) {
					admin.firestore().collection('groups').doc(group).collection('sel_events').doc("event".concat(h.toString())).set({ dist: event_dists[h].dist }, { merge: true });
					admin.firestore().collection('groups').doc(group).collection('sel_events').doc("event".concat(h.toString())).set(eventArr[h].data(), { merge: true });

				}
			})

		})
			.catch(err => {
				console.log(err);
				return null;
			})

		return 0;

	})


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

function getDistance(lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1);  // deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2)
		;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI / 180)
}

function compare(a, b) {
	var distanceA = a.dist;
	var distanceB = b.dist;

	if (distanceA < distanceB)
		return -1;
	if (distanceA > distanceB)
		return 1;
	return 0;
}



